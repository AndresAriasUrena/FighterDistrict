# 🔧 TROUBLESHOOTING Y DEPLOYMENT - ONVO PAY

## 📋 ÍNDICE
1. [Problemas Comunes](#problemas-comunes)
2. [Debugging Avanzado](#debugging-avanzado)
3. [Configuración de Producción](#configuración-de-producción)
4. [Deployment](#deployment)
5. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### 1. Error: "Refused to load script" (CSP)

**Síntoma:**
```
Refused to load the script 'https://sdk.onvopay.com/sdk.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```

**Solución:**
```typescript
// Verificar next.config.ts - debe incluir:
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.onvopay.com"
"frame-src 'self' https://sdk.onvopay.com https://checkout.onvopay.com"
```

**Pasos de verificación:**
1. Reiniciar servidor de desarrollo después de cambiar `next.config.ts`
2. Hard refresh del navegador (`Ctrl + Shift + R`)
3. Verificar que no hay múltiples servidores corriendo en el mismo puerto

### 2. Error: "SDK de ONVO no está disponible"

**Síntoma:**
```
⏳ Esperando SDK de ONVO... (aparece indefinidamente)
```

**Soluciones:**
1. **Verificar script en layout:**
   ```typescript
   // En src/app/layout.tsx debe estar:
   <script src="https://sdk.onvopay.com/sdk.js" defer></script>
   ```

2. **Verificar timing:**
   ```typescript
   // Aumentar el delay inicial si es necesario:
   setTimeout(initOnvoPayment, 1000); // en lugar de 500ms
   ```

3. **Verificar conexión a internet:**
   ```bash
   # Probar manualmente:
   curl https://sdk.onvopay.com/sdk.js
   ```

### 3. Error: "Payment Intent creation failed"

**Síntomas:**
- Error 401: Credenciales incorrectas
- Error 400: Datos inválidos
- Error 500: Error del servidor

**Soluciones:**
1. **Verificar credenciales:**
   ```bash
   # En .env.local verificar que las keys son correctas:
   ONVO_SECRET_KEY=onvo_test_secret_key_...  # SIN NEXT_PUBLIC_
   NEXT_PUBLIC_ONVO_PUBLIC_KEY=onvo_test_publishable_key_...
   ```

2. **Verificar formato de datos:**
   ```typescript
   // Amount debe estar en centavos:
   const amountInCents = Math.round(parseFloat(total) * 100);
   ```

3. **Verificar modo test/prod:**
   ```typescript
   // Para test usar keys que empiecen con:
   // onvo_test_secret_key_...
   // onvo_test_publishable_key_...
   ```

### 4. Error: "WooCommerce API connection failed"

**Síntomas:**
- 401 Unauthorized
- 404 Not Found
- Connection timeout

**Soluciones:**
1. **Verificar credenciales WC:**
   ```bash
   # Test directo de la API:
   curl -u ck_xxx:cs_xxx https://tu-dominio.com/wp-json/wc/v3/products
   ```

2. **Verificar SSL/HTTPS:**
   ```typescript
   // En woocommerce.ts:
   queryStringAuth: true  // Para HTTPS
   ```

3. **Verificar CORS:**
   ```php
   // En WordPress functions.php si es necesario:
   add_action('rest_api_init', function() {
       remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
       add_filter('rest_pre_serve_request', function($value) {
           header('Access-Control-Allow-Origin: *');
           header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
           header('Access-Control-Allow-Headers: Content-Type, Authorization');
           return $value;
       });
   });
   ```

### 5. Error: "Order creation failed"

**Síntomas:**
- Orden no aparece en WooCommerce
- Error de campos requeridos
- Error de productos no encontrados

**Soluciones:**
1. **Verificar IDs de productos:**
   ```typescript
   // Los product_id deben existir en WooCommerce
   const lineItems = cart.map(item => ({
       product_id: item.id,  // Verificar que estos IDs existen
       quantity: item.quantity
   }));
   ```

2. **Verificar campos requeridos:**
   ```typescript
   // Todos estos campos son obligatorios:
   billing: {
       first_name: 'requerido',
       last_name: 'requerido',
       email: 'requerido',
       // ... otros campos
   }
   ```

---

## 🔍 DEBUGGING AVANZADO

### 1. Logs de Desarrollo

**Activar logs detallados:**
```typescript
// En src/app/api/create-payment/route.ts
console.log('=== ONVO PAYMENT INTENT DEBUG ===');
console.log('Datos enviados:', JSON.stringify(paymentData, null, 2));
console.log('Respuesta ONVO:', JSON.stringify(paymentIntent, null, 2));
```

**En el frontend:**
```typescript
// En checkout page
useEffect(() => {
    console.log('🔍 Cart state:', cart);
    console.log('🔍 Customer info:', customerInfo);
    console.log('🔍 Payment intent ID:', paymentIntentId);
}, [cart, customerInfo, paymentIntentId]);
```

### 2. Verificación de Estado

**Script para verificar todo el estado:**
```javascript
// Ejecutar en consola del navegador:
const checkStatus = () => {
    console.log('=== ESTADO DEL SISTEMA ===');
    
    // 1. SDK
    console.log('ONVO SDK:', window.onvo ? '✅ Cargado' : '❌ No cargado');
    
    // 2. Variables de entorno
    console.log('Variables:', {
        WC_URL: !!process.env.NEXT_PUBLIC_WC_URL,
        ONVO_KEY: !!process.env.NEXT_PUBLIC_ONVO_PUBLIC_KEY
    });
    
    // 3. LocalStorage
    console.log('Cart en localStorage:', !!localStorage.getItem('cart'));
    
    // 4. Network
    fetch('/api/products?per_page=1')
        .then(res => console.log('API Status:', res.status))
        .catch(err => console.log('API Error:', err));
};

checkStatus();
```

### 3. Testing de Endpoints

**Test de crear orden:**
```javascript
const testCreateOrder = async () => {
    const testData = {
        cart: [{
            id: 155,  // Reemplazar con ID real
            quantity: 1,
            name: "Test Product",
            price: 10
        }],
        customerInfo: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            phone: "12345678",
            address: {
                address1: "Test Address",
                city: "Test City",
                state: "Test State",
                postcode: "12345",
                country: "CR"
            }
        }
    };
    
    try {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        console.log('Order Test:', response.status, result);
    } catch (error) {
        console.error('Order Test Error:', error);
    }
};

testCreateOrder();
```

---

## 🚀 CONFIGURACIÓN DE PRODUCCIÓN

### 1. Variables de Entorno Producción

```bash
# .env.production
NEXT_PUBLIC_WC_URL=https://tu-dominio-produccion.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_live_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_live_xxxxxxxxxxxxxxxx

# ONVO PRODUCCIÓN
NEXT_PUBLIC_ONVO_PUBLIC_KEY=onvo_live_publishable_key_xxxxxxxxxxxxxxxx
ONVO_SECRET_KEY=onvo_live_secret_key_xxxxxxxxxxxxxxxx

NEXT_PUBLIC_SITE_URL=https://tu-tienda.com
NODE_ENV=production
```

### 2. CSP de Producción

```typescript
// next.config.ts para producción
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.onvopay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self' https: https://api.onvopay.com; frame-src 'self' https://sdk.onvopay.com https://checkout.onvopay.com;"
}
```

### 3. Optimizaciones de Performance

```typescript
// Lazy loading del checkout
const CheckoutPage = dynamic(() => import('./checkout/page'), {
  loading: () => <div>Cargando checkout...</div>
});

// Preload del SDK en componentes críticos
useEffect(() => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = 'https://sdk.onvopay.com/sdk.js';
    link.as = 'script';
    document.head.appendChild(link);
  }
}, []);
```

---

## 📦 DEPLOYMENT

### 1. Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configurar variables de entorno en dashboard
```

**Configuración en Vercel Dashboard:**
- Project Settings → Environment Variables
- Agregar todas las variables de `.env.production`
- Habilitar para Production, Preview y Development según necesidades

### 2. Netlify

```bash
# 1. Build del proyecto
npm run build

# 2. Deploy folder
# Subir la carpeta .next/static y out/
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.onvopay.com; frame-src 'self' https://sdk.onvopay.com https://checkout.onvopay.com;"
```

### 3. Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_WC_URL=${WC_URL}
      - NEXT_PUBLIC_WC_CONSUMER_KEY=${WC_CONSUMER_KEY}
      - NEXT_PUBLIC_WC_CONSUMER_SECRET=${WC_CONSUMER_SECRET}
      - NEXT_PUBLIC_ONVO_PUBLIC_KEY=${ONVO_PUBLIC_KEY}
      - ONVO_SECRET_KEY=${ONVO_SECRET_KEY}
```

---

## 📊 MONITOREO Y MANTENIMIENTO

### 1. Logging en Producción

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Enviar a servicio de logging (Sentry, LogRocket, etc.)
      console.log(`[INFO] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Enviar a servicio de monitoreo
      console.error(`[ERROR] ${message}`, error);
    }
  }
};
```

### 2. Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Verificar conectividad con WooCommerce
    const wcResponse = await fetch(`${process.env.NEXT_PUBLIC_WC_URL}/wp-json/wc/v3/system_status`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_WC_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET}`).toString('base64')}`
      }
    });
    
    // Verificar ONVO (opcional)
    const onvoResponse = await fetch('https://api.onvopay.com/v1/health');
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        woocommerce: wcResponse.ok,
        onvo: onvoResponse.ok
      }
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}
```

### 3. Analytics de Conversión

```typescript
// Tracking de eventos importantes
const trackCheckoutStep = (step: string, data?: any) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'checkout_progress', {
      checkout_step: step,
      currency: 'USD',
      value: data?.total || 0
    });
  }
};

// En el checkout:
trackCheckoutStep('begin_checkout', { total: cart.total });
trackCheckoutStep('add_payment_info', { payment_method: 'onvo' });
trackCheckoutStep('purchase', { total: orderData.total, order_id: orderData.id });
```

### 4. Maintenance Tasks

**Script de verificación semanal:**
```bash
#!/bin/bash
# maintenance.sh

echo "🔍 Verificando estado del sistema..."

# Test endpoints críticos
curl -f https://tu-tienda.com/api/health || echo "❌ Health check failed"
curl -f https://tu-tienda.com/api/products?per_page=1 || echo "❌ Products API failed"

# Verificar certificados SSL
openssl s_client -connect tu-tienda.com:443 -servername tu-tienda.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

echo "✅ Verificación completada"
```

---

## 📋 CHECKLIST PRE-DEPLOYMENT

### ✅ Configuración:
- [ ] Variables de entorno de producción configuradas
- [ ] CSP actualizado para dominios de producción
- [ ] SSL/HTTPS habilitado
- [ ] DNS configurado correctamente

### ✅ Testing:
- [ ] Flujo completo de checkout probado
- [ ] Pagos test exitosos
- [ ] Páginas de error funcionando
- [ ] Responsive design verificado

### ✅ Performance:
- [ ] Build optimizado (`npm run build`)
- [ ] Imágenes optimizadas
- [ ] Fonts preloaded
- [ ] SDK carga sin bloquear

### ✅ SEO:
- [ ] Meta tags configurados
- [ ] Structured data implementado
- [ ] Sitemap generado
- [ ] robots.txt configurado

### ✅ Analytics:
- [ ] Google Analytics configurado
- [ ] Facebook Pixel (si aplica)
- [ ] Tracking de conversiones configurado

¡Tu tienda está lista para producción! 🚀

---

## 🆘 CONTACTO Y SOPORTE

Si encuentras problemas no cubiertos en esta documentación:

1. **Revisar logs** en herramientas de desarrollo
2. **Verificar configuración** paso a paso
3. **Contactar soporte de ONVO** para problemas específicos de pagos
4. **Revisar documentación oficial** de WooCommerce REST API

**Recursos útiles:**
- [Documentación ONVO Pay](https://docs.onvopay.com/)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [Next.js Documentation](https://nextjs.org/docs)

¡Éxito con tu tienda online! 🛒✨ 