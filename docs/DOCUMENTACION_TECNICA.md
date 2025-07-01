# 📋 DOCUMENTACIÓN TÉCNICA - ECOMMERCE WOOCOMMERCE + NEXT.JS

## 🎯 RESUMEN EJECUTIVO

Este proyecto implementa un ecommerce completo conectado a WooCommerce REST API con funcionalidades avanzadas de carrito, sincronización multi-pestaña, búsqueda en tiempo real y gestión de productos con variantes.

**Stack Técnico:**
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: WooCommerce REST API
- **Styling**: TailwindCSS v4
- **Estado**: Context API + localStorage
- **HTTP**: Axios + SWR para caching

---

## 🔌 INTEGRACIÓN WOOCOMMERCE

### Configuración Base

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

### Variables de Entorno

```bash
NEXT_PUBLIC_WC_URL=https://tu-tienda.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_xxxxxxxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_xxxxxxxxxx
```

### API Routes Implementadas

#### 1. Lista de Productos (`/api/products`)

```typescript
// src/app/api/products/route.ts
export async function GET(request: NextRequest) {
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
}
```

**Características:**
- Paginación configurable
- Ordenamiento por fecha, popularidad, precio
- Filtros por categoría, marca, búsqueda
- Manejo de errores robusto

#### 2. Producto Individual (`/api/products/[slug]`)

```typescript
// src/app/api/products/[slug]/route.ts
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const response = await api.get("products", {
    slug: params.slug
  });

  if (!response.data || response.data.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(response.data[0]);
}
```

**Características:**
- Búsqueda por slug único
- Validación de existencia
- Retorno de datos completos del producto

---

## 📊 SISTEMA DE TIPOS TYPESCRIPT

### Tipos WooCommerce

```typescript
// src/types/product.ts
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  description: string;
  short_description: string;
  images: WooCommerceImage[];
  categories: WooCommerceCategory[];
  attributes: WooCommerceAttribute[];
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  average_rating: string;
  rating_count: number;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  options: string[];
  variation: boolean;
}
```

### Transformación de Datos

```typescript
export function transformWooCommerceProduct(wooProduct: WooCommerceProduct): Product {
  return {
    id: wooProduct.id,
    name: wooProduct.name,
    price: parseFloat(wooProduct.price) || 0,
    category: wooProduct.categories[0]?.name || 'Sin categoría',
    image: wooProduct.images[0]?.src || '/placeholder-product.jpg',
    slug: wooProduct.slug,
    description: wooProduct.description,
    inStock: wooProduct.stock_status === 'instock',
    featured: wooProduct.featured
  };
}
```

### Tipos del Carrito

```typescript
// src/types/cart.ts
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  slug: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  maxQuantity?: number;
}

export interface CartContextType {
  cart: Cart;
  isCartOpen: boolean;
  justAdded: number | null;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: number, size?: string, color?: string) => void;
  updateQuantity: (id: number, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
}
```

---

## 🛒 SISTEMA DE CARRITO AVANZADO

### Context del Carrito

```typescript
// src/lib/CartContext.tsx
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  // Persistencia en localStorage
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
      }
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('fighterDistrict_cart', JSON.stringify(cart));
  }, [cart]);
```

### Funcionalidades del Carrito

#### 1. Agregar Productos

```typescript
const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
  setCart(prev => {
    const existingItemIndex = prev.items.findIndex(cartItem => 
      cartItem.id === item.id && 
      cartItem.selectedSize === item.selectedSize && 
      cartItem.selectedColor === item.selectedColor
    );

    if (existingItemIndex >= 0) {
      // Actualizar cantidad de item existente
      const newItems = [...prev.items];
      newItems[existingItemIndex].quantity += quantity;
      return { ...prev, items: newItems };
    } else {
      // Agregar nuevo item
      const newItem: CartItem = { ...item, quantity, price: Number(item.price) || 0 };
      return { ...prev, items: [...prev.items, newItem] };
    }
  });

  // Marcar como recién agregado para UI feedback
  setJustAdded(item.id);
  setTimeout(() => setJustAdded(null), 2000);
};
```

#### 2. Gestión de Variantes

```typescript
// Soporte para tallas y colores
const getCartItemKey = (id: number, size?: string, color?: string) => {
  return `${id}-${size || 'no-size'}-${color || 'no-color'}`;
};

// Items únicos por combinación id + talla + color
const uniqueItems = cart.items.filter((item, index, array) => 
  array.findIndex(i => 
    i.id === item.id && 
    i.selectedSize === item.selectedSize && 
    i.selectedColor === item.selectedColor
  ) === index
);
```

#### 3. Cálculos Automáticos

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

---

## 🔄 SINCRONIZACIÓN MULTI-PESTAÑA

### StorageEvent Listener

```typescript
// Detectar cambios desde otras ventanas
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
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

### Verificación de Visibilidad

```typescript
// Backup cuando la ventana vuelve a estar activa
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
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

---

## 🔍 SISTEMA DE BÚSQUEDA Y FILTROS

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

### Implementación en Navbar

```typescript
const handleSearch = (e: React.FormEvent, searchValue: string) => {
  e.preventDefault();
  if (searchValue.trim()) {
    setSearchTerm(searchValue.trim());
    if (pathname !== '/store') {
      router.push('/store');
    }
    setLocalSearchTerm('');
    closeMenu();
  }
};
```

### Filtros Avanzados

```typescript
// src/components/Store/FilterSidebar.tsx
interface FilterData {
  categories: string[];
  brands: string[];
  sizes: string[];
  sports: string[];
  priceRange: [number, number];
}

const applyFilters = useCallback((products: Product[]) => {
  return products.filter(product => {
    // Filtro por categorías
    if (filters.categories.length > 0 && 
        !filters.categories.includes(product.category)) {
      return false;
    }

    // Filtro por rango de precio
    if (product.price < filters.priceRange[0] || 
        product.price > filters.priceRange[1]) {
      return false;
    }

    // Filtro por búsqueda
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });
}, [filters, searchTerm]);
```

---

## 📱 MANEJO DE PRODUCTOS

### Fetching con SWR

```typescript
// src/components/Store/ProductGrid.tsx
const { data: products, error, isLoading } = useSWR<WooCommerceProduct[]>(
  '/api/products',
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3
  }
);
```

### Gestión de Estados

```typescript
if (isLoading) {
  return <LoadingGrid />;
}

if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500">Error al cargar productos</p>
      <button onClick={() => mutate('/api/products')}>Reintentar</button>
    </div>
  );
}

if (!products || products.length === 0) {
  return <EmptyState />;
}
```

### Página de Producto Individual

```typescript
// src/components/ProductView/ProductDetail.tsx
export default function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<WooCommerceProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) throw new Error('Producto no encontrado');
        
        const wooProduct: WooCommerceProduct = await response.json();
        setProduct(wooProduct);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar producto');
      }
    };

    fetchProduct();
  }, [slug]);

  // Extraer variantes de atributos
  const sizeAttribute = product?.attributes?.find(attr =>
    attr.name.toLowerCase().includes('size') ||
    attr.name.toLowerCase().includes('talla')
  );
  const sizes = sizeAttribute?.options || [];

  const colorAttribute = product?.attributes?.find(attr =>
    attr.name.toLowerCase().includes('color')
  );
  const colors = colorAttribute?.options || [];
```

### Agregar al Carrito desde Producto

```typescript
const handleAddToCart = () => {
  if (!product) return;

  const cartItem = {
    id: product.id,
    name: product.name,
    price: parseFloat(product.price || '0') || 0,
    image: product.images[0]?.src || '/placeholder-product.jpg',
    slug: product.slug,
    selectedSize: selectedSize || undefined,
    selectedColor: selectedColor || undefined,
  };

  addToCart(cartItem, quantity);
  
  // Pequeña pausa para mostrar feedback antes de abrir carrito
  setTimeout(() => {
    openCart();
  }, 500);
};
```

---

## ⚡ OPTIMIZACIONES Y PERFORMANCE

### Lazy Loading de Componentes

```typescript
// src/app/page.tsx
import dynamic from 'next/dynamic';

const Welcome = dynamic(() => import('@/components/Homepage/Welcome'), { ssr: true });
const Brands = dynamic(() => import('@/components/Homepage/Brands'), { ssr: true });
const ProductSection = dynamic(() => import('@/components/Homepage/ProductSection'), { ssr: true });
```

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
  },
};
```

### Manejo de Errores

```typescript
// Protección contra valores null en precios
${(price || 0).toFixed(2)}
${(cart.totalPrice || 0).toFixed(2)}
${(parseFloat(product.price || '0') || 0).toFixed(2)}

// Validación de items del carrito
const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
const totalPrice = cart.items.reduce((sum, item) => 
  sum + ((item.price || 0) * (item.quantity || 0)), 0
);
```

---

## 🎛️ CONFIGURACIÓN Y DEPLOYMENT

### Variables de Entorno

```bash
# Desarrollo
NEXT_PUBLIC_WC_URL=http://localhost/wordpress
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_dev_key
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_dev_secret

# Producción
NEXT_PUBLIC_WC_URL=https://mi-tienda.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_prod_key
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_prod_secret
```

### Scripts de Package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@woocommerce/woocommerce-rest-api": "^1.0.1",
    "axios": "^1.10.0",
    "next": "15.3.4",
    "react": "^19.0.0",
    "react-icons": "^5.5.0",
    "swr": "^2.3.3"
  }
}
```

---

## 🔧 PERSONALIZACIÓN PARA NUEVA MARCA

### 1. Cambiar Configuración WooCommerce

```typescript
// Actualizar variables de entorno
NEXT_PUBLIC_WC_URL=https://nueva-marca.com
NEXT_PUBLIC_WC_CONSUMER_KEY=nueva_key
NEXT_PUBLIC_WC_CONSUMER_SECRET=nuevo_secret

// Cambiar nombre del localStorage
localStorage.getItem('nueva-marca_cart')
```

### 2. Adaptar Tipos de Producto

```typescript
// Si la nueva marca tiene atributos diferentes
export interface CustomAttribute {
  material?: string;
  season?: string;
  gender?: string;
}

// Adaptar función de transformación
export function transformCustomProduct(wooProduct: WooCommerceProduct): Product {
  // Lógica específica para nueva marca
}
```

### 3. Configurar Filtros Específicos

```typescript
// Adaptar filtros según el tipo de productos
interface BrandFilterData {
  categories: string[];
  materials: string[];  // Para ropa
  seasons: string[];    // Para colecciones
  genders: string[];    // Para segmentación
  priceRange: [number, number];
}
```

---

## 📊 FUNCIONALIDADES TÉCNICAS CLAVE

### ✅ Sistema de Carrito
- Persistencia en localStorage
- Sincronización multi-pestaña en tiempo real
- Soporte completo para variantes de producto
- Cálculos automáticos de totales
- Gestión robusta de estados de error

### ✅ Integración WooCommerce
- API REST completa implementada
- Manejo de productos, categorías, atributos
- Búsqueda y filtrado avanzado
- Transformación segura de tipos de datos
- Validación y sanitización de datos

### ✅ Performance y UX
- Lazy loading de componentes
- Optimización de imágenes automática
- Estados de loading y error informativos
- Animaciones fluidas y feedback visual
- Mobile-first responsive design

### ✅ Arquitectura Escalable
- Separación de responsabilidades clara
- Tipos TypeScript completos
- Context API para estado global
- Componentes reutilizables
- Configuración fácilmente personalizable

---

## 🎯 CONCLUSIÓN TÉCNICA

Este proyecto implementa un ecommerce moderno con integración completa a WooCommerce, enfocándose en:

1. **Robustez**: Manejo de errores, validación de datos, estados consistentes
2. **Performance**: Optimizaciones de Next.js, lazy loading, caching inteligente
3. **UX Avanzada**: Carrito sincronizado, búsqueda en tiempo real, feedback visual
4. **Escalabilidad**: Arquitectura modular, fácil personalización, tipos seguros

La implementación está lista para producción y puede adaptarse fácilmente a cualquier marca que use WooCommerce como backend. 