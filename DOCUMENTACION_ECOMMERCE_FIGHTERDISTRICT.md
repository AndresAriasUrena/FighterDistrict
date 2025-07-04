# Documentación Completa - E-commerce FighterDistrict

## 📋 TABLA DE CONTENIDO

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Configuración y Dependencias](#configuración-y-dependencias)
5. [Tipos de Datos](#tipos-de-datos)
6. [Contextos y Estado Global](#contextos-y-estado-global)
7. [Componentes Principales](#componentes-principales)
8. [APIs y Endpoints](#apis-y-endpoints)
9. [Integración WooCommerce](#integración-woocommerce)
10. [Integración ONVO Pay](#integración-onvo-pay)
11. [Funcionalidades Principales](#funcionalidades-principales)
12. [Guía de Implementación](#guía-de-implementación)
13. [Variables de Entorno](#variables-de-entorno)
14. [Despliegue](#despliegue)

---

## 🚀 INTRODUCCIÓN

**FighterDistrict** es un e-commerce completo desarrollado en **Next.js 15** con **TypeScript** que integra:

- ✅ **WooCommerce** como backend de productos y órdenes
- ✅ **ONVO Pay** como pasarela de pagos
- ✅ **Carrito de compras** con sincronización entre pestañas
- ✅ **Búsqueda y filtros** avanzados
- ✅ **Diseño responsive** con TailwindCSS
- ✅ **SEO optimizado** con metadata completa
- ✅ **Paginación** y ordenamiento de productos
- ✅ **Gestión de inventario** en tiempo real

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico

```
Frontend: Next.js 15 + TypeScript + TailwindCSS
Backend: WooCommerce API (WordPress)
Pagos: ONVO Pay API
Estado: React Context API
Estilizado: TailwindCSS + Fuentes Google
Iconos: React Icons
```

### Flujo de Datos

```
Usuario → Frontend (Next.js) → WooCommerce API → Base de Datos
                ↓
         ONVO Pay API → Procesamiento de Pagos
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── (pages)/           # Páginas agrupadas
│   │   ├── checkout/      # Proceso de compra
│   │   ├── products/      # Páginas de productos
│   │   └── store/         # Tienda principal
│   ├── api/               # Endpoints API
│   │   ├── products/      # API de productos
│   │   ├── create-payment/ # Creación de pagos
│   │   └── create-order/  # Creación de órdenes
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React
│   ├── Homepage/          # Componentes del inicio
│   ├── Store/            # Componentes de tienda
│   ├── ProductView/      # Vista de productos
│   ├── ui/               # Componentes UI reutilizables
│   ├── Navbar.tsx        # Navegación
│   ├── Footer.tsx        # Pie de página
│   └── CartSidebar.tsx   # Carrito lateral
├── lib/                  # Librerías y utilidades
│   ├── CartContext.tsx   # Contexto del carrito
│   ├── SearchContext.tsx # Contexto de búsqueda
│   ├── woocommerce.ts    # Cliente WooCommerce
│   └── onvo.ts           # Cliente ONVO Pay
└── types/                # Tipos TypeScript
    ├── product.ts        # Tipos de productos
    └── cart.ts           # Tipos del carrito
```

---

## ⚙️ CONFIGURACIÓN Y DEPENDENCIAS

### package.json

```json
{
  "dependencies": {
    "@woocommerce/woocommerce-rest-api": "^1.0.1",
    "axios": "^1.10.0",
    "next": "15.3.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-icons": "^5.5.0",
    "swr": "^2.3.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tu-dominio.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

---

## 🔧 TIPOS DE DATOS

### Productos (WooCommerce)

```typescript
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  images: WooCommerceImage[];
  categories: WooCommerceCategory[];
  tags: WooCommerceTag[];
  attributes: WooCommerceAttribute[];
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  // ... más propiedades
}
```

### Carrito de Compras

```typescript
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  maxQuantity?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
```

---

## 🌐 CONTEXTOS Y ESTADO GLOBAL

### CartContext - Gestión del Carrito

**Ubicación:** `src/lib/CartContext.tsx`

```typescript
export interface CartContextType {
  cart: Cart;
  isCartOpen: boolean;
  justAdded: number | null;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: number, size?: string, color?: string) => void;
  updateQuantity: (id: number, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}
```

**Características:**
- ✅ Persistencia en localStorage
- ✅ Sincronización entre pestañas
- ✅ Manejo de variaciones (talla, color)
- ✅ Animaciones de "recién agregado"
- ✅ Cálculo automático de totales

### SearchContext - Gestión de Búsqueda

**Ubicación:** `src/lib/SearchContext.tsx`

```typescript
interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
}
```

---

## 🧩 COMPONENTES PRINCIPALES

### 1. Navbar - Navegación Principal

**Ubicación:** `src/components/Navbar.tsx`

**Características:**
- ✅ Navegación responsive
- ✅ Búsqueda en tiempo real
- ✅ Contador de carrito animado
- ✅ Menú móvil con animaciones
- ✅ Indicadores de página activa

### 2. ProductGrid - Grid de Productos

**Ubicación:** `src/components/Store/ProductGrid.tsx`

**Características:**
- ✅ Filtrado por categoría, marca, precio, talla
- ✅ Búsqueda en múltiples campos
- ✅ Ordenamiento avanzado (precio, nombre, fecha)
- ✅ Paginación inteligente
- ✅ Loading states y estados vacíos

### 3. ProductCard - Tarjeta de Producto

**Ubicación:** `src/components/ui/ProductCard.tsx`

**Características:**
- ✅ Diseño responsive
- ✅ Animaciones hover
- ✅ Indicadores de stock
- ✅ Formateo de precios
- ✅ Optimización de imágenes

### 4. CartSidebar - Carrito Lateral

**Ubicación:** `src/components/CartSidebar.tsx`

**Características:**
- ✅ Slide-out animation
- ✅ Gestión de cantidades
- ✅ Eliminación de productos
- ✅ Cálculo de totales
- ✅ Botón de checkout

### 5. ProductDetail - Vista de Producto

**Ubicación:** `src/components/ProductView/ProductDetail.tsx`

**Características:**
- ✅ Galería de imágenes
- ✅ Selector de variaciones
- ✅ Añadir al carrito
- ✅ Información detallada
- ✅ Breadcrumbs

---

## 🔌 APIs Y ENDPOINTS

### 1. GET /api/products

**Propósito:** Obtener productos de WooCommerce

```typescript
// Parámetros de consulta
interface ProductsQuery {
  per_page?: number;     // Productos por página (máx: 100)
  orderby?: string;      // Ordenar por: date, price, title
  order?: 'asc' | 'desc'; // Orden ascendente/descendente
}

// Respuesta
type ProductsResponse = WooCommerceProduct[];
```

**Características:**
- ✅ Rate limiting (30 req/min)
- ✅ Validación de parámetros
- ✅ Cache headers (5 min)
- ✅ Manejo de errores

### 2. POST /api/create-payment

**Propósito:** Crear payment intent en ONVO Pay

```typescript
interface CreatePaymentRequest {
  total: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  cartItems: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface CreatePaymentResponse {
  success: boolean;
  payment: {
    id: string;
    status: string;
    amount: number;
    currency: string;
  };
}
```

### 3. POST /api/create-order

**Propósito:** Crear orden en WooCommerce

```typescript
interface CreateOrderRequest {
  cart: CartItem[];
  customerInfo: CustomerInfo;
  paymentIntentId: string;
  paymentStatus: 'completed' | 'failed';
}

interface CreateOrderResponse {
  success: boolean;
  order: {
    id: number;
    total: number;
    status: string;
    order_key: string;
  };
}
```

---

## 🛒 INTEGRACIÓN WOOCOMMERCE

### Configuración del Cliente

**Ubicación:** `src/lib/woocommerce.ts`

```typescript
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_URL,
  consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
  version: "wc/v3"
});
```

### Endpoints Utilizados

1. **GET /products** - Obtener productos
2. **POST /orders** - Crear órdenes
3. **GET /products/{id}** - Obtener producto específico
4. **GET /products/categories** - Obtener categorías

---

## 💳 INTEGRACIÓN ONVO PAY

### Configuración del Cliente

**Ubicación:** `src/lib/onvo.ts`

```typescript
export const onvoConfig = {
  baseURL: 'https://api.onvopay.com/v1',
  publishableKey: process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY!,
  secretKey: process.env.ONVO_SECRET_KEY!,
};

export async function createPaymentIntent(data: OnvoPaymentIntentRequest) {
  const response = await onvoApi.post('/payment-intents', data, {
    headers: {
      Authorization: `Bearer ${onvoConfig.secretKey}`,
    },
  });
  return response.data;
}
```

### Flujo de Pago

1. **Crear Payment Intent** → API ONVO
2. **Renderizar SDK** → Frontend
3. **Procesar Pago** → ONVO
4. **Crear Orden** → WooCommerce
5. **Confirmar Compra** → Usuario

---

## ⚡ FUNCIONALIDADES PRINCIPALES

### 1. Sistema de Carrito

**Características:**
- ✅ Persistencia en localStorage
- ✅ Sincronización entre pestañas
- ✅ Manejo de variaciones (talla, color)
- ✅ Validación de stock
- ✅ Cálculo automático de totales

**Código clave:**
```typescript
const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
  // Verificar si existe con mismas variaciones
  const existingItem = cart.items.find(cartItem => 
    cartItem.id === item.id && 
    cartItem.selectedSize === item.selectedSize && 
    cartItem.selectedColor === item.selectedColor
  );
  
  // Agregar o actualizar cantidad
  // Guardar en localStorage
  // Actualizar estado
};
```

### 2. Búsqueda y Filtros

**Características:**
- ✅ Búsqueda en múltiples campos
- ✅ Filtros por categoría, marca, precio
- ✅ Ordenamiento avanzado
- ✅ Paginación inteligente
- ✅ URLs con parámetros de búsqueda

**Código clave:**
```typescript
const searchProducts = (products: Product[], searchTerm: string) => {
  return products.filter(product => {
    // Buscar en nombre, descripción, categorías, tags
    const searchFields = [
      product.name,
      product.description,
      product.categories?.map(c => c.name).join(' '),
      product.tags?.map(t => t.name).join(' ')
    ].filter(Boolean);
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
};
```

### 3. Proceso de Checkout

**Fases:**
1. **Formulario de datos** → Información del cliente
2. **Crear Payment Intent** → ONVO API
3. **Procesar pago** → SDK ONVO
4. **Crear orden** → WooCommerce
5. **Página de confirmación** → Éxito/Error

### 4. Gestión de Estado

**Patrones utilizados:**
- ✅ React Context para estado global
- ✅ localStorage para persistencia
- ✅ Custom hooks para lógica reutilizable
- ✅ Optimistic updates para UX

---

## 🚀 GUÍA DE IMPLEMENTACIÓN

### Para Replicar en Otra Marca

#### 1. Clonar y Configurar

```bash
# Clonar estructura
git clone [repositorio]
cd nuevo-ecommerce

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
```

#### 2. Personalizar Marca

**Archivos a modificar:**

1. **Colores y Estilos** → `src/app/globals.css`
2. **Logo e Imágenes** → `public/assets/`
3. **Metadata y SEO** → `src/app/layout.tsx`
4. **Textos y Contenido** → Componentes específicos
5. **Navegación** → `src/components/Navbar.tsx`

#### 3. Configurar Integraciones

**WooCommerce:**
```env
NEXT_PUBLIC_WC_URL=https://tu-sitio.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_xxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_xxxxx
```

**ONVO Pay:**
```env
NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY=onvo_test_xxxxx
ONVO_SECRET_KEY=onvo_secret_xxxxx
```

#### 4. Personalizar Componentes

**Homepage:**
- Editar `src/components/Homepage/`
- Cambiar hero section, productos destacados
- Actualizar secciones de categorías

**Productos:**
- Configurar categorías en WooCommerce
- Ajustar filtros según productos
- Personalizar campos de producto

**Checkout:**
- Configurar campos requeridos
- Personalizar métodos de pago
- Ajustar validaciones

#### 5. Configurar Dominio

**next.config.ts:**
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'tu-nuevo-dominio.com',
      pathname: '/wp-content/uploads/**',
    },
  ],
}
```

---

## 🔐 VARIABLES DE ENTORNO

### Archivo .env.local

```env
# WooCommerce API
NEXT_PUBLIC_WC_URL=https://tu-sitio.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxx

# ONVO Pay
NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY=onvo_test_publishable_key_xxxxx
ONVO_SECRET_KEY=onvo_secret_xxxxx

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key

# Opcional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Configuración de Producción

```env
# URLs de producción
NEXT_PUBLIC_WC_URL=https://tu-sitio-produccion.com
NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY=onvo_live_publishable_key_xxxxx
ONVO_SECRET_KEY=onvo_live_secret_xxxxx
```

---

## 🚀 DESPLIEGUE

### Opciones de Despliegue

#### 1. Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en dashboard
```

#### 2. Netlify

```bash
# Build
npm run build

# Deploy manual o conectar con Git
```

#### 3. VPS/Servidor Propio

```bash
# Instalar PM2
npm install -g pm2

# Build y start
npm run build
pm2 start npm --name "ecommerce" -- start
```

### Configuración de Producción

1. **SSL/HTTPS** → Certificado SSL
2. **CDN** → Optimización de assets
3. **Cache** → Redis/Memcached
4. **Monitoring** → Logs y métricas
5. **Backup** → Base de datos y archivos

---

## 🔧 MANTENIMIENTO

### Actualizaciones Regulares

1. **Dependencias** → `npm audit` y updates
2. **WooCommerce** → Actualizar plugins
3. **ONVO Pay** → Verificar API changes
4. **Next.js** → Actualizar framework

### Monitoreo

1. **Performance** → Core Web Vitals
2. **Errores** → Logs de aplicación
3. **Conversiones** → Analytics de ventas
4. **Uptime** → Disponibilidad del sitio

---

## 📞 SOPORTE

### Recursos Útiles

- **Next.js Docs:** https://nextjs.org/docs
- **WooCommerce API:** https://woocommerce.github.io/woocommerce-rest-api-docs/
- **ONVO Pay Docs:** https://docs.onvopay.com/
- **TailwindCSS:** https://tailwindcss.com/docs

### Troubleshooting Común

1. **CORS Errors** → Verificar configuración WooCommerce
2. **Payment Failures** → Revisar keys de ONVO
3. **Build Errors** → Verificar tipos TypeScript
4. **Image Loading** → Configurar dominios en next.config.ts

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Configuración Inicial
- [ ] Clonar proyecto
- [ ] Instalar dependencias
- [ ] Configurar variables de entorno
- [ ] Probar conexión con WooCommerce
- [ ] Probar conexión con ONVO Pay

### Personalización
- [ ] Cambiar colores y estilos
- [ ] Actualizar logo e imágenes
- [ ] Modificar metadata y SEO
- [ ] Personalizar navegación
- [ ] Ajustar componentes homepage

### Productos
- [ ] Configurar categorías en WooCommerce
- [ ] Importar productos
- [ ] Configurar atributos y variaciones
- [ ] Probar filtros y búsqueda

### Checkout
- [ ] Probar flujo completo de compra
- [ ] Verificar creación de órdenes
- [ ] Probar diferentes métodos de pago
- [ ] Configurar emails de confirmación

### Despliegue
- [ ] Configurar dominio
- [ ] Configurar SSL
- [ ] Probar en producción
- [ ] Configurar monitoreo
- [ ] Backup inicial

---

**¡Con esta documentación tienes todo lo necesario para replicar el ecommerce en cualquier marca! 🚀** 