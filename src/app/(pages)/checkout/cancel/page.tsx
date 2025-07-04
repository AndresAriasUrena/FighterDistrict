'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IoCartOutline, IoStorefront, IoInformationCircle } from 'react-icons/io5';

function CheckoutCancelContent() {
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
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl">
            {/* Header de cancelación */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform transition-transform duration-500 hover:scale-110">
                  <IoInformationCircle className="w-10 h-10 text-yellow-500" />
                </div>
              </div>
              <h1 className="font-raven-bold text-4xl mb-2">Pago Cancelado</h1>
              <p className="font-urbanist text-xl opacity-90">Has cancelado el proceso de pago</p>
            </div>

            {/* Contenido de la cancelación */}
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="font-urbanist text-gray-600 text-lg mb-4">
                  No te preocupes, tu información no se ha perdido.
                </p>
                {orderInfo.orderId && (
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-6 mb-6 transform transition-all duration-300 hover:shadow-md">
                    <p className="font-urbanist font-semibold text-blue-900">
                      Orden #{orderInfo.orderId}
                    </p>
                    <p className="font-urbanist text-blue-700 mt-2">
                      Tu orden ha sido creada pero no procesada. Puedes intentar pagar de nuevo si lo deseas.
                    </p>
                  </div>
                )}
              </div>

              {/* Opciones disponibles */}
              <div className="space-y-8">
                <h2 className="font-raven-medium text-2xl text-black text-center mb-6">¿Qué te gustaría hacer?</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white flex flex-col justify-end rounded-lg p-6 text-center transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 hover:border-[#EC1D25]">
                    <div className="mb-4">
                      <IoCartOutline className="w-12 h-12 text-[#EC1D25] mx-auto transform transition-transform duration-300 hover:scale-110" />
                    </div>
                    <h3 className="font-medium font-urbanist text-black text-xl mb-3">Revisar mi Carrito</h3>
                    <p className="font-urbanist text-gray-600 mb-6">
                      Vuelve a tu carrito para revisar los productos
                    </p>
                    <button
                      onClick={handleRestoreCart}
                      className="w-full bg-black text-white px-6 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105"
                    >
                      Ir al Carrito
                    </button>
                  </div>

                  <div className="bg-white flex flex-col justify-end rounded-lg p-6 text-center transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 hover:border-[#EC1D25]">
                    <div className="mb-4">
                      <IoStorefront className="w-12 h-12 text-[#EC1D25] mx-auto transform transition-transform duration-300 hover:scale-110" />
                    </div>
                    <h3 className="font-medium font-urbanist text-black text-xl mb-3">Seguir Comprando</h3>
                    <p className="font-urbanist text-gray-600 mb-6">
                      Explora más productos en nuestra tienda
                    </p>
                    <button
                      onClick={handleReturnToStore}
                      className="w-full bg-white text-black px-6 py-3 rounded-md font-urbanist font-semibold border-2 border-black hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105"
                    >
                      Ir a la Tienda
                    </button>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-8 bg-gray-50 rounded-lg p-8 border border-gray-100">
                <h3 className="font-medium font-urbanist text-xl text-black mb-4">¿Necesitas ayuda?</h3>
                <div className="space-y-3 font-urbanist text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#EC1D25]"></div>
                    <p>Si tuviste problemas con el pago, puedes intentar de nuevo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#EC1D25]"></div>
                    <p>Aceptamos múltiples métodos de pago seguros</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#EC1D25]"></div>
                    <p>Nuestro equipo de soporte está disponible para ayudarte</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="font-urbanist text-sm text-gray-500">
                    <span className="font-semibold">Nota:</span> Las órdenes pendientes se mantienen por 24 horas antes de ser canceladas automáticamente.
                  </p>
                </div>
              </div>

              {/* Botón de inicio */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push('/')}
                  className="bg-black text-white px-8 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105"
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#E9E9E9] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#EC1D25] border-t-transparent mx-auto mb-6"></div>
        <p className="font-urbanist text-lg text-gray-600">Cargando página de cancelación...</p>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutCancelContent />
    </Suspense>
  );
} 