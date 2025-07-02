'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/woocommerce';

interface OrderDetails {
  id: number;
  number: string;
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
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const orderId = searchParams.get('order_id');
  const orderNumber = searchParams.get('order_number');
  const paymentIntentId = searchParams.get('payment_intent_id');
  const status = searchParams.get('status');

  useEffect(() => {
    async function verifyAndLoadOrder() {
      if (!orderId) {
        setError('No se encontró información de la orden');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Verificando pago exitoso:', {
          orderId,
          orderNumber,
          paymentIntentId,
          status
        });

        if (paymentIntentId) {
          console.log('🔄 Verificando Payment Intent con ONVO...');
          
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntentId,
              orderId: orderId
            }),
          });

          const verifyResult = await verifyResponse.json();
          
          console.log('📊 Resultado de verificación:', verifyResult);

          if (!verifyResult.success) {
            console.warn('⚠️ Verificación de pago falló:', verifyResult.error);
          }
        }

        console.log('📦 Cargando detalles de la orden...');
        
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        
        if (!orderResponse.ok) {
          throw new Error(`Error al cargar la orden: ${orderResponse.status}`);
        }

        const orderData = await orderResponse.json();
        setOrderDetails(orderData);

        console.log('✅ Orden cargada exitosamente:', {
          orderNumber: orderData.number,
          total: orderData.total,
          status: orderData.status
        });

      } catch (err) {
        console.error('❌ Error verificando orden:', err);
        setError(err instanceof Error ? err.message : 'Error al verificar la orden');
      } finally {
        setIsLoading(false);
      }
    }

    verifyAndLoadOrder();
  }, [orderId, orderNumber, paymentIntentId, status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            Verificando tu pago...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras confirmamos tu orden
          </p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error || 'No se pudo cargar la información de la orden'}
            </div>
            <button
              onClick={() => router.push('/store')}
              className="bg-[#EC1D25] text-white px-8 py-3 rounded-lg font-urbanist font-semibold hover:bg-red-700 transition-colors"
            >
              Volver a la Tienda
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'processing':
        return 'Procesando';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header de éxito */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-raven-bold text-green-600 mb-4">¡Pago Exitoso!</h1>
            <p className="text-xl text-gray-600 mb-2">Gracias por tu compra en Fighter District</p>
            <p className="text-gray-600">
              Recibirás un email de confirmación en <strong>{orderDetails.billing.email}</strong>
            </p>
          </div>

          {/* Detalles de la orden */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h2 className="text-2xl font-raven-medium text-black">Orden #{orderDetails.number}</h2>
                  <p className="text-gray-600">{formatDate(orderDetails.date_created)}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderDetails.status)}`}>
                    {getStatusText(orderDetails.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Información del cliente */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-raven-medium mb-4 text-black">Información de Facturación</h3>
                  <p className="text-gray-600">
                    {orderDetails.billing.first_name} {orderDetails.billing.last_name}<br />
                    {orderDetails.billing.email}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-raven-medium mb-4 text-black">Resumen de Pago</h3>
                  <div className="text-2xl font-raven-bold text-[#EC1D25]">
                    ₡{parseFloat(orderDetails.total).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Pagado con ONVO Pay</p>
                </div>
              </div>

              {/* Items de la orden */}
              <div>
                <h3 className="text-lg font-raven-medium mb-4 text-black">Productos Ordenados</h3>
                <div className="space-y-4">
                  {orderDetails.line_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-urbanist font-medium text-black">{item.name}</h4>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                                              <div className="text-right">
                          <p className="font-urbanist font-semibold text-black">
                            ₡{parseFloat(item.total).toLocaleString()}
                          </p>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de Pago */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Detalles del Pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Método de pago:</span>
                <span className="text-black font-medium">ONVO Pay</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="text-green-600 font-medium">Pagado</span>
              </div>
              {paymentIntentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de transacción:</span>
                  <span className="text-black font-mono text-xs">{paymentIntentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="text-black">{new Date().toLocaleDateString('es-CR')}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="text-center mt-12">
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link 
                href="/store"
                className="inline-block bg-[#EC1D25] text-white px-8 py-3 rounded-lg font-urbanist font-semibold hover:bg-red-700 transition-colors"
              >
                Seguir Comprando
              </Link>
              <Link 
                href="/"
                className="inline-block bg-white text-[#EC1D25] border-2 border-[#EC1D25] px-8 py-3 rounded-lg font-urbanist font-semibold hover:bg-[#EC1D25] hover:text-white transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-raven-medium text-blue-800 mb-2">¿Qué sigue?</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Recibirás un email de confirmación con los detalles de tu orden</li>
              <li>• Procesaremos tu pedido en las próximas 24 horas</li>
              <li>• Te notificaremos cuando tu pedido esté listo para envío</li>
              <li>• Si tienes preguntas, contacta nuestro equipo de soporte</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#EC1D25] mx-auto mb-4"></div>
            <h1 className="text-2xl font-raven-bold mb-2 text-black">Cargando...</h1>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 