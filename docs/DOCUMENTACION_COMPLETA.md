# 📚 DOCUMENTACIÓN COMPLETA - ECOMMERCE NEXT.JS + WOOCOMMERCE

## 🎯 INTRODUCCIÓN Y PROPÓSITO

Este proyecto demuestra cómo construir un **ecommerce moderno y escalable** conectado a WooCommerce usando Next.js 15. La documentación explica **por qué** tomamos cada decisión técnica y **cómo** implementar cada funcionalidad desde cero.

### ¿Por qué este Stack?

**Next.js 15 + React 19:**
- **Server-Side Rendering (SSR)** para mejor SEO en productos
- **App Router** para estructura de rutas más intuitiva  
- **API Routes** para crear nuestro propio backend sin servidor adicional
- **Optimizaciones automáticas** de imágenes y fonts
- **TypeScript nativo** para desarrollo más seguro

**WooCommerce como Backend:**
- **Gestión de productos ya resuelta** (inventario, categorías, variantes)
- **Panel de administración completo** para no-técnicos
- **Ecosystem maduro** con plugins y extensiones
- **REST API robusta** con documentación completa
- **Escalabilidad probada** en millones de tiendas

**Context API + localStorage:**
- **Estado global sencillo** sin complejidad de Redux
- **Persistencia automática** del carrito entre sesiones
- **Sincronización en tiempo real** entre pestañas del navegador

---

## 🏗️ ARQUITECTURA DEL PROYECTO EXPLICADA

### Estructura de Carpetas y Su Propósito

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (pages)/           # Rutas agrupadas (no afectan URL)
│   ├── api/               # Backend endpoints
│   ├── layout.tsx         # Layout global con providers
│   └── page.tsx          # Homepage
├── components/            # Componentes reutilizables
│   ├── Homepage/         # Específicos del home
│   ├── Store/            # Específicos de la tienda  
│   └── ui/               # Componentes base
├── lib/                  # Lógica de negocio y configuración
├── types/                # Definiciones TypeScript
└── public/               # Assets estáticos
```

**¿Por qué esta estructura?**

- **`app/`**: Usamos App Router de Next.js 15 porque permite **layouts anidados**, **loading states** automáticos y **mejor organización** de rutas
- **`(pages)/`**: Los paréntesis crean **grupos de rutas** sin afectar la URL, útil para organizar páginas relacionadas
- **`api/`**: Colocamos nuestros endpoints junto al frontend para **desarrollo más rápido** y **deploy unificado**
- **Separación por funcionalidad**: Cada carpeta tiene un propósito específico, facilitando el **mantenimiento** y **escalabilidad**

---

## 🔌 INTEGRACIÓN CON WOOCOMMERCE EXPLICADA

### ¿Qué es WooCommerce REST API?

WooCommerce expone una **API REST completa** que permite acceder a todos los datos de la tienda:
- **Productos** con todas sus propiedades (precio, imágenes, variantes)
- **Categorías** y taxonomías personalizadas
- **Atributos** como tallas, colores, materiales
- **Stock** y disponibilidad en tiempo real

### Configuración Paso a Paso

#### 1. Configurar Credenciales en WooCommerce

En tu WordPress/WooCommerce:
1. Ve a **WooCommerce > Settings > Advanced > REST API**
2. Crea una nueva **API Key** con permisos de **Read**
3. Guarda el **Consumer Key** y **Consumer Secret**

#### 2. Configurar el Cliente API

```typescript
// src/lib/woocommerce.ts
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_URL,
  consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
  version: "wc/v3"
});
```

**¿Por qué esta configuración?**
- **Variables de entorno**: Mantienen las credenciales seguras y permiten diferentes configuraciones por ambiente
- **wc/v3**: Es la versión más estable y completa de la API de WooCommerce
- **Cliente centralizado**: Un solo punto de configuración para toda la app

#### 3. Variables de Entorno Explicadas

```bash
# .env.local
NEXT_PUBLIC_WC_URL=https://tu-tienda.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_xxxxxxxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_xxxxxxxxxx
```

**¿Por qué `NEXT_PUBLIC_`?**
- Next.js **NO expone** variables de entorno al browser por seguridad
- **`NEXT_PUBLIC_`** le dice a Next.js que puede exponer esa variable
- Para WooCommerce **necesitamos** estas variables en el browser para hacer requests directos

### Implementación de API Routes

#### ¿Por qué necesitamos API Routes?

Aunque podríamos llamar directamente a WooCommerce desde el browser, creamos **API Routes intermedias** por:

1. **Seguridad**: Ocultamos credenciales reales de WooCommerce
2. **Transformación**: Adaptamos datos de WooCommerce a nuestras necesidades
3. **Caching**: Podemos implementar cache para mejor performance
4. **Rate Limiting**: Controlamos la frecuencia de requests
5. **Error Handling**: Manejamos errores de forma consistente

#### Endpoint de Lista de Productos

```typescript
// src/app/api/products/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const perPage = searchParams.get('per_page') || '100';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';

    const response = await api.get("products", {
      per_page: parseInt(perPage),
      orderby,
      order
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

**Explicación detallada:**

1. **`searchParams`**: Extraemos parámetros de query string (?per_page=10&order=asc)
2. **Valores por defecto**: Si no vienen parámetros, usamos valores sensatos
3. **Transformación**: Convertimos string a number donde sea necesario
4. **Error handling**: Capturamos errores y devolvemos respuesta consistente
5. **Status codes**: HTTP 500 para errores del servidor, HTTP 200 para éxito

#### Endpoint de Producto Individual

```typescript
// src/app/api/products/[slug]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const response = await api.get("products", {
      slug: params.slug
    });

    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(response.data[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
```

**¿Por qué buscar por slug y no por ID?**
- **URLs amigables**: `/products/hoodie-fighter` vs `/products/123`
- **SEO mejorado**: Los buscadores prefieren URLs descriptivas
- **Flexibilidad**: Podemos cambiar IDs sin romper URLs existentes

---

## 📊 SISTEMA DE TIPOS TYPESCRIPT EXPLICADO

### ¿Por qué TypeScript es Crucial en Ecommerce?

Un ecommerce maneja **datos críticos** (precios, stock, pedidos). TypeScript nos ayuda a:
- **Prevenir errores** de tipos en tiempo de desarrollo
- **Documentar** la estructura de datos automáticamente
- **Refactorizar** con seguridad cuando cambien los requisitos
- **Integrar** múltiples APIs (WooCommerce, pagos, envíos) de forma consistente

### Tipos de WooCommerce

```typescript
// src/types/product.ts
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;           // ⚠️ WooCommerce devuelve precios como string
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  description: string;
  short_description: string;
  images: WooCommerceImage[];
  categories: WooCommerceCategory[];
  attributes: WooCommerceAttribute[];
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  average_rating: string;  // ⚠️ También string, no number
  rating_count: number;
}
```

**¿Por qué WooCommerce usa strings para números?**
- **Precisión decimal**: Evita errores de punto flotante en precios
- **Localization**: Diferentes formatos de números por país
- **Compatibilidad**: Funciona con cualquier sistema que consuma la API

### Transformación de Datos

**¿Por qué necesitamos transformar datos?**

Los datos de WooCommerce están **optimizados para su uso interno**, pero para nuestro frontend necesitamos **datos optimizados para React**:

```typescript
export function transformWooCommerceProduct(wooProduct: WooCommerceProduct): Product {
  return {
    id: wooProduct.id,
    name: wooProduct.name,
    price: parseFloat(wooProduct.price) || 0,  // String → Number
    category: wooProduct.categories[0]?.name || 'Sin categoría',  // Array → String
    image: wooProduct.images[0]?.src || '/placeholder-product.jpg',  // Array → String
    slug: wooProduct.slug,
    description: wooProduct.description,
    inStock: wooProduct.stock_status === 'instock',  // String → Boolean
    featured: wooProduct.featured
  };
}
```

**Beneficios de la transformación:**
1. **Simplicidad**: Nuestros componentes trabajan con datos simples
2. **Performance**: Menos datos en memoria y localStorage
3. **Flexibilidad**: Podemos cambiar la fuente de datos sin afectar componentes
4. **Validación**: Garantizamos que los datos tienen el formato correcto

---

## 🛒 SISTEMA DE CARRITO AVANZADO EXPLICADO

### ¿Por qué Context API para el Carrito?

**Alternativas consideradas:**
- **Props drilling**: Pasar el carrito por props → **tedioso y error-prone**
- **Redux**: Muy potente pero → **demasiado complejo para un carrito**
- **Zustand**: Buena opción pero → **dependencia adicional**
- **Context API**: Nativo de React → **perfecto para estado global simple**

### Diseño del Estado del Carrito

```typescript
interface Cart {
  items: CartItem[];        // Lista de productos
  totalItems: number;       // Contador total de items
  totalPrice: number;       // Precio total calculado
}

interface CartItem {
  id: number;               // ID del producto
  name: string;            // Nombre para mostrar
  price: number;           // Precio unitario
  image: string;           // URL de imagen
  slug: string;            // Para enlaces
  quantity: number;        // Cantidad seleccionada
  selectedSize?: string;   // Variante de talla
  selectedColor?: string;  // Variante de color
}
```

**¿Por qué esta estructura?**
- **Items separados**: Cada combinación de producto+variantes es un item único
- **Totales calculados**: Evita inconsistencias entre items y totales
- **Datos mínimos**: Solo guardamos lo necesario para UI y localStorage
- **Variantes opcionales**: Flexibilidad para productos con/sin variantes

### Implementación del Context

```typescript
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<number | null>(null);
```

**Estados adicionales explicados:**
- **`isCartOpen`**: Controla el sidebar deslizante del carrito
- **`justAdded`**: ID del último producto agregado para feedback visual

### Persistencia en localStorage

```typescript
// Cargar del localStorage al inicializar
useEffect(() => {
  const savedCart = localStorage.getItem('fighterDistrict_cart');
  if (savedCart) {
    try {
      const parsedCart = JSON.parse(savedCart);
      setCart({
        items: parsedCart.items || [],
        totalItems: parsedCart.totalItems || 0,
        totalPrice: parsedCart.totalPrice || 0
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      // Si hay error, inicializar carrito vacío
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    }
  }
}, []);

// Guardar en localStorage cuando cambie
useEffect(() => {
  localStorage.setItem('fighterDistrict_cart', JSON.stringify(cart));
}, [cart]);
```

**¿Por qué localStorage?**
- **Persistencia**: El carrito sobrevive al cerrar el browser
- **No requiere login**: Funciona para usuarios anónimos
- **Sincronización**: Podemos detectar cambios entre pestañas
- **Simplicidad**: No necesitamos backend para manejar carritos temporales

**¿Por qué el manejo de errores?**
- **localStorage puede estar deshabilitado** en algunos browsers
- **Datos corruptos** si el usuario manipula localStorage manualmente
- **Quota exceeded** si localStorage está lleno
- **Graceful degradation**: La app sigue funcionando sin persistencia

### Lógica de Agregar al Carrito

```typescript
const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
  setCart(prev => {
    const existingItemIndex = prev.items.findIndex(cartItem => 
      cartItem.id === item.id && 
      cartItem.selectedSize === item.selectedSize && 
      cartItem.selectedColor === item.selectedColor
    );

    if (existingItemIndex >= 0) {
      // Item ya existe: actualizar cantidad
      const newItems = [...prev.items];
      newItems[existingItemIndex].quantity += quantity;
      newItems[existingItemIndex].price = Number(newItems[existingItemIndex].price) || 0;
      return { ...prev, items: newItems };
    } else {
      // Item nuevo: agregar a la lista
      const newItem: CartItem = {
        ...item,
        quantity,
        price: Number(item.price) || 0
      };
      return { ...prev, items: [...prev.items, newItem] };
    }
  });

  // Feedback visual: marcar como recién agregado
  setJustAdded(item.id);
  setTimeout(() => setJustAdded(null), 2000);
};
```

**Explicación paso a paso:**

1. **Búsqueda de item existente**: Comparamos ID + variantes para encontrar items duplicados
2. **Actualización vs Adición**: Si existe, sumamos cantidad; si no, creamos nuevo item
3. **Immutabilidad**: Usamos spread operator para no mutar el estado directamente
4. **Validación de price**: Nos aseguramos que price sea number, no string
5. **Feedback temporal**: `justAdded` permite mostrar animación de confirmación

### Gestión de Variantes

**¿Por qué las variantes complican el carrito?**

Un mismo producto puede tener múltiples combinaciones:
- Producto: "Hoodie Fighter"
- Variantes: Talla M + Color Negro, Talla L + Color Blanco, etc.

**Cada combinación es un item separado en el carrito** porque:
- Tienen **precios diferentes** (talla XL más cara)
- Tienen **stock diferente** (puede agotarse una talla específica)
- **UX clara**: El usuario ve exactamente qué variante pidió

```typescript
// Crear clave única para cada combinación
const getCartItemKey = (id: number, size?: string, color?: string) => {
  return `${id}-${size || 'no-size'}-${color || 'no-color'}`;
};

// Ejemplo:
// getCartItemKey(123, "M", "Negro") → "123-M-Negro"
// getCartItemKey(123, "L", "Negro") → "123-L-Negro"  ← Item diferente!
```

### Cálculos Automáticos

```typescript
useEffect(() => {
  const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = cart.items.reduce((sum, item) => 
    sum + ((item.price || 0) * (item.quantity || 0)), 0
  );
  
  if (cart.totalItems !== totalItems || cart.totalPrice !== totalPrice) {
    setCart(prev => ({ ...prev, totalItems, totalPrice }));
  }
}, [cart.items, cart.totalItems, cart.totalPrice]);
```

**¿Por qué cálculos automáticos?**
- **Consistencia**: Los totales siempre reflejan los items actuales
- **Simplicidad**: Los componentes no necesitan calcular totales
- **Performance**: Solo recalculamos cuando cambian los items
- **Seguridad**: Evitamos totales incorrectos por bugs

---

## 🔄 SINCRONIZACIÓN MULTI-PESTAÑA EXPLICADA

### ¿Por qué es Importante?

**Escenario real**: Usuario tiene la tienda abierta en 2 pestañas:
1. **Pestaña A**: Agrega producto al carrito
2. **Pestaña B**: ¿Ve el producto agregado? **¡Sin sincronización, NO!**

**Problemas sin sincronización:**
- **Confusión del usuario**: Cree que se perdió el producto
- **Pedidos duplicados**: Agrega el mismo producto múltiples veces
- **Experiencia inconsistente**: Cada pestaña muestra información diferente

### ¿Cómo Funciona StorageEvent?

El browser tiene un **evento nativo** llamado `storage` que se dispara cuando:
- **Otra ventana/pestaña** modifica localStorage
- **La ventana actual NO** se notifica de sus propios cambios
- **Funciona en tiempo real** sin necesidad de polling

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    // Solo procesamos cambios de nuestro carrito
    if (e.key === 'fighterDistrict_cart' && e.newValue && e.storageArea === localStorage) {
      try {
        const newCart = JSON.parse(e.newValue);
        setCart({
          items: newCart.items || [],
          totalItems: newCart.totalItems || 0,
          totalPrice: newCart.totalPrice || 0
        });
      } catch (error) {
        console.error('Error syncing cart:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

**Validaciones importantes:**
- **`e.key`**: Solo procesamos cambios de nuestro carrito, no de otros datos
- **`e.newValue`**: Verificamos que hay nuevo contenido
- **`e.storageArea`**: Confirmamos que es localStorage (no sessionStorage)
- **Try/catch**: Protegemos contra datos JSON malformados

### Verificación de Respaldo

**¿Qué pasa si StorageEvent falla?**

Aunque StorageEvent es muy confiable, implementamos **verificación adicional**:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {  // La ventana volvió a estar activa
      const savedCart = localStorage.getItem('fighterDistrict_cart');
      if (savedCart && JSON.stringify(cart) !== savedCart) {
        try {
          const storedCart = JSON.parse(savedCart);
          setCart({
            items: storedCart.items || [],
            totalItems: storedCart.totalItems || 0,
            totalPrice: storedCart.totalPrice || 0
          });
        } catch (error) {
          console.error('Error checking cart on visibility change:', error);
        }
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [cart]);
```

**¿Cuándo se activa?**
- Usuario **cambia de pestaña** y vuelve
- Usuario **minimiza/maximiza** la ventana
- Usuario vuelve de **otra aplicación**

**¿Por qué comparamos JSON strings?**
- **Comparación profunda** sin librerías adicionales
- **Detecta cualquier cambio** en la estructura del carrito
- **Performance aceptable** para objetos pequeños como el carrito

### Feedback Visual de Sincronización

```typescript
// src/components/CartSyncIndicator.tsx
export default function CartSyncIndicator() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fighterDistrict_cart' && e.newValue) {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 3000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 z-50">
      <div className="bg-blue-500 text-white rounded-lg shadow-lg p-3">
        <p>Carrito sincronizado desde otra ventana</p>
      </div>
    </div>
  );
}
```

**¿Por qué feedback visual?**
- **Transparencia**: El usuario sabe que algo cambió
- **Confianza**: Ve que la sincronización funciona
- **Educación**: Aprende que las pestañas están conectadas

---

## 🔍 SISTEMA DE BÚSQUEDA Y FILTROS EXPLICADO

### Arquitectura de Búsqueda

**¿Búsqueda en Frontend o Backend?**

**Búsqueda en Backend (WooCommerce):**
- ✅ **Resultados precisos**: Búsqueda en base de datos
- ✅ **Escalable**: Funciona con millones de productos
- ❌ **Latencia**: Request por cada búsqueda
- ❌ **Dependencia**: Requiere conexión a internet

**Búsqueda en Frontend (nuestra implementación):**
- ✅ **Instantánea**: Sin latencia de red
- ✅ **Funciona offline**: Una vez cargados los productos
- ❌ **Limitada**: Solo productos ya cargados
- ❌ **Memoria**: Mantiene todos los productos en memoria

**Nuestra decisión: Híbrida**
1. **Cargamos productos populares** al inicio (100-200 productos)
2. **Búsqueda frontend** para respuesta instantánea
3. **Fallback a backend** para búsquedas específicas

### Context de Búsqueda

```typescript
// src/lib/SearchContext.tsx
export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const clearSearch = () => setSearchTerm('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}
```

**¿Por qué un Context separado?**
- **Single Responsibility**: Cada context tiene una responsabilidad
- **Re-renders optimizados**: Solo componentes que usan búsqueda se re-renderizan
- **Testeable**: Podemos probar búsqueda independientemente del carrito

### Implementación en Navbar

```typescript
const handleSearch = (e: React.FormEvent, searchValue: string) => {
  e.preventDefault();
  if (searchValue.trim()) {
    setSearchTerm(searchValue.trim());
    if (pathname !== '/store') {
      router.push('/store');  // Navegar a la tienda
    }
    setLocalSearchTerm('');   // Limpiar input local
    closeMenu();              // Cerrar menú móvil
  }
};
```

**¿Por qué esta lógica?**
- **Navegación automática**: Si no está en /store, lo llevamos ahí
- **State unificado**: `searchTerm` global + `localSearchTerm` para el input
- **UX móvil**: Cerramos menú después de buscar
- **Validación**: Solo procesamos búsquedas con contenido

### Sistema de Filtros Avanzados

```typescript
interface FilterData {
  categories: string[];     // ["Hoodies", "Boxing"]
  brands: string[];        // ["Nike", "Adidas"]
  sizes: string[];         // ["M", "L", "XL"]
  sports: string[];        // ["Boxing", "MMA", "BJJ"]
  priceRange: [number, number];  // [50, 200]
}
```

**¿Por qué arrays para filtros múltiples?**
- **OR Logic**: Usuario puede seleccionar múltiples categorías
- **Flexibilidad**: Fácil agregar/quitar filtros
- **UI clara**: Checkboxes múltiples en la interfaz

### Lógica de Aplicación de Filtros

```typescript
const applyFilters = useCallback((products: Product[]) => {
  return products.filter(product => {
    // Filtro de categorías (OR logic)
    if (filters.categories.length > 0 && 
        !filters.categories.includes(product.category)) {
      return false;
    }

    // Filtro de precio (range)
    if (product.price < filters.priceRange[0] || 
        product.price > filters.priceRange[1]) {
      return false;
    }

    // Filtro de búsqueda (text search)
    if (searchTerm && 
        !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;  // Pasa todos los filtros
  });
}, [filters, searchTerm]);
```

**¿Por qué useCallback?**
- **Performance**: Evita recrear la función en cada render
- **Dependency array**: Solo recalcula cuando cambian filtros o búsqueda
- **Memoización**: React puede optimizar mejor los re-renders

---

## 📱 MANEJO DE PRODUCTOS EXPLICADO

### Fetching con SWR

**¿Por qué SWR sobre fetch nativo?**

```typescript
// ❌ Con fetch nativo
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/products')
    .then(res => res.json())
    .then(data => {
      setProducts(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);

// ✅ Con SWR
const { data: products, error, isLoading } = useSWR('/api/products', fetcher);
```

**Beneficios de SWR:**
- **Menos código**: Maneja estados automáticamente
- **Cache inteligente**: Reutiliza datos entre componentes
- **Revalidación**: Actualiza datos cuando vuelves a la ventana
- **Error retry**: Reintenta automáticamente en errores de red
- **Optimistic updates**: UI responsiva con actualizaciones optimistas

### Configuración SWR

```typescript
const { data: products, error, isLoading, mutate } = useSWR<WooCommerceProduct[]>(
  '/api/products',
  fetcher,
  {
    revalidateOnFocus: false,     // No revalidar al cambiar ventanas
    revalidateOnReconnect: true,  // Sí revalidar al reconectar internet
    errorRetryCount: 3,           // Máximo 3 reintentos
    errorRetryInterval: 5000,     // 5 segundos entre reintentos
    refreshInterval: 0,           // No refresh automático
  }
);
```

**¿Por qué esta configuración?**
- **`revalidateOnFocus: false`**: Productos no cambian frecuentemente
- **`revalidateOnReconnect: true`**: Útil para usuarios con conexión inestable
- **`errorRetryCount: 3`**: Balance entre persistencia y performance
- **`refreshInterval: 0`**: Evitamos requests innecesarios

### Gestión de Estados

```typescript
if (isLoading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}

if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-4">Error al cargar productos</p>
      <button 
        onClick={() => mutate('/api/products')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Reintentar
      </button>
    </div>
  );
}

if (!products || products.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No se encontraron productos</p>
    </div>
  );
}
```

**Estados manejados:**
1. **Loading**: Skeleton screens para mejor UX
2. **Error**: Mensaje claro + botón de retry
3. **Empty**: Estado vacío informativo
4. **Success**: Renderizar productos normalmente

### Página de Producto Individual

**¿Cómo extraer variantes de WooCommerce?**

WooCommerce guarda variantes en el campo `attributes`:

```typescript
// Extraer tallas
const sizeAttribute = product?.attributes?.find(attr =>
  attr.name.toLowerCase().includes('size') ||
  attr.name.toLowerCase().includes('talla') ||
  attr.name.toLowerCase().includes('tamaño')
);
const sizes = sizeAttribute?.options || [];

// Extraer colores
const colorAttribute = product?.attributes?.find(attr =>
  attr.name.toLowerCase().includes('color') ||
  attr.name.toLowerCase().includes('colour')
);
const colors = colorAttribute?.options || [];
```

**¿Por qué múltiples términos de búsqueda?**
- **Idioma**: "size" vs "talla" vs "tamaño"
- **Variaciones**: "color" vs "colour"
- **Flexibilidad**: Funciona con diferentes configuraciones de WooCommerce

### Gestión de URL con Variantes

```typescript
// Actualizar URL cuando cambien las selecciones
useEffect(() => {
  if (!product) return;
  
  const params = new URLSearchParams();
  
  if (selectedSize) params.set('size', selectedSize);
  if (selectedColor) params.set('color', selectedColor);
  if (quantity > 1) params.set('quantity', quantity.toString());
  
  const newURL = params.toString() 
    ? `/products/${slug}?${params.toString()}`
    : `/products/${slug}`;
  
  router.replace(newURL, { scroll: false });
}, [selectedSize, selectedColor, quantity, slug, router, product]);
```

**¿Por qué actualizar la URL?**
- **Compartible**: Usuario puede copiar URL con variantes específicas
- **Navegación**: Botón "atrás" mantiene las selecciones
- **SEO**: Buscadores indexan variantes populares
- **Analytics**: Podemos trackear qué variantes son más vistas

**¿Por qué `router.replace`?**
- **No historial**: No queremos crear entrada de historial por cada cambio
- **`scroll: false`**: No hacer scroll al cambiar URL
- **UX suave**: Cambios invisibles para el usuario

---

## ⚡ OPTIMIZACIONES Y PERFORMANCE EXPLICADAS

### Lazy Loading de Componentes

```typescript
// src/app/page.tsx
import dynamic from 'next/dynamic';

const Welcome = dynamic(() => import('@/components/Homepage/Welcome'), { 
  ssr: true,
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>
});
```

**¿Cuándo usar lazy loading?**
- ✅ **Componentes grandes**: Más de 50KB de código
- ✅ **Below the fold**: No visibles inmediatamente
- ✅ **Condicionales**: Solo se muestran a veces
- ❌ **Componentes críticos**: Navegación, header, footer

**¿Por qué `ssr: true`?**
- **SEO**: Componentes se renderizan en servidor
- **Performance**: Contenido visible más rápido
- **Hidratación**: React toma control suavemente

### Optimización de Imágenes

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fighterdistrict.com',
        pathname: '/wp-content/uploads/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],  // Formatos modernos
    deviceSizes: [640, 768, 1024, 1280, 1600],  // Breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],  // Tamaños específicos
  },
};
```

**Optimizaciones automáticas de Next.js:**
- **Lazy loading**: Imágenes se cargan cuando entran al viewport
- **Responsive**: Diferentes tamaños según dispositivo
- **Formatos modernos**: WebP/AVIF para browsers que los soportan
- **Placeholder**: Blur automático mientras carga

### Manejo de Errores Robusto

**¿Por qué proteger contra valores null?**

En ecommerce, un **precio roto** puede **perder ventas**:

```typescript
// ❌ Problemático
${product.price.toFixed(2)}  // Error si price es null

// ✅ Seguro
${(parseFloat(product.price || '0') || 0).toFixed(2)}
```

**Capas de protección:**
1. **`|| '0'`**: Si price es null/undefined, usar string '0'
2. **`parseFloat()`**: Convertir string a número
3. **`|| 0`**: Si parseFloat falla (NaN), usar 0
4. **`.toFixed(2)`**: Formatear con 2 decimales

**Aplicado al carrito:**
```typescript
const totalItems = cart.items.reduce((sum, item) => 
  sum + (item.quantity || 0), 0
);
const totalPrice = cart.items.reduce((sum, item) => 
  sum + ((item.price || 0) * (item.quantity || 0)), 0
);
```

---

## 🎛️ CONFIGURACIÓN Y DEPLOYMENT EXPLICADO

### Variables de Entorno por Ambiente

```bash
# .env.local (desarrollo)
NEXT_PUBLIC_WC_URL=http://localhost:8080/wordpress
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_dev_12345
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_dev_67890

# .env.production (producción)
NEXT_PUBLIC_WC_URL=https://mi-tienda.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_prod_12345
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_prod_67890
```

**¿Por qué diferentes credenciales?**
- **Seguridad**: Desarrollo no puede afectar producción
- **Testing**: Podemos probar sin miedo de romper datos reales
- **Performance**: Entorno de desarrollo puede tener diferentes optimizaciones

### Scripts de Build

```json
{
  "scripts": {
    "dev": "next dev",              // Desarrollo con hot reload
    "build": "next build",          // Build para producción
    "start": "next start",          // Servidor de producción
    "lint": "next lint",            // Verificar código
    "analyze": "ANALYZE=true next build"  // Analizar bundle size
  }
}
```

**Proceso de build explicado:**
1. **TypeScript**: Verifica tipos y compila
2. **Optimización**: Minifica CSS y JavaScript
3. **Tree shaking**: Elimina código no usado
4. **Code splitting**: Separa en chunks optimizados
5. **Static generation**: Pre-renderiza páginas estáticas

---

## 🔧 PERSONALIZACIÓN PARA NUEVA MARCA EXPLICADA

### 1. Cambio de Configuración WooCommerce

**Paso a paso:**

1. **Obtener credenciales de la nueva tienda**
```bash
# Nueva configuración
NEXT_PUBLIC_WC_URL=https://nueva-marca.com
NEXT_PUBLIC_WC_CONSUMER_KEY=nueva_key
NEXT_PUBLIC_WC_CONSUMER_SECRET=nuevo_secret
```

2. **Actualizar nombre del localStorage**
```typescript
// En CartContext.tsx
const CART_STORAGE_KEY = 'nueva-marca_cart';  // Cambiar nombre
localStorage.getItem(CART_STORAGE_KEY);
```

3. **Verificar configuración**
```bash
npm run dev
# Verificar que carga productos de la nueva tienda
```

### 2. Adaptar Tipos según Productos

**¿Y si la nueva marca tiene atributos diferentes?**

```typescript
// Para tienda de ropa
interface ClothingAttributes {
  material: string;    // "Algodón", "Poliéster"
  season: string;      // "Verano", "Invierno"
  gender: string;      // "Hombre", "Mujer", "Unisex"
  care: string;        // "Lavado a máquina", "Dry clean"
}

// Para tienda de electrónicos
interface ElectronicsAttributes {
  brand: string;       // "Samsung", "Apple"
  model: string;       // "Galaxy S23", "iPhone 14"
  warranty: string;    // "1 año", "2 años"
  color: string;       // "Negro", "Blanco"
}
```

### 3. Configurar Filtros Específicos

```typescript
// Filtros para ropa
interface ClothingFilters {
  categories: string[];    // ["Camisetas", "Pantalones"]
  materials: string[];     // ["Algodón", "Poliéster"]
  seasons: string[];       // ["Verano", "Invierno"]
  genders: string[];       // ["Hombre", "Mujer"]
  sizes: string[];         // ["XS", "S", "M", "L", "XL"]
  priceRange: [number, number];
}

// Filtros para electrónicos
interface ElectronicsFilters {
  categories: string[];    // ["Smartphones", "Laptops"]
  brands: string[];        // ["Samsung", "Apple", "Sony"]
  priceRange: [number, number];
  warranty: string[];      // ["1 año", "2 años", "3 años"]
  features: string[];      // ["Bluetooth", "WiFi", "4K"]
}
```

---

## 🎯 CONCLUSIÓN Y LECCIONES APRENDIDAS

### Decisiones Técnicas Clave

1. **Next.js 15 + App Router**: Estructura moderna, SEO automático, performance optimizada
2. **Context API**: Simplicidad sobre complejidad para estado global
3. **TypeScript**: Seguridad de tipos crucial en ecommerce
4. **SWR**: Manejo de datos asíncrono con cache inteligente
5. **localStorage**: Persistencia sin backend adicional
6. **Sincronización multi-pestaña**: Experiencia de usuario profesional

### Patrones Implementados

- **Separation of Concerns**: Cada archivo/función tiene una responsabilidad
- **Error Boundary Pattern**: Manejo robusto de errores
- **Loading States**: Feedback visual en toda la aplicación
- **Optimistic Updates**: UI responsiva antes de confirmación del servidor
- **Progressive Enhancement**: Funciona sin JavaScript (SSR)

### Escalabilidad

El proyecto está diseñado para crecer:
- **Modulares**: Fácil agregar nuevas funcionalidades
- **Tipado**: Refactoring seguro con TypeScript
- **API Routes**: Backend escalable sin servidor dedicado
- **Performance**: Optimizaciones desde el inicio

### Consideraciones de Producción

**Monitoreo**: Implementar error tracking (Sentry, LogRocket)
**Analytics**: Google Analytics, tracking de conversiones
**Testing**: Unit tests para lógica crítica del carrito
**SEO**: Structured data para productos
**Security**: Rate limiting, validación de inputs
**Performance**: Monitoring de Web Vitals

---

Esta documentación proporciona no solo el "qué" sino el **"por qué"** y **"cómo"** de cada decisión técnica, permitiendo entender los conceptos para aplicarlos en cualquier proyecto de ecommerce. 