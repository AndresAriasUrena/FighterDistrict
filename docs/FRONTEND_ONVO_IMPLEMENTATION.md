# 🎨 IMPLEMENTACIÓN DEL FRONTEND - ONVO PAY

## 📋 CONTENIDO
1. [Layout Principal](#layout-principal)
2. [Página de Checkout](#página-de-checkout)
3. [Context del Carrito](#context-del-carrito)
4. [Páginas de Resultado](#páginas-de-resultado)
5. [Componentes de UI](#componentes-de-ui)
6. [Estilos y Responsive](#estilos-y-responsive)

---

## 🏗️ LAYOUT PRINCIPAL

### 1. Configurar Layout con SDK de ONVO

Actualizar `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/lib/SearchContext";
import { CartProvider } from "@/lib/CartContext";
import CartSidebar from "@/components/CartSidebar";
import CartSyncIndicator from "@/components/CartSyncIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tu Tienda - El Mejor Equipo Online",
    template: "%s | Tu Tienda"
  },
  description: "Encuentra los mejores productos para tu negocio.",
  // ... resto de metadatos
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* ONVO Pay SDK - CRÍTICO PARA EL FUNCIONAMIENTO */}
        <script src="https://sdk.onvopay.com/sdk.js" defer></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-urbanist`}>
        <SearchProvider>
          <CartProvider>
            {children}
            <CartSidebar />
            <CartSyncIndicator />
          </CartProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
```

**🔍 Puntos Clave:**
- **`defer`**: El SDK se carga después del DOM
- **Posición**: En `<head>` para disponibilidad global
- **Providers**: CartProvider envuelve toda la app

---

## 🛒 PÁGINA DE CHECKOUT COMPLETA

### 1. Tipos TypeScript

Crear `src/types/checkout.ts`:

```typescript
// Declaración global para ONVO SDK
declare global {
  interface Window {
    onvo: {
      pay: (options: {
        onError: (data: any) => void;
        onSuccess: (data: any) => void;
        publicKey: string;
        paymentIntentId: string;
        paymentType: string;
      }) => {
        render: (selector: string) => void;
      };
    };
  }
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedSize?: string;
  selectedColor?: string;
}
```

### 2. Página de Checkout Principal

Crear `src/app/(pages)/checkout/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CustomerInfo } from '@/types/checkout';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      address1: '',
      address2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'CR'
    }
  });

  // Redirigir si el carrito está vacío
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-raven-bold mb-4">Carrito Vacío</h1>
            <p className="text-gray-600 mb-8">No tienes productos en tu carrito para proceder al checkout.</p>
            <button
              onClick={() => router.push('/store')}
              className="bg-[#EC1D25] text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Ir a la Tienda
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomerInfo(prev => ({
        ...prev,
        [parent]: {
          ...((prev as any)[parent]),
          [child]: value
        }
      }));
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Iniciando proceso de checkout...');
      
      // 1. Crear la orden en WooCommerce
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cart.items,
          customerInfo: customerInfo
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Error al crear la orden');
      }

      console.log('Orden creada:', orderData.order);

      // 2. Crear payment intent en ONVO
      console.log('Creando payment intent en ONVO...');
      
      const paymentResponse = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.order.id,
          total: orderData.order.total,
          currency: 'USD',
          customerInfo: {
            ...customerInfo,
            phone: customerInfo.phone || ''
          },
          cartItems: cart.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        }),
      });

      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Error al crear el pago en ONVO');
      }

      console.log('Payment intent creado exitosamente:', paymentData.payment);

      // 3. Guardar info de la orden para el SDK
      localStorage.setItem('current_order', JSON.stringify({
        orderId: orderData.order.id,
        paymentIntentId: paymentData.payment.id,
        total: orderData.order.total
      }));

      // 4. Mostrar el componente de pago de ONVO
      setIsLoading(false);
      setShowPaymentForm(true);
      setPaymentIntentId(paymentData.payment.id);

    } catch (err: any) {
      console.error('Error en checkout:', err);
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount);
  };

  // Callbacks para el SDK de ONVO
  const handlePaymentSuccess = (data: any) => {
    console.log('✅ Pago exitoso:', data);
    
    // Limpiar el carrito
    clearCart();
    
    // Obtener información guardada
    const orderInfo = localStorage.getItem('current_order');
    const order = orderInfo ? JSON.parse(orderInfo) : null;
    
    // Redirigir a página de éxito
    window.location.href = `/checkout/success?order_id=${order?.orderId || ''}&payment_intent_id=${paymentIntentId}`;
  };

  const handlePaymentError = (data: any) => {
    console.log('❌ Error en pago:', data);
    setError('Error al procesar el pago. Por favor, intenta de nuevo.');
    setShowPaymentForm(false);
    setIsLoading(false);
  };

  // Effect para renderizar el SDK de ONVO
  useEffect(() => {
    if (showPaymentForm && paymentIntentId && typeof window !== 'undefined') {
      
      const initOnvoPayment = () => {
        // Verificar si el SDK está disponible
        if (window.onvo && typeof window.onvo.pay === 'function') {
          console.log('🚀 Inicializando ONVO SDK...');
          
          try {
            // Limpiar cualquier instancia anterior
            const container = document.getElementById('onvo-payment-container');
            if (container) {
              container.innerHTML = '';
            }
            
            console.log('🚀 Renderizando formulario de pago...');
            
            // Renderizar el componente de pago
            window.onvo.pay({
              onError: handlePaymentError,
              onSuccess: handlePaymentSuccess,
              publicKey: process.env.NEXT_PUBLIC_ONVO_PUBLIC_KEY || 'onvo_test_publishable_key_VfvUFTY_UnbiAHUs-adMsbkJHSZPqL1cp9Sy5bJOd-itGA9WfL48YsjQpim9Hsq12zYg6y0ufdKsxLB0kNu9zw',
              paymentIntentId: paymentIntentId,
              paymentType: "one_time"
            }).render('#onvo-payment-container');
            
            console.log('✅ Formulario de pago de ONVO renderizado exitosamente');
            
          } catch (error) {
            console.error('❌ Error al renderizar ONVO SDK:', error);
            setError('Error al cargar el formulario de pago. Por favor, recarga la página.');
          }
        } else {
          console.log('⏳ Esperando SDK de ONVO...');
          // Reintentar después de un breve delay
          setTimeout(initOnvoPayment, 100);
        }
      };
      
      // Iniciar después de un pequeño delay para dar tiempo al script
      setTimeout(initOnvoPayment, 500);
    }
  }, [showPaymentForm, paymentIntentId]);

  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-raven-bold text-center mb-8">Checkout</h1>
        
        {!showPaymentForm ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulario de información del cliente */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-raven-bold mb-6">Información de Facturación</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Información personal */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={customerInfo.address.address1}
                    onChange={(e) => handleInputChange('address.address1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.postcode}
                      onChange={(e) => handleInputChange('address.postcode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <select
                      value={customerInfo.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                    >
                      <option value="CR">Costa Rica</option>
                      <option value="US">Estados Unidos</option>
                      <option value="CA">Canadá</option>
                      <option value="MX">México</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#EC1D25] text-white py-3 px-6 rounded-lg font-raven-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Procesando...' : 'Proceder al Pago'}
                </button>
              </form>
            </div>

            {/* Resumen de la orden */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-raven-bold mb-6">Resumen de tu Orden</h2>
              
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.selectedSize && (
                        <p className="text-sm text-gray-600">Talla: {item.selectedSize}</p>
                      )}
                      {item.selectedColor && (
                        <p className="text-sm text-gray-600">Color: {item.selectedColor}</p>
                      )}
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Envío:</span>
                  <span>Gratis</span>
                </div>
                <div className="flex justify-between items-center text-xl font-raven-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Formulario de pago de ONVO
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-raven-bold mb-2">Completar Pago</h2>
                <p className="text-gray-600">Completa tu pago de forma segura con ONVO Pay</p>
              </div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                  ← Volver al formulario de checkout
                </button>
              </div>

              {/* Contenedor donde se renderiza el SDK de ONVO */}
              <div id="onvo-payment-container" className="min-h-[400px]"></div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
```

### 3. Context del Carrito

Crear `src/lib/CartContext.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: { id: number; selectedSize?: string; selectedColor?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number; selectedSize?: string; selectedColor?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const CartContext = createContext<{
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (id: number, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
} | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.items.findIndex(item => 
        item.id === action.payload.id && 
        item.selectedSize === action.payload.selectedSize &&
        item.selectedColor === action.payload.selectedColor
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => 
        !(item.id === action.payload.id && 
          item.selectedSize === action.payload.selectedSize &&
          item.selectedColor === action.payload.selectedColor)
      );
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id && 
        item.selectedSize === action.payload.selectedSize &&
        item.selectedColor === action.payload.selectedColor
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  });

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const removeFromCart = (id: number, selectedSize?: string, selectedColor?: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id, selectedSize, selectedColor } });
  };

  const updateQuantity = (id: number, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, selectedSize, selectedColor);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity, selectedSize, selectedColor } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
```

Continúo con las páginas de resultado en el siguiente archivo... 