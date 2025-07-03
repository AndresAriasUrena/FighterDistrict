'use client';

import { useEffect, useState, useCallback } from 'react';
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

export default function CheckoutSuccessPage() {
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

      console.log('Verificando orden:', orderId);
      console.log('Payment Intent ID:', paymentIntentIdFromUrl);

      // Verificar el estado de la orden a través de nuestra API
      const response = await fetch(`/api/verify-order?orderId=${orderId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al verificar la orden');
      }

      const order = result.order;
      console.log('Estado de la orden:', order.status);
      
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

  if (loading) {
    return (
      <div className="bg-[#E9E9E9] flex items-center justify-center">
        <div className="min-h-screen text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#EC1D25] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#E9E9E9]">
        <Navbar />
        <div className="min-h-screen container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-100 border border-red-300 rounded-lg p-8">
              <h1 className="text-3xl font-raven-bold text-red-800 mb-4">Error</h1>
              <p className="text-red-700 mb-6">{error}</p>
              <button
                onClick={() => router.push('/store')}
                className="bg-[#EC1D25] text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors"
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

  const isPaymentSuccessful = orderDetails?.status === 'processing' || orderDetails?.status === 'completed';

  return (
    <div className="min-h-screen bg-[#E9E9E9] text-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {isPaymentSuccessful ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header de éxito */}
              <div className="bg-green-500 text-white px-8 py-6 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-4xl font-raven-bold mb-2">¡Pago Exitoso!</h1>
                <p className="text-xl">Tu orden ha sido procesada correctamente</p>
              </div>

              {/* Detalles de la orden */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Información de la orden */}
                  <div>
                    <h2 className="text-2xl font-raven-bold mb-4">Detalles de la Orden</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Número de Orden:</span>
                        <span className="font-medium">#{orderDetails.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className="font-medium text-green-600 capitalize">
                          {orderDetails.status === 'processing' ? 'Procesando' : 'Completado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">{formatDate(orderDetails.date_created)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-raven-bold text-xl text-[#EC1D25]">
                          {formatCurrency(orderDetails.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información del cliente */}
                  <div>
                    <h2 className="text-2xl font-raven-bold mb-4">Información de Facturación</h2>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {orderDetails.billing.first_name} {orderDetails.billing.last_name}
                      </p>
                      <p className="text-gray-600">{orderDetails.billing.email}</p>
                    </div>
                  </div>
                </div>

                {/* Productos ordenados */}
                <div className="mt-8">
                  <h2 className="text-2xl font-raven-bold mb-4">Productos Ordenados</h2>
                  <div className="space-y-4">
                    {orderDetails.line_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Próximos pasos */}
                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-raven-bold text-lg mb-3">¿Qué sigue ahora?</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✅ Recibirás un email de confirmación en breve</li>
                    <li>📦 Procesaremos tu orden en las próximas 24 horas</li>
                    <li>🚚 Te enviaremos información de seguimiento cuando se envíe</li>
                    <li>💬 Si tienes preguntas, contáctanos</li>
                  </ul>
                </div>

                {/* Botones de acción */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/store')}
                    className="bg-[#EC1D25] text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Seguir Comprando
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-raven-bold mb-4">Pago Pendiente</h1>
              <p className="text-gray-600 mb-6">
                Tu orden está siendo procesada. El estado actual es: <strong>{orderDetails?.status}</strong>
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#EC1D25] text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors mr-4"
              >
                Verificar de Nuevo
              </button>
              <button
                onClick={() => router.push('/store')}
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
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