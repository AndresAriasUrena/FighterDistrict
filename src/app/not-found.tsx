'use client';

import Link from 'next/link';
import { IoArrowBack, IoHome, IoSearch } from 'react-icons/io5';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Número 404 */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-transparent bg-gradient-to-r from-[#EC1D25] to-[#B8171D] bg-clip-text">
                        404
                    </h1>
                </div>

                {/* Mensaje principal */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4 font-urbanist">
                        ¡Página no encontrada!
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Lo sentimos, la página que buscas no existe o ha sido movida. 
                        Pero no te preocupes, podemos ayudarte a encontrar lo que necesitas.
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 bg-gradient-to-r from-[#EC1D25] to-[#B8171D] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto justify-center"
                    >
                        <IoHome className="w-5 h-5" />
                        Ir al inicio
                    </Link>

                    <Link
                        href="/store"
                        className="flex items-center gap-2 bg-[#F5AB06] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-[#e09d05] hover:shadow-lg hover:scale-105 w-full sm:w-auto justify-center"
                    >
                        <IoSearch className="w-5 h-5" />
                        Ver tienda
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 w-full sm:w-auto justify-center"
                    >
                        <IoArrowBack className="w-5 h-5" />
                        Volver atrás
                    </button>
                </div>

                {/* Información adicional */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        ¿Necesitas ayuda? Contáctanos en{' '}
                        <a 
                            href="mailto:info@fighterdistrict.com" 
                            className="text-[#EC1D25] hover:underline font-semibold"
                        >
                            info@fighterdistrict.com
                        </a>
                    </p>
                </div>

                {/* Decoración */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-[#EC1D25]/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#F5AB06]/10 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#B8171D]/5 rounded-full blur-lg"></div>
            </div>
        </div>
    );
} 