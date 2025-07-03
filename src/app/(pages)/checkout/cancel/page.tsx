'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<{orderId: string | null, stored: any}>({
    orderId: null,
    stored: null
  });

  useEffect(() => {
    const orderIdFromUrl = searchParams.get('order_id');
    const storedOrder = localStorage.getItem('current_order');
    let stored = null;
    
    if (storedOrder) {
      try {
        stored = JSON.parse(storedOrder);
      } catch (e) {
        console.error('Error parsing stored order:', e);
      }
    }

    setOrderInfo({
      orderId: orderIdFromUrl,
      stored: stored
    });
  }, [searchParams]);

  const handleRestoreCart = () => {
    // Si tenemos información del carrito guardada, la restauramos
    const savedCart = localStorage.getItem('fighterDistrict_cart_backup');
    if (savedCart) {
      localStorage.setItem('fighterDistrict_cart', savedCart);
      localStorage.removeItem('fighterDistrict_cart_backup');
    }
    
    // Limpiar información temporal de la orden
    localStorage.removeItem('current_order');
    
    // Redirigir al carrito
    router.push('/');
  };

  const handleReturnToStore = () => {
    // Limpiar información temporal
    localStorage.removeItem('current_order');
    
    // Redirigir a la tienda
    router.push('/store');
  };

  return (
    <div className="bg-[#E9E9E9]">
      <Navbar />
      
      <div className="min-h-screen container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header de cancelación */}
            <div className="bg-yellow-500 text-white px-8 py-6 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl font-raven-bold mb-2">Pago Cancelado</h1>
              <p className="text-xl">Has cancelado el proceso de pago</p>
            </div>

            {/* Contenido de la cancelación */}
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-gray-600 text-lg mb-4">
                  No te preocupes, tu información no se ha perdido.
                </p>
                {orderInfo.orderId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800">
                      <strong>Orden #{orderInfo.orderId}</strong> ha sido creada pero no procesada.
                    </p>
                    <p className="text-blue-700 text-sm mt-2">
                      Puedes intentar pagar de nuevo si lo deseas.
                    </p>
                  </div>
                )}
              </div>

              {/* Opciones disponibles */}
              <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-raven-bold text-center mb-6">¿Qué te gustaría hacer?</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-6 text-center hover:border-[#EC1D25] transition-colors">
                    <div className="mb-4">
                      <svg className="w-12 h-12 text-[#EC1D25] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m6.5 6h7" />
                      </svg>
                    </div>
                    <h3 className="font-raven-bold text-lg mb-2">Revisar mi Carrito</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Vuelve a tu carrito para revisar los productos o modificar cantidades
                    </p>
                    <button
                      onClick={handleRestoreCart}
                      className="w-full bg-[#EC1D25] text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Ir al Carrito
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 text-center hover:border-[#EC1D25] transition-colors">
                    <div className="mb-4">
                      <svg className="w-12 h-12 text-[#EC1D25] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="font-raven-bold text-lg mb-2">Seguir Comprando</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Explora más productos en nuestra tienda
                    </p>
                    <button
                      onClick={handleReturnToStore}
                      className="w-full border border-[#EC1D25] text-[#EC1D25] py-2 px-4 rounded-lg hover:bg-[#EC1D25] hover:text-white transition-colors"
                    >
                      Ir a la Tienda
                    </button>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-raven-bold text-lg mb-3">¿Necesitas ayuda?</h3>
                <div className="space-y-2 text-gray-700">
                  <p>• Si tuviste problemas con el pago, puedes intentar de nuevo</p>
                  <p>• Acepta múltiples métodos de pago seguros</p>
                  <p>• Si necesitas asistencia, contáctanos</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Nota:</strong> Si creaste una orden, esta permanecerá en estado "pendiente" por 24 horas 
                    antes de ser cancelada automáticamente.
                  </p>
                </div>
              </div>

              {/* Botón principal de acción */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 