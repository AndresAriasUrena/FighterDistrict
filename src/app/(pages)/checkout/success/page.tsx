'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/CartContext';

interface OrderInfo {
  orderId: number;
  paymentId: string;
  total: number;
}

interface OrderDetails {
  id: number;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    total: string;
  }>;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationDone, setVerificationDone] = useState(false);

  const verifyPayment = useCallback(async () => {
    // Si ya verificamos, no hacer nada
    if (verificationDone) return;

    try {
      // Obtener order_id y payment_intent_id de la URL
      const orderIdFromUrl = searchParams.get('order_id');
      const paymentIntentIdFromUrl = searchParams.get('payment_intent_id');
      
      // Intentar obtener la información desde localStorage como backup
      const storedOrder = localStorage.getItem('current_order');
      let orderInfo: OrderInfo | null = null;
      
      if (storedOrder) {
        try {
          orderInfo = JSON.parse(storedOrder);
        } catch (e) {
          console.error('Error parsing stored order:', e);
        }
      }

      // Usar order_id de URL o localStorage
      const orderId = orderIdFromUrl || orderInfo?.orderId;

      if (!orderId) {
        setError('No se encontró información de la orden');
        setLoading(false);
        setVerificationDone(true);
        return;
      }



      // Verificar el estado de la orden a través de nuestra API
      const response = await fetch(`/api/verify-order?orderId=${orderId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al verificar la orden');
      }

      const order = result.order;
      
      setOrderDetails(order);

      // Limpiar información de localStorage y carrito si todo está bien
      if (order.status === 'processing' || order.status === 'completed') {
        localStorage.removeItem('current_order');
        localStorage.removeItem('pending_order_info');
        localStorage.removeItem('fighterDistrict_cart');
        clearCart(); // Limpiar el carrito usando el contexto
      }

      setVerificationDone(true);
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError('Error al verificar el estado del pago');
    } finally {
      setLoading(false);
    }
  }, [searchParams, clearCart, verificationDone]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mover la verificación aquí, antes de cualquier return
  const isPaymentSuccessful = orderDetails?.status === 'processing' || orderDetails?.status === 'completed';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E9E9E9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#EC1D25] border-t-transparent mx-auto mb-6"></div>
          <p className="font-urbanist text-lg text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white shadow-lg rounded-lg p-8 border-2 border-red-200">
              <h1 className="font-raven-bold text-3xl text-[#EC1D25] mb-4">Error en el Pago</h1>
              <p className="font-urbanist text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/store')}
                className="bg-black text-white px-8 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Verificar si tenemos los detalles de la orden antes de renderizar
  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white shadow-lg rounded-lg p-8 border-2 border-yellow-200">
              <h1 className="font-raven-bold text-3xl text-yellow-600 mb-4">Orden No Encontrada</h1>
              <p className="font-urbanist text-gray-600 mb-6">No se encontraron detalles de la orden.</p>
              <button
                onClick={() => router.push('/store')}
                className="bg-black text-white px-8 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {isPaymentSuccessful ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl">
              {/* Header de éxito */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform transition-transform duration-500 hover:scale-110">
                    <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h1 className="font-raven-bold text-4xl mb-2">¡Pago Exitoso!</h1>
                <p className="font-urbanist text-xl opacity-90">Tu orden ha sido procesada correctamente</p>
              </div>

              {/* Detalles de la orden */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Información de la orden */}
                  <div className="space-y-6">
                    <h2 className="font-medium font-urbanist text-2xl text-black mb-4">Detalles de la Orden</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-urbanist text-gray-600">Número de Orden:</span>
                        <span className="font-urbanist font-semibold text-black">#{orderDetails.id}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-urbanist text-gray-600">Estado:</span>
                        <span className="font-urbanist font-semibold px-3 py-1 bg-green-50 text-green-600 rounded-full">
                          {orderDetails.status === 'processing' ? 'Procesando' : 'Completado'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-urbanist text-gray-600">Fecha:</span>
                        <span className="font-urbanist font-semibold text-black">{formatDate(orderDetails.date_created)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-urbanist text-gray-600">Total:</span>
                        <span className="font-urbanist font-bold text-lg text-black">{formatCurrency(orderDetails.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Información del cliente */}
                  <div className="space-y-6">
                    <h2 className="font-medium font-urbanist text-2xl text-black mb-4">Información del Cliente</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-urbanist text-gray-600">Nombre:</span>
                        <span className="font-urbanist font-semibold text-black">
                          {orderDetails.billing.first_name} {orderDetails.billing.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-urbanist text-gray-600">Email:</span>
                        <span className="font-urbanist font-semibold text-black">{orderDetails.billing.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="mt-8">
                  <h2 className="font-medium font-urbanist text-2xl text-black mb-6">Productos</h2>
                  <div className="space-y-4">
                    {orderDetails.line_items.map((item, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex-1">
                          <h3 className="font-urbanist font-semibold text-black">{item.name}</h3>
                          <p className="font-urbanist text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="font-urbanist font-bold text-black">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/store')}
                    className="bg-black text-white px-8 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105"
                  >
                    Seguir Comprando
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-white text-black px-8 py-3 rounded-md font-urbanist font-semibold border-2 border-black hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105"
                  >
                    Imprimir Recibo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="font-medium font-urbanist text-3xl text-[#EC1D25] mb-4">Estado de Orden Inválido</p>
              <p className="font-urbanist text-gray-600 mb-6">
                Lo sentimos, no pudimos procesar tu orden. Por favor, contacta a soporte.
              </p>
              <button
                onClick={() => router.push('/store')}
                className="bg-black text-white px-8 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105"
              >
                Volver a la Tienda
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#E9E9E9] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#EC1D25] border-t-transparent mx-auto mb-6"></div>
        <p className="font-urbanist text-lg text-gray-600">Cargando página de éxito...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
} 