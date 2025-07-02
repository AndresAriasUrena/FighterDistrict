'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('order_id');
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header de error */}
                      <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-4xl font-raven-bold text-red-600 mb-4">Pago No Completado</h1>
              <p className="text-xl text-gray-600 mb-2">Tu pago no pudo ser procesado</p>
            </div>

          {/* Información del error */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-raven-medium mb-6 text-black">¿Qué pasó?</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-raven-medium text-red-800 mb-2">Información del Error</h3>
                <p className="text-red-700">
                  {reason || error || 'El pago fue cancelado o no pudo completarse.'}
                </p>
                {orderId && (
                  <p className="text-sm text-red-600 mt-2">
                    Orden ID: {orderId}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-raven-medium mb-3 text-black">Posibles razones:</h3>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Fondos insuficientes en tu cuenta o tarjeta
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    La transacción fue rechazada por tu banco
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Información de pago incorrecta
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Cancelaste el pago durante el proceso
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="text-center">
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <button
                onClick={() => router.push('/checkout')}
                className="inline-block bg-[#EC1D25] text-white px-8 py-3 rounded-lg font-urbanist font-semibold hover:bg-red-700 transition-colors"
              >
                Intentar de Nuevo
              </button>
              <Link 
                href="/store"
                className="inline-block bg-white text-[#EC1D25] border-2 border-[#EC1D25] px-8 py-3 rounded-lg font-urbanist font-semibold hover:bg-[#EC1D25] hover:text-white transition-colors"
              >
                Volver a la Tienda
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function FailedPage() {
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
      <FailedContent />
    </Suspense>
  );
} 