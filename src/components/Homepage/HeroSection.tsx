'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function HeroSection() {
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
    <section className="relative h-[90vh] bg-black flex items-center justify-start overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-70 z-1"
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/assets/homepage/hero.webm" type="video/webm" />
        <div className="absolute inset-0 bg-black"></div>
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10 z-2" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mr-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-5xl 2xl:text-7xl font-raven-bold text-white leading-tight mb-6">
            EL MEJOR EQUIPO<br />
            DE COMBATE EN<br />
            COSTA RICA
          </h1>
          
          <p className="text-md md:text-sm 2xl:text-lg text-[#E9E9E9]/70 font-urbanist max-w-md 2xl:max-w-xl mb-8 leading-tight tracking-wider">
            Cada producto que ofrecemos está pensado para acompañarte en tu 
            evolución como atleta. En Fighter District creemos en el poder de la 
            disciplina, la constancia y la preparación, desde el primer golpe hasta 
            la última campaña.
          </p>
          
          <div className="flex flex-row gap-4">
            <Link 
              href="/productos"
              className="bg-[#F5AB06] rounded-sm hover:bg-[#B8171D] text-black hover:text-white px-8 py-3 font-urbanist font-semibold transition-all duration-300 text-center"
            >
              Ver productos
            </Link>
            <Link 
              href="/sobre-nosotros"
              className="bg-white/20 rounded-sm text-white hover:bg-white hover:text-black px-8 py-3 font-urbanist font-semibold transition-all duration-300 text-center"
            >
              Conocer más
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 