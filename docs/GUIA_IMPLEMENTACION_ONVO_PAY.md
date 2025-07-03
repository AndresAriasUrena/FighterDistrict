# 🎯 GUÍA COMPLETA: IMPLEMENTACIÓN ONVO PAY EN NEXT.JS + WOOCOMMERCE

## 📋 ÍNDICE
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Prerrequisitos](#prerrequisitos)
3. [Configuración Inicial](#configuración-inicial)
4. [Variables de Entorno](#variables-de-entorno)
5. [Configuración de CSP](#configuración-de-csp)
6. [Implementación del Backend](#implementación-del-backend)
7. [Implementación del Frontend](#implementación-del-frontend)
8. [Testing y Validación](#testing-y-validación)
9. [Troubleshooting](#troubleshooting)
10. [Deployment](#deployment)

---

## 📊 RESUMEN EJECUTIVO

Esta guía implementa un **sistema de pagos completo** usando **ONVO Pay** integrado con **WooCommerce** y **Next.js 15**. 

### ✅ Lo que lograrás:
- **Checkout funcional completo** con formulario de información del cliente
- **Integración real con ONVO Pay** usando Payment Intents y SDK
- **Órdenes sincronizadas** entre tu frontend y WooCommerce
- **Flujo de pago seguro** con manejo de errores robusto
- **CSP configurado correctamente** para seguridad en producción

### 🏗️ Arquitectura Final:
```
Cliente → Formulario Checkout → Crear Orden WC → Crear Payment Intent → SDK ONVO → Pago → Success
```

---

## 🔧 PRERREQUISITOS

### Tecnologías Requeridas:
- ✅ **Node.js 18+** con npm
- ✅ **Next.js 15.3.4** con App Router
- ✅ **React 19** con TypeScript
- ✅ **WooCommerce** con REST API habilitada
- ✅ **Cuenta ONVO Pay** (test y producción)

### Conocimientos Necesarios:
- ✅ **React Hooks** (useState, useEffect, useContext)
- ✅ **Next.js App Router** y API Routes
- ✅ **TypeScript básico**
- ✅ **REST APIs** y manejo de promesas
- ✅ **CSS/Tailwind** para estilos

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Configurar WooCommerce REST API

En tu panel de WordPress/WooCommerce:

1. **Ir a**: `WooCommerce → Settings → Advanced → REST API`
2. **Crear nueva API Key**:
   - Description: `Fighter District Frontend`
   - User: `Administrator`
   - Permissions: `Read/Write`
3. **Guardar**: Consumer Key y Consumer Secret

### 2. Configurar Cuenta ONVO Pay

1. **Registrarse en**: [ONVO Pay](https://dashboard.onvopay.com/)
2. **Activar modo TEST**
3. **Obtener credenciales**:
   - Public Key (test): `onvo_test_publishable_key_...`
   - Secret Key (test): `onvo_test_secret_key_...`

### 3. Instalar Dependencias

```bash
# Dependencias principales
npm install @woocommerce/woocommerce-rest-api

# Dependencias de desarrollo
npm install @types/node typescript
```

---

## 🔐 VARIABLES DE ENTORNO

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# ===========================================
# CONFIGURACIÓN WOOCOMMERCE
# ===========================================
NEXT_PUBLIC_WC_URL=https://tu-dominio.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# CONFIGURACIÓN ONVO PAY
# ===========================================
# Credenciales TEST (para desarrollo)
NEXT_PUBLIC_ONVO_PUBLIC_KEY=onvo_test_publishable_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ONVO_SECRET_KEY=onvo_test_secret_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Credenciales PRODUCCIÓN (para deploy)
# NEXT_PUBLIC_ONVO_PUBLIC_KEY=onvo_live_publishable_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ONVO_SECRET_KEY=onvo_live_secret_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# CONFIGURACIÓN GENERAL
# ===========================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### ⚠️ IMPORTANTE: Seguridad de Variables

- **`NEXT_PUBLIC_`**: Se exponen al browser (solo para public keys)
- **Sin prefijo**: Solo disponibles en servidor (para secret keys)
- **Nunca commitear** `.env.local` a Git
- **Usar diferentes credenciales** para test y producción

---

## 🛡️ CONFIGURACIÓN DE CSP (Content Security Policy)

**CRÍTICO**: Sin esta configuración, ONVO Pay será bloqueado por el navegador.

### Actualizar `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tu-dominio.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; img-src 'self' https: data: blob:; connect-src 'self' https:; frame-src 'self' https:;"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.onvopay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self' https: https://api.onvopay.com; frame-src 'self' https://sdk.onvopay.com https://checkout.onvopay.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 🔍 Explicación del CSP:

- **`script-src`**: Permite cargar el SDK de ONVO
- **`frame-src`**: Permite el iframe del formulario de pago
- **`connect-src`**: Permite APIs calls a ONVO
- **Desarrollo vs Producción**: Más permisivo en desarrollo, específico en producción

---

## 🔧 IMPLEMENTACIÓN DEL BACKEND

### 1. Configurar Cliente WooCommerce

Crear `src/lib/woocommerce.ts`:

```typescript
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_URL!,
  consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!,
  consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!,
  version: "wc/v3",
  queryStringAuth: true
});

export { api };
```

### 2. Configurar Cliente ONVO

Crear `src/lib/onvo.ts`:

```typescript
export const ONVO_CONFIG = {
  API_BASE_URL: 'https://api.onvopay.com/v1',
  SECRET_KEY: process.env.ONVO_SECRET_KEY,
  PUBLIC_KEY: process.env.NEXT_PUBLIC_ONVO_PUBLIC_KEY,
};

export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}) {
  const response = await fetch(`${ONVO_CONFIG.API_BASE_URL}/payment-intents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ONVO_CONFIG.SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      captureMethod: 'automatic',
      metadata: params.metadata || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ONVO API Error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}
```

### 3. API Route: Crear Orden WooCommerce

Crear `src/app/api/create-order/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const { cart, customerInfo } = await request.json();

    // Transformar items del carrito
    const lineItems = cart.map((item: any) => ({
      product_id: item.id,
      quantity: item.quantity,
      meta_data: [
        ...(item.selectedSize ? [{ key: 'Size', value: item.selectedSize }] : []),
        ...(item.selectedColor ? [{ key: 'Color', value: item.selectedColor }] : []),
      ]
    }));

    // Crear orden en WooCommerce
    const orderData = {
      payment_method: 'onvo',
      payment_method_title: 'ONVO Pay',
      set_paid: false,
      status: 'pending',
      billing: {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address_1: customerInfo.address.address1,
        address_2: customerInfo.address.address2 || '',
        city: customerInfo.address.city,
        state: customerInfo.address.state,
        postcode: customerInfo.address.postcode,
        country: customerInfo.address.country
      },
      shipping: {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        address_1: customerInfo.address.address1,
        address_2: customerInfo.address.address2 || '',
        city: customerInfo.address.city,
        state: customerInfo.address.state,
        postcode: customerInfo.address.postcode,
        country: customerInfo.address.country
      },
      line_items: lineItems,
      meta_data: [
        { key: 'created_via', value: 'fighter_district_frontend' },
        { key: 'payment_gateway', value: 'onvo' }
      ]
    };

    console.log('Creando orden en WooCommerce:', orderData);

    const response = await api.post('orders', orderData);
    
    console.log('Orden creada exitosamente:', response.data.id);

    return NextResponse.json({
      success: true,
      order: {
        id: response.data.id,
        total: parseFloat(response.data.total),
        currency: response.data.currency,
        status: response.data.status,
        order_key: response.data.order_key
      }
    });

  } catch (error: any) {
    console.error('Error creando orden:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear la orden en WooCommerce',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
```

### 4. API Route: Crear Payment Intent ONVO

Crear `src/app/api/create-payment/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/onvo';

export async function POST(request: NextRequest) {
  try {
    const { orderId, total, currency, customerInfo, cartItems } = await request.json();

    // Convertir total a centavos
    const amountInCents = Math.round(parseFloat(total) * 100);

    console.log('=== ONVO PAYMENT INTENT DEBUG ===');
    
    const paymentData = {
      amount: amountInCents,
      currency: currency || 'USD',
      description: `Orden #${orderId} - Fighter District`,
      metadata: {
        order_id: orderId.toString(),
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        store: 'Fighter District',
        original_total: total.toString(),
        final_amount: amountInCents.toString(),
        final_currency: currency || 'USD'
      }
    };

    console.log('Datos enviados a ONVO:', JSON.stringify(paymentData, null, 2));

    // Crear payment intent en ONVO
    const paymentIntent = await createPaymentIntent(paymentData);

    console.log('=== RESPUESTA DE ONVO ===');
    console.log('Payment intent creado:', JSON.stringify(paymentIntent, null, 2));

    // URLs de retorno
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/checkout/success?order_id=${orderId}&payment_intent_id=${paymentIntent.id}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order_id=${orderId}&payment_intent_id=${paymentIntent.id}`;

    console.log('=== URLs DE RETORNO ===');
    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);

    // Construir URL de checkout
    const checkoutUrl = `https://checkout.onvopay.com/pay/${paymentIntent.id}?return_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;

    console.log('=== URL DE CHECKOUT FINAL ===');
    console.log('Checkout URL:', checkoutUrl);

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentIntent.id,
        url: checkoutUrl,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });

  } catch (error: any) {
    console.error('💥 Error creando Payment Intent:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear el pago en ONVO',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
```

Continúo en el siguiente archivo... 