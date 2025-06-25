'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function BoxProductsCTA() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(console.error);
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.25, 
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="relative h-screen bg-black flex items-center justify-start overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-70 z-1"
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/assets/homepage/BoxProductsCTA.webm" type="video/webm" />
        <div className="absolute inset-0 bg-black"></div>
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10 z-2" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mr-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-5xl 2xl:text-7xl font-raven-bold text-white leading-tight mb-6">
            NUEVOS<br />
            INGRESOS<br />
            DE BOXEO
          </h2>
          
          <p className="text-md md:text-sm 2xl:text-lg text-[#E9E9E9]/70 font-urbanist max-w-md 2xl:max-w-xl mb-8 leading-tight tracking-wider">
            Descubre nuestra línea más reciente de los mejores productos 
            para boxeo en toda Costa Rica. Desde sacos de box hasta 
            guantes de marcas de renombre mundial, ofrecemos la línea 
            más completa para los combatientes que quieren aplastar a 
            su competencia.
          </p>
          
          <div className="flex flex-row gap-4">
            <Link 
              href="/productos"
              className="bg-transparent border border-white hover:border-[#B8171D] rounded-sm hover:bg-[#B8171D] text-white hover:text-white px-8 py-3 font-urbanist font-semibold transition-all duration-300 text-center"
            >
              Ver productos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 