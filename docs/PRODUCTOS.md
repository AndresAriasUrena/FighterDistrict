# 📦 Sistema de Productos - Fighter District

## Resumen

Este documento describe el sistema de productos implementado para Fighter District, que incluye integración con WooCommerce, componentes UI reutilizables y tipado TypeScript completo.

## 🛠️ Arquitectura

### Estructura de Archivos

```
src/
├── components/
│   ├── ui/
│   │   └── ProductCard.tsx          # Componente UI básico de tarjeta
│   └── Homepage/
│       └── ProductSection.tsx       # Secciones de productos del home
├── types/
│   └── product.ts                   # Tipos TypeScript para productos
├── app/
│   ├── products/
│   │   └── page.tsx                 # Página de listado de productos
│   └── page.tsx                     # Homepage con ProductSection
└── lib/
    └── woocommerce.js               # Configuración API WooCommerce
```

## 📝 Tipos TypeScript

### WooCommerceProduct
Interfaz completa que mapea todos los campos de la API de WooCommerce:

```typescript
interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  categories: WooCommerceCategory[];
  images: WooCommerceImage[];
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  // ... más campos
}
```

### Product (Simplificado)
Interfaz simplificada para uso en componentes:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  inStock: boolean;
  featured?: boolean;
}
```

## 🎨 Componentes UI

### ProductCard

Componente principal para mostrar productos con tres tamaños configurables.

### ProductSection (Homepage)

Componente específico para la página principal que muestra dos secciones fijas de productos obtenidos de WooCommerce.

#### Características

- **Sin props**: Es un componente autocontenido
- **Obtiene datos**: Conecta directamente con WooCommerce API
- **Dos secciones inteligentes**:
  - "NUESTROS PRODUCTOS MÁS VENDIDOS" (3 productos ordenados por popularidad real)
  - "NUEVOS DROPS" (3 productos más recientes ordenados por fecha de creación)
- **Datos dinámicos**: Se actualiza automáticamente cuando agregas nuevos productos o cambian las ventas
- **Optimizado**: Solo 2 llamadas API específicas en lugar de traer todos los productos
- **Responsive**: Grid de 3 columnas que se adapta a móvil
- **Manejo de errores**: Fallback en caso de error de conexión

#### Uso

```tsx
// En src/app/page.tsx
import ProductSection from '@/components/Homepage/ProductSection';

export default function Home() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <div className="space-y-16 mt-16 mb-16">
        <ProductSection />
      </div>
      <Footer />
    </div>
  );
}
```

#### Estructura Interna

```tsx
export default async function ProductSection() {
  // 1. Obtiene productos más vendidos (reales)
  const bestSellersRes = await api.get("products", {
    per_page: 3,
    orderby: 'popularity'  // Los más populares/vendidos
  });

  // 2. Obtiene productos más nuevos (últimos agregados)
  const newProductsRes = await api.get("products", {
    per_page: 3,
    orderby: 'date',  // Ordenar por fecha de creación
    order: 'desc'     // Más recientes primero
  });
  
  // 3. Transforma a formato interno
  const bestSellers = bestSellersWoo.map(transformWooCommerceProduct);
  const newProducts = newProductsWoo.map(transformWooCommerceProduct);
  
  // 4. Renderiza ambas secciones usando ProductCard
  return (
    <div className="mx-auto max-w-7xl">
      {/* Sección 1: MÁS VENDIDOS (por popularidad real) */}
      {/* Sección 2: NUEVOS DROPS (por fecha de creación) */}
    </div>
  );
}
```

#### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `id` | `string \| number` | ✅ | ID único del producto |
| `name` | `string` | ✅ | Nombre del producto |
| `category` | `string` | ✅ | Categoría del producto |
| `price` | `number` | ✅ | Precio del producto |
| `image` | `string` | ✅ | URL de la imagen |
| `href` | `string` | ❌ | URL personalizada (default: `/products/{id}`) |
| `size` | `'small' \| 'medium' \| 'large'` | ❌ | Tamaño de la tarjeta (default: `medium`) |
| `className` | `string` | ❌ | Clases CSS adicionales |

#### Tamaños

- **Small**: Max 250px, imagen 48 (12rem), textos pequeños
- **Medium**: Max 320px, imagen 64 (16rem), textos medianos  
- **Large**: Max 400px, imagen 80 (20rem), textos grandes

#### Ejemplo de Uso

```tsx
<ProductCard
  id={1}
  name="Guantes de Boxeo Profesionales"
  category="Boxeo"
  price={89.99}
  image="/images/guantes-boxeo.jpg"
  size="medium"
/>
```

### ProductGrid

Componente wrapper para crear grids responsivos de productos.

#### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `children` | `React.ReactNode` | ✅ | Componentes ProductCard |
| `cols` | `1 \| 2 \| 3 \| 4 \| 5` | ❌ | Número de columnas (default: `3`) |
| `gap` | `'small' \| 'medium' \| 'large'` | ❌ | Espaciado entre elementos (default: `medium`) |
| `className` | `string` | ❌ | Clases CSS adicionales |

#### Ejemplo de Uso

```tsx
<ProductGrid cols={3} gap="medium">
  {products.map((product) => (
    <ProductCard key={product.id} {...product} />
  ))}
</ProductGrid>
```

## 🔄 Transformación de Datos

### transformWooCommerceProduct()

Función helper que convierte productos de WooCommerce al formato simplificado:

```typescript
const product = transformWooCommerceProduct(wooProduct);
// Convierte price de string a number
// Extrae primera categoría e imagen
// Simplifica datos para uso en UI
```

## 📊 Parámetros de WooCommerce API

### Orderby (Ordenamiento)

| Parámetro | Descripción | Uso en Fighter District |
|-----------|-------------|-------------------------|
| `popularity` | Ordena por número de ventas | ✅ **Productos Más Vendidos** |
| `date` | Ordena por fecha de creación | ✅ **Nuevos Drops** |
| `title` | Ordena alfabéticamente | Páginas de productos |
| `price` | Ordena por precio | Filtros de precio |
| `rating` | Ordena por calificación | Productos mejor valorados |

### Order (Dirección)

| Parámetro | Descripción |
|-----------|-------------|
| `desc` | Descendente (mayor a menor) |
| `asc` | Ascendente (menor a mayor) |

### Ejemplo de Implementación

```typescript
// Productos más vendidos
await api.get("products", {
  per_page: 3,
  orderby: 'popularity'
});

// Productos más nuevos
await api.get("products", {
  per_page: 3,
  orderby: 'date',
  order: 'desc'
});
```

## 🌐 Configuración de Imágenes

### Next.js Config

Las imágenes remotas están configuradas en `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fighterdistrict.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      }
    ],
  },
};
```

## 📱 Responsive Design

### Breakpoints

- **Mobile**: 1 columna
- **Small (sm)**: 2 columnas  
- **Large (lg)**: 3 columnas
- **Extra Large (xl)**: 4+ columnas (configurable)

### Características Mobile

- Cards adaptan su tamaño automáticamente
- Hover effects solo en desktop
- Imágenes optimizadas con Next.js Image
- Tipografía escalable por tamaño

## 🎯 Características

### Animaciones y Efectos

- **Hover Scale**: Las tarjetas crecen 2% en hover
- **Image Zoom**: Las imágenes se escalan 5% en hover  
- **Shadow Transition**: Sombras suaves que se intensifican
- **Color Transitions**: Cambios suaves de color en texto

### Accesibilidad

- Alt tags apropiados en imágenes
- Estructura semántica con headings
- Enlaces accesibles con Link de Next.js
- Contraste de colores apropiado

### Performance

- Imágenes lazy loading con Next.js Image
- Sizes optimizados para diferentes viewports
- Object-fit contain para mantener proporciones
- CSS Grid nativo para layouts eficientes

## 🚀 Uso en Páginas

### Homepage

```tsx
// src/app/page.tsx
import ProductSection from '@/components/Homepage/ProductSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      <HeroSection />
      <div className="space-y-16 mt-16 mb-16">
        <ProductSection />
      </div>
      <Footer />
    </div>
  );
}
```

### Página de Productos

```tsx
// src/app/products/page.tsx
export default async function ProductsPage() {
  try {
    const res = await api.get("products");
    const wooProducts: WooCommerceProduct[] = res.data;
    const products = wooProducts.map(transformWooCommerceProduct);

    return (
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-3xl font-raven-bold text-black mb-8">
          Productos
        </h1>
        
        <ProductGrid cols={3} gap="medium">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              category={product.category}
              price={product.price}
              image={product.image}
              href={`/products/${product.slug}`}
            />
          ))}
        </ProductGrid>
      </div>
    );
  } catch (error) {
    return <ErrorMessage />;
  }
}
```

## 🛠️ Desarrollo

### Agregar Nuevos Campos

1. Actualizar `WooCommerceProduct` en `src/types/product.ts`
2. Modificar `Product` si es necesario
3. Actualizar `transformWooCommerceProduct()`
4. Modificar `ProductCard` para mostrar nuevo campo

### Crear Nuevos Tamaños

1. Agregar nuevo tamaño al tipo: `'small' | 'medium' | 'large' | 'nuevo'`
2. Actualizar `sizeClasses` en `ProductCard`
3. Documentar el nuevo tamaño

### Personalizar Estilos

- Los estilos usan clases de Tailwind CSS
- Fuentes: `font-raven-bold` para títulos, `font-urbanist` para texto
- Colores principales: Negro para texto, grises para secundarios

## 🐛 Solución de Problemas

### Error de Imagen No Configurada

```
Error: hostname "..." is not configured under images
```

**Solución**: Agregar el hostname en `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'tu-dominio.com',
      pathname: '/ruta/imagenes/**',
    }
  ],
}
```

### Error de Tipos

```
Property 'nombre' does not exist on type 'WooCommerceProduct'
```

**Solución**: Verificar que el campo existe en la interfaz `WooCommerceProduct` o usar la función de transformación.

### Imágenes No Cargan

1. Verificar que la URL es correcta
2. Comprobar configuración de `next.config.ts`
3. Verificar que el servidor de imágenes permite CORS
4. Usar placeholder en caso de error

## 📋 Checklist de Implementación

- [x] ✅ Tipos TypeScript completos
- [x] ✅ Componente ProductCard responsivo (ui/)
- [x] ✅ Componente ProductGrid configurable
- [x] ✅ Función de transformación de datos
- [x] ✅ Configuración de imágenes remotas
- [x] ✅ Página de productos funcional
- [x] ✅ ProductSection para homepage con dos secciones inteligentes
- [x] ✅ Integración WooCommerce directa con orderby dinámico
- [x] ✅ Productos más vendidos por popularidad real
- [x] ✅ Nuevos drops por fecha de creación
- [x] ✅ Manejo de errores
- [x] ✅ Documentación completa y actualizada

## 🎯 Próximos Pasos

1. **Filtros de Productos**: Implementar filtrado por categoría, precio, etc.
2. **Búsqueda**: Agregar funcionalidad de búsqueda de productos
3. **Paginación**: Implementar para manejar grandes catálogos
4. **Favoritos**: Sistema para guardar productos favoritos
5. **Comparación**: Funcionalidad para comparar productos
6. **Reviews**: Sistema de reseñas y calificaciones

## 🔄 Actualizaciones Recientes (Enero 2025)

### ✅ Sistema de Filtros Mejorado

#### Corrección de Marcas
- **Problema resuelto**: Las marcas ahora se extraen del campo correcto `brands` de WooCommerce
- **Antes**: Se mezclaban marcas con tags deportivos
- **Ahora**: Separación clara entre marcas (`brands`) y deportes (`tags`)

```typescript
// FilterSidebar.tsx - Extracción corregida
product.brands?.forEach(brand => {
  brandMap.set(brand.name, (brandMap.get(brand.name) || 0) + 1);
});

// Tags solo para deportes
product.tags?.forEach(tag => {
  const sportKeywords = ['bjj', 'judo', 'grappling', 'boxing', 'mma'];
  const isSport = sportKeywords.some(sport => tagLower.includes(sport));
  if (isSport) {
    sportMap.set(tagName, (sportMap.get(tagName) || 0) + 1);
  }
});
```

#### Sincronización con URL
- **URLs compartibles**: Los filtros se reflejan en la URL
- **Persistencia**: Al volver de un producto, los filtros se mantienen
- **Ejemplo**: `/store?categories=Rashguards&brands=Engage&sizes=M,L&minPrice=50&maxPrice=150`

```typescript
// Actualización automática de URL
const updateURL = (filters: FilterData) => {
  const params = new URLSearchParams();
  if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
  if (filters.brands.length > 0) params.set('brands', filters.brands.join(','));
  // ... más parámetros
  router.replace(params.toString() ? `?${params.toString()}` : '/store');
};
```

#### Checkboxes Personalizados
- **Diseño mejorado**: Checkboxes rojos personalizados
- **Eliminado**: Diseño default del navegador
- **Hover effects**: Transiciones suaves

```css
/* Checkbox personalizado */
.checkbox-custom {
  @apply w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center;
  @apply border-[#8B8B8B] hover:border-[#EC1D25];
}

.checkbox-custom.checked {
  @apply bg-[#EC1D25] border-[#EC1D25];
}
```

### ✅ ProductDetail Mejorado

#### Descripción Completa
- **Cambio**: Ahora muestra la descripción **extendida** (`description`)
- **Antes**: Solo descripción corta (`short_description`)
- **Beneficio**: Información completa del producto

#### Selector de Cantidad Rediseñado
- **Diseño elegante**: Botones con bordes y hover effects
- **Posición**: Movido antes del botón "Añadir al carrito"
- **Símbolos mejorados**: Usa "−" y "+" más elegantes

```tsx
<div className="flex items-center bg-white border-2 border-[#CFCFCF] rounded-md overflow-hidden">
  <button className="px-4 py-3 font-urbanist font-bold text-lg hover:bg-gray-50 transition-colors">
    −
  </button>
  <div className="px-6 py-3 font-urbanist font-semibold text-lg bg-gray-50 border-x border-[#CFCFCF]">
    {quantity}
  </div>
  <button className="px-4 py-3 font-urbanist font-bold text-lg hover:bg-gray-50 transition-colors">
    +
  </button>
</div>
```

#### Selector de Colores/Variantes
- **Nuevo**: Input para seleccionar colores del producto
- **Extracción automática**: De atributos de WooCommerce
- **Estilo consistente**: Mismo diseño que selector de tallas

#### URLs Dinámicas en Productos
- **Funcionalidad**: La URL cambia según selecciones del usuario
- **Parámetros**: `?size=M&color=Negro&quantity=2`
- **Compartible**: Los enlaces mantienen las selecciones
- **Persistencia**: Al recargar, mantiene las selecciones

```typescript
// Actualización automática de URL en ProductDetail
useEffect(() => {
  const params = new URLSearchParams();
  if (selectedSize) params.set('size', selectedSize);
  if (selectedColor) params.set('color', selectedColor);
  if (quantity > 1) params.set('quantity', quantity.toString());
  
  const newURL = params.toString() 
    ? `/products/${slug}?${params.toString()}`
    : `/products/${slug}`;
  
  router.replace(newURL, { scroll: false });
}, [selectedSize, selectedColor, quantity]);
```

### ✅ Tipos TypeScript Actualizados

#### Nuevo Tipo: WooCommerceBrand
```typescript
export interface WooCommerceBrand {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceProduct {
  // ... campos existentes
  brands: WooCommerceBrand[];  // ← Nuevo campo agregado
}
```

### ✅ Limpieza de Código

#### Eliminado Debug Code
- **Removido**: Todos los `console.log` de debug
- **Limpio**: Código listo para producción
- **Performance**: Sin logs innecesarios en consola

#### Archivos Eliminados
- `/api/debug-products/route.ts`
- `/api/product-attributes/route.ts`
- Comentarios de debug temporal

### 🎯 Estado Actual del Sistema

#### ✅ Completado
- [x] Sistema de filtros con marcas corregidas
- [x] URLs compartibles en filtros y productos
- [x] Checkboxes personalizados rojos
- [x] Selector de cantidad mejorado
- [x] Selector de colores/variantes
- [x] Descripción extendida en productos
- [x] URLs dinámicas en ProductDetail
- [x] Código limpio sin debug
- [x] Tipos TypeScript actualizados

#### 🚧 Próximas Mejoras
- [ ] Carrito de compras funcional
- [ ] Proceso de checkout
- [ ] Sistema de favoritos
- [ ] Búsqueda avanzada con filtros

### 📊 Métricas de Mejora

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Marcas** | Mezcladas con tags | Campo `brands` correcto |
| **URLs** | Estáticas | Dinámicas y compartibles |
| **Checkboxes** | Default del navegador | Personalizados rojos |
| **Cantidad** | Diseño básico | Elegante con hover |
| **Descripción** | Corta | Completa y detallada |
| **Variantes** | Solo tallas | Tallas + colores |
| **Debug** | Logs en consola | Código limpio |

---

**Última actualización**: Enero 2025  
**Versión**: 1.1.0  
**Estado**: ✅ Listo para producción 