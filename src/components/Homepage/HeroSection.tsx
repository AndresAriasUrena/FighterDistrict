import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative h-[88.5vh] bg-black flex items-center justify-start overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-70 z-1"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/assets/homepage/hero.webm" type="video/webm" />
        <div className="absolute inset-0 bg-black"></div>
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10 z-2" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
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