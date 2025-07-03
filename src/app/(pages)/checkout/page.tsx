'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Declaración de tipos para ONVO SDK
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

interface CustomerInfo {
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
      <div className="bg-[#E9E9E9]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 min-h-screen">
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
      const paymentResponse = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          currency: 'CRC',
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


      // 2. Guardar info temporal para crear la orden después
      localStorage.setItem('pending_order_info', JSON.stringify({
        customerInfo,
        cartItems: cart.items,
        paymentIntentId: paymentData.payment.id
      }));

      // 3. Mostrar el componente de pago de ONVO
      setIsLoading(false);
      setShowPaymentForm(true);
      setPaymentIntentId(paymentData.payment.id);

    } catch (err: any) {
      console.error('Error en checkout:', err);
      setError(err.message || 'Error al procesar el pago');
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount);
  };

  // Modificar el callback de éxito
  const handlePaymentSuccess = async (data: any) => {
    
    try {
      // Recuperar la información guardada
      const pendingOrderInfo = localStorage.getItem('pending_order_info');
      if (!pendingOrderInfo) {
        throw new Error('No se encontró la información de la orden');
      }

      const orderInfo = JSON.parse(pendingOrderInfo);

      // Crear la orden en WooCommerce con estado "processing"
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: orderInfo.cartItems,
          customerInfo: orderInfo.customerInfo,
          paymentIntentId: orderInfo.paymentIntentId,
          paymentStatus: 'completed'
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Error al crear la orden');
      }

      // Limpiar datos temporales y carrito
      localStorage.removeItem('pending_order_info');
      localStorage.removeItem('fighterDistrict_cart');
      clearCart();
      
      // Redirigir a página de éxito
      window.location.href = `/checkout/success?order_id=${orderData.order.id}&payment_intent_id=${orderInfo.paymentIntentId}`;
    } catch (error) {
      console.error('Error al finalizar la orden:', error);
      setError('Error al finalizar la orden. Por favor, contacta a soporte.');
    }
  };

  const handlePaymentError = (data: any) => {
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
          
          try {
            // Limpiar cualquier instancia anterior
            const container = document.getElementById('onvo-payment-container');
            if (container) {
              container.innerHTML = '';
            }
            
            
            // Renderizar el componente de pago
            window.onvo.pay({
              onError: handlePaymentError,
              onSuccess: handlePaymentSuccess,
              publicKey: process.env.NEXT_PUBLIC_ONVO_PUBLIC_KEY || 'onvo_test_publishable_key_VfvUFTY_UnbiAHUs-adMsbkJHSZPqL1cp9Sy5bJOd-itGA9WfL48YsjQpim9Hsq12zYg6y0ufdKsxLB0kNu9zw',
              paymentIntentId: paymentIntentId,
              paymentType: "one_time"
            }).render('#onvo-payment-container');
            
            
          } catch (error) {
            console.error('❌ Error al renderizar ONVO SDK:', error);
            setError('Error al cargar el formulario de pago. Por favor, recarga la página.');
          }
        } else {
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
        <h1 className="text-4xl font-raven-semibold text-center mb-8 text-black">Checkout</h1>
        
        {!showPaymentForm ? (
          <div className="grid lg:grid-cols-2 gap-8 text-black">
            {/* Formulario de información del cliente */}
            <div className="bg-white rounded-lg shadow-lg p-6 order-2 lg:order-1">
            <h2 className="text-2xl font-raven-medium mb-6">Información de Facturación</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Información personal */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                  <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                  <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                  <label className="block text-sm text-gray-700 mb-2 font-semibold">
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
                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-semibold">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={customerInfo.address.postcode}
                    onChange={(e) => handleInputChange('address.postcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
                  />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="block w-full bg-black text-white py-3 rounded-md font-raven-medium text-lg hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Procesando...' : 'Proceder al Pago'}
              </button>
            </form>
            </div>

          {/* Resumen de la orden */}
          <div className="bg-white rounded-lg shadow-lg p-6 order-1 lg:order-2">
            <h2 className="text-2xl font-raven-medium mb-6">Resumen de tu Orden</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    {item.selectedSize && (
                      <p className="text-sm text-gray-600 font-semibold">Talla: {item.selectedSize}</p>
                    )}
                    {item.selectedColor && (
                      <p className="text-sm text-gray-600 font-semibold">Color: {item.selectedColor}</p>
                    )}
                    <p className="text-sm text-gray-600 font-semibold">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between font-urbanist text-lg font-bold">
                <span>Total:</span>
                <span className="text-[#EC1D25]">{formatCurrency(cart.totalPrice)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium font-urbanist text-lg">Método de Pago</h3>
              <div className="flex items-center gap-2">
                <img 
                  src="/onvo-logo.png" 
                  alt="ONVO Pay" 
                  className="h-8"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-sm text-gray-600">Pago seguro con ONVO Pay</span>
              </div>
            </div>
          </div>
        </div>
        ) : (
          /* Formulario de pago de ONVO */
          <div className="max-w-3xl mx-auto overflow-x-hidden">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-medium text-black font-urbanist">Completar Pago</h2>
                <p className="text-gray-600">Completa tu pago de forma segura con ONVO Pay</p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                  {error}
                </div>
              )}
              
              {/* Contenedor para el SDK de ONVO */}
              <div id="onvo-payment-container" className="min-h-[400px]">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC1D25]"></div>
                  <span className="ml-3 text-gray-600">Cargando formulario de pago...</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentIntentId(null);
                    setError(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  ← Volver al formulario de checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
} 