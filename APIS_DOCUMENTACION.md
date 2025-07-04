# 🔌 Documentación Detallada de APIs - FighterDistrict

## 📋 Índice
1. [APIs de Productos](#apis-de-productos)
2. [APIs de Pagos](#apis-de-pagos)
3. [APIs de Órdenes](#apis-de-órdenes)
4. [APIs de Verificación](#apis-de-verificación)
5. [APIs de Checkout](#apis-de-checkout)

---

## 🛍️ APIs de Productos

### GET /api/products

**Descripción:** Obtiene la lista de productos con soporte para paginación, ordenamiento y filtrado.

**Características:**
- Rate limiting: 30 requests/minuto
- Cache: 5 minutos
- Paginación: Máximo 100 productos por página

**Parámetros de Query:**
```typescript
interface ProductsQuery {
  per_page?: number;     // Default: 100, Max: 100
  orderby?: 'date' | 'id' | 'title' | 'slug' | 'modified' | 'menu_order' | 'price';
  order?: 'asc' | 'desc';
}
```

**Ejemplo de Uso:**
```typescript
// Obtener productos ordenados por precio
GET /api/products?orderby=price&order=desc&per_page=50

// Respuesta exitosa (200 OK)
{
  data: WooCommerceProduct[],
  headers: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
  }
}

// Error de rate limit (429 Too Many Requests)
{
  error: 'Too many requests',
  retryAfter: 60
}
```

**Manejo de Errores:**
```typescript
// 400 Bad Request
{
  error: 'per_page debe ser un número entre 1 y 100'
}

// 429 Too Many Requests
{
  error: 'Too many requests',
  retryAfter: 60
}

// 500 Internal Server Error
{
  error: 'Failed to fetch products'
}
```

---

## 💳 APIs de Pagos

### POST /api/create-payment

**Descripción:** Crea una intención de pago en ONVO Pay.

**Request Body:**
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
```

**Ejemplo de Uso:**
```typescript
// Request
POST /api/create-payment
{
  "total": 25000,
  "customerInfo": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "+50688887777"
  },
  "cartItems": [
    {
      "name": "Guantes de Box",
      "price": 25000,
      "quantity": 1
    }
  ]
}

// Respuesta exitosa (200 OK)
{
  "success": true,
  "payment": {
    "id": "pi_123456789",
    "status": "requires_payment_method",
    "amount": 25000,
    "currency": "CRC"
  }
}
```

**Validaciones:**
```typescript
// Validación de total
if (!total || total <= 0) {
  return { error: 'El total debe ser mayor a 0' };
}

// Validación de cliente
if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
  return { error: 'Información del cliente incompleta' };
}

// Validación de carrito
if (!cartItems || cartItems.length === 0) {
  return { error: 'El carrito está vacío' };
}
```

---

## 📦 APIs de Órdenes

### POST /api/create-order

**Descripción:** Crea una orden en WooCommerce después de un pago exitoso.

**Request Body:**
```typescript
interface CreateOrderRequest {
  cart: CartItem[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      address1?: string;
      address2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
  };
  paymentIntentId: string;
  paymentStatus: 'completed' | 'failed';
}
```

**Ejemplo de Uso:**
```typescript
// Request
POST /api/create-order
{
  "cart": [{
    "id": 123,
    "name": "Guantes de Box",
    "price": 25000,
    "quantity": 1,
    "selectedSize": "M",
    "selectedColor": "Negro"
  }],
  "customerInfo": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "+50688887777",
    "address": {
      "address1": "Calle Principal",
      "city": "San José",
      "state": "San José",
      "country": "CR"
    }
  },
  "paymentIntentId": "pi_123456789",
  "paymentStatus": "completed"
}

// Respuesta exitosa (200 OK)
{
  "success": true,
  "order": {
    "id": 1234,
    "total": 25000,
    "currency": "CRC",
    "status": "processing",
    "order_key": "wc_order_abc123"
  }
}
```

**Metadata Adicional:**
```typescript
// Metadata que se guarda con la orden
const orderMetadata = [
  {
    key: 'created_via',
    value: 'fighter_district_frontend'
  },
  {
    key: 'payment_gateway',
    value: 'onvo'
  },
  {
    key: 'onvo_payment_intent_id',
    value: paymentIntentId
  }
];
```

---

## ✅ APIs de Verificación

### GET /api/verify-order

**Descripción:** Verifica el estado de una orden después del pago.

**Parámetros de Query:**
```typescript
interface VerifyOrderQuery {
  orderId: string;  // ID de la orden en WooCommerce
}
```

**Ejemplo de Uso:**
```typescript
// Request
GET /api/verify-order?orderId=1234

// Respuesta exitosa (200 OK)
{
  "success": true,
  "order": {
    "id": 1234,
    "status": "processing",
    "total": "25000",
    "currency": "CRC",
    "date_created": "2024-02-20T10:30:00",
    "billing": {
      "first_name": "Juan",
      "last_name": "Pérez",
      // ... más datos de facturación
    },
    "line_items": [
      {
        "name": "Guantes de Box",
        "quantity": 1,
        "total": "25000"
      }
    ]
  }
}
```

---

## 🛒 APIs de Checkout

### POST /api/create-checkout-session

**Descripción:** Crea una sesión de checkout en ONVO Pay.

**Request Body:**
```typescript
interface CreateCheckoutSessionRequest {
  orderId: number;
  total: number;
  currency?: string;
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
```

**Características Especiales:**
- Formateo automático de números telefónicos para Costa Rica (+506)
- URLs de retorno dinámicas basadas en el ambiente
- Manejo de metadata para tracking

**Ejemplo de Uso:**
```typescript
// Request
POST /api/create-checkout-session
{
  "orderId": 1234,
  "total": 25000,
  "currency": "CRC",
  "customerInfo": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "88887777"  // Se formatea automáticamente a +50688887777
  },
  "cartItems": [
    {
      "name": "Guantes de Box",
      "price": 25000,
      "quantity": 1
    }
  ]
}

// Respuesta exitosa (200 OK)
{
  "type": "checkout_session",
  "payment": {
    "id": "cs_123456789",
    "url": "https://checkout.onvopay.com/session/cs_123456789"
  }
}
```

**Formateo de Teléfono:**
```typescript
const formatPhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Números costarricenses de 8 dígitos
  if (cleanPhone.length === 8 && /^[24678]/.test(cleanPhone)) {
    return `+506${cleanPhone}`;
  }
  
  return phone.startsWith('+') ? phone : `+${cleanPhone}`;
};
```

---

## 🔒 Seguridad y Buenas Prácticas

### Headers de Seguridad
```typescript
const headers = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  'Content-Type': 'application/json',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin'
};
```

### Rate Limiting
```typescript
const RATE_LIMIT = 30;  // requests por minuto
const WINDOW_MS = 60 * 1000;  // 1 minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);
  
  if (!userRequests) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  if (now - userRequests.timestamp > WINDOW_MS) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  userRequests.count++;
  return userRequests.count > RATE_LIMIT;
}
```

### Logging Estructurado
```typescript
const errorLog = {
  timestamp: new Date().toISOString(),
  endpoint: '/api/products',
  method: 'GET',
  error: error instanceof Error ? error.message : 'Unknown error',
  ip: request.ip || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown'
};
```

---

## 📝 Notas Importantes

1. **Rate Limiting:**
   - Implementado por IP
   - 30 requests por minuto
   - Ventana deslizante de 1 minuto

2. **Caché:**
   - 5 minutos de caché para productos
   - stale-while-revalidate de 60 segundos

3. **Validaciones:**
   - Todos los endpoints tienen validaciones de entrada
   - Manejo de errores estructurado
   - Respuestas consistentes

4. **Seguridad:**
   - Headers de seguridad en todas las respuestas
   - Sanitización de datos de entrada
   - Logging estructurado para debugging

5. **Integración:**
   - WooCommerce para productos y órdenes
   - ONVO Pay para pagos
   - Sincronización bidireccional

---

## 🔍 Ejemplos de Uso Común

### 1. Flujo de Compra Completo:
```typescript
// 1. Obtener productos
GET /api/products

// 2. Crear intención de pago
POST /api/create-payment
{
  total: 25000,
  customerInfo: {...},
  cartItems: [...]
}

// 3. Crear orden
POST /api/create-order
{
  cart: [...],
  customerInfo: {...},
  paymentIntentId: "pi_123",
  paymentStatus: "completed"
}

// 4. Verificar orden
GET /api/verify-order?orderId=1234
```

### 2. Manejo de Errores:
```typescript
try {
  const response = await fetch('/api/create-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  // Procesar respuesta exitosa
} catch (error) {
  console.error('Error en el pago:', error);
  // Manejar error
}
```

---

## 🚀 Mejores Prácticas de Implementación

1. **Siempre validar entradas:**
   ```typescript
   if (!orderId) {
     return NextResponse.json(
       { error: 'Order ID is required' },
       { status: 400 }
     );
   }
   ```

2. **Usar tipos TypeScript:**
   ```typescript
   interface APIResponse<T> {
     success: boolean;
     data?: T;
     error?: string;
   }
   ```

3. **Manejar errores consistentemente:**
   ```typescript
   catch (error: any) {
     console.error('Error:', error);
     return NextResponse.json(
       { error: 'Error interno del servidor' },
       { status: 500 }
     );
   }
   ```

4. **Implementar rate limiting:**
   ```typescript
   if (isRateLimited(ip)) {
     return NextResponse.json(
       { error: 'Too many requests' },
       { status: 429 }
     );
   }
   ```

5. **Usar logging estructurado:**
   ```typescript
   console.error('API Error:', {
     timestamp: new Date().toISOString(),
     endpoint: '/api/products',
     error: error.message
   });
   ``` 