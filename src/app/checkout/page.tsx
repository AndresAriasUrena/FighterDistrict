'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/lib/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckoutOrderData } from '@/types/onvo';

// Declarar tipos para ONVO SDK global
declare global {
  interface Window {
    onvo: {
      pay: (config: {
        onError: (data: any) => void;
        onSuccess: (data: any) => void;
        publicKey: string;
        paymentIntentId: string;
        paymentType: 'one_time';
        customerId?: string;
      }) => {
        render: (selector: string) => void;
      };
    };
  }
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface CreatePaymentResponse {
  success: boolean;
  paymentIntentId?: string;
  orderId?: number;
  amount?: number;
  currency?: string;
  error?: string;
  details?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'CR'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSDKLoad = () => {
    console.log('🚀 SDK de ONVO cargado correctamente');
    setSdkLoaded(true);
  };

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Por favor completa todos los campos obligatorios');
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Crear la orden en WooCommerce
      const orderData: CheckoutOrderData = {
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address_1: formData.address,
          city: formData.city,
          state: '',
          postcode: formData.postalCode,
          country: formData.country
        },
        payment_method: 'onvo',
        payment_method_title: 'ONVO Pay',
        set_paid: false,
        status: 'pending'
      };

      const cartItems = cart.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor
      }));
      
      const createOrderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          cartItems
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        console.error('❌ Error en create-order:', errorData);
        throw new Error(errorData.error || 'Error al crear la orden');
      }

      const orderResult = await createOrderResponse.json();
      console.log('✅ Orden creada exitosamente:', orderResult);
      setOrderId(orderResult.orderId);

      // Si es gratis, redirigir directamente al éxito
      if (cart.totalPrice === 0) {
        console.log('🎁 Orden gratuita - redirigiendo al éxito');
        clearCart();
        router.push(`/checkout/success?order_id=${orderResult.orderId}`);
        return;
      }

      // Preparar datos para el pago
      const paymentData = {
        orderId: orderResult.orderId.toString(),
        orderNumber: orderResult.orderNumber,
        total: orderResult.total,
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`
      };

      console.log('Datos para pago:', paymentData);

      // 2. Crear Payment Intent en ONVO
      const createPaymentResponse = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!createPaymentResponse.ok) {
        const errorData = await createPaymentResponse.json();
        console.error('❌ Error en create-payment:', errorData);
        throw new Error(errorData.error || 'Error al crear el Payment Intent');
      }

      const paymentResult: CreatePaymentResponse = await createPaymentResponse.json();
      console.log('✅ Respuesta de create-payment:', paymentResult);

      // 3. Verificar si fue exitoso
      if (!paymentResult.success || !paymentResult.paymentIntentId) {
        throw new Error(paymentResult.error || 'Error al crear el Payment Intent');
      }

      // 4. Mostrar formulario de pago de ONVO
      setPaymentIntentId(paymentResult.paymentIntentId);
      setShowPaymentForm(true);

      // 5. Inicializar SDK de ONVO si está cargado
      if (sdkLoaded && window.onvo) {
        initializeOnvoSDK(paymentResult.paymentIntentId);
      }

    } catch (error) {
      console.error('Error en checkout:', error);
      setError(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const initializeOnvoSDK = (intentId: string) => {
    if (!window.onvo || !sdkLoaded) {
      console.error('❌ SDK de ONVO no está disponible:', {
        hasWindow: !!window,
        hasOnvo: !!window.onvo,
        sdkLoaded
      });
      setError('SDK de ONVO no está disponible. Recarga la página.');
      return;
    }

    const publishableKey = process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('❌ Clave pública de ONVO no configurada');
      setError('Configuración de pagos incompleta. Contacta soporte.');
      return;
    }

    console.log('🎯 Inicializando SDK de ONVO:', {
      intentId,
      hasPublishableKey: !!publishableKey,
      publishableKeyPrefix: publishableKey?.substring(0, 20) + '...'
    });

    try {
      const onvoInstance = window.onvo.pay({
        onError: (data: any) => {
          console.error('❌ Error en ONVO:', data);
          setError(`Error procesando el pago: ${data.message || 'Error desconocido'}`);
          setShowPaymentForm(false);
          setLoading(false);
        },
        onSuccess: (data: any) => {
          console.log('✅ Pago exitoso en ONVO:', data);
          
          // Limpiar carrito
          clearCart();
          
          // Redirigir a página de éxito
          router.push(`/checkout/success?payment_intent_id=${intentId}&order_id=${orderId}`);
        },
        publicKey: publishableKey,
        paymentIntentId: intentId,
        paymentType: 'one_time',
      });

      console.log('🔧 Renderizando SDK en contenedor...');
      
      // Verificar que el contenedor existe
      const container = document.getElementById('onvo-payment-container');
      if (!container) {
        console.error('❌ Contenedor #onvo-payment-container no encontrado');
        setError('Error en la página de pago. Recarga la página.');
        return;
      }
      
      onvoInstance.render('#onvo-payment-container');
      console.log('✅ SDK renderizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error inicializando SDK:', error);
      setError(`Error cargando formulario de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Inicializar SDK cuando esté cargado y tengamos payment intent
  useEffect(() => {
    if (sdkLoaded && paymentIntentId && showPaymentForm) {
      initializeOnvoSDK(paymentIntentId);
    }
  }, [sdkLoaded, paymentIntentId, showPaymentForm]);

  return (
    <>
      {/* SDK de ONVO */}
      <Script 
        src="https://sdk.onvopay.com/sdk.js" 
        onLoad={handleSDKLoad}
        onError={() => console.error('❌ Error cargando SDK de ONVO')}
      />
      
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-raven-bold text-center mb-12 text-black">Checkout</h1>
            
            {!showPaymentForm ? (
              // Formulario de información del cliente
              <div className="grid md:grid-cols-2 gap-12">
                {/* Formulario de datos */}
                <div className="bg-white rounded-lg p-8 shadow-lg">
                  <h2 className="text-xl font-raven-medium mb-6 text-black">Datos de Facturación</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                        Dirección
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                          Código Postal
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-urbanist font-medium mb-2 text-black">
                        País
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-[#EC1D25]"
                      >
                        <option value="CR">Costa Rica</option>
                        <option value="US">Estados Unidos</option>
                        <option value="MX">México</option>
                      </select>
                    </div>

                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#EC1D25] text-white py-3 rounded-lg font-urbanist font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Procesando...' : 'Continuar al Pago'}
                    </button>
                  </form>
                </div>

                {/* Resumen del pedido */}
                <div className="bg-white rounded-lg p-8 shadow-lg">
                  <h2 className="text-xl font-raven-medium mb-6 text-black">Resumen del Pedido</h2>
                  
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} 
                           className="flex justify-between items-center py-3 border-b border-gray-200">
                        <div className="flex-1">
                          <h3 className="font-urbanist font-medium text-black">{item.name}</h3>
                          <p className="text-sm text-gray-600">
                            {item.selectedSize && `Talla: ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && ', '}
                            {item.selectedColor && `Color: ${item.selectedColor}`}
                          </p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <span className="font-urbanist font-semibold text-black">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-gray-300 pt-4">
                      <div className="flex justify-between items-center text-xl font-raven-bold text-black">
                        <span>Total:</span>
                        <span>${cart.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Formulario de pago de ONVO
              <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-lg">
                <h2 className="text-2xl font-raven-bold mb-6 text-center text-black">Completa tu Pago</h2>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-urbanist">Total a pagar:</span>
                    <span className="text-2xl font-raven-bold text-[#EC1D25]">
                      ${cart.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Contenedor para el SDK de ONVO */}
                <div id="onvo-payment-container" className="border border-gray-200 rounded-lg p-4 min-h-[400px]">
                  {!sdkLoaded && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC1D25] mx-auto"></div>
                      <p className="mt-2 text-gray-600">Cargando formulario de pago...</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentIntentId(null);
                    setError('');
                    setLoading(false);
                  }}
                  className="mt-4 text-[#EC1D25] hover:text-red-700 font-urbanist"
                >
                  ← Volver a editar información
                </button>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
} 