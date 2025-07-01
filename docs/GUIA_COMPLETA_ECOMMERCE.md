# 📚 GUÍA COMPLETA - ECOMMERCE NEXT.JS + WOOCOMMERCE

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