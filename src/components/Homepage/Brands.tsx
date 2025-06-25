import Link from 'next/link';
import Image from 'next/image';

interface BrandCardProps {
  imageDesktop: string;
  imageMobile: string;
  alt: string;
}

function BrandCard({ imageDesktop, imageMobile, alt }: BrandCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg h-[320px] md:h-[450px] block w-full">
      {/* Desktop Image */}
      <div className="absolute inset-0 hidden md:block">
        <Image
          src={imageDesktop}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="100vw"
        />
      </div>
      
      {/* Mobile Image */}
      <div className="absolute inset-0 block md:hidden">
        <Image
          src={imageMobile}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="100vw"
        />
      </div>
    </div>
  );
}

export default function Brands() {
  const brands = [
    {
      imageDesktop: "/assets/homepage/Brand1Desktop.avif",
      imageMobile: "/assets/homepage/Brand1Mobile.avif",
      alt: "Fuji Brand"
    },
    {
      imageDesktop: "/assets/homepage/Brand2Desktop.avif",
      imageMobile: "/assets/homepage/Brand2Mobile.avif", 
      alt: "Venum Brand"
    },
    {
      imageDesktop: "/assets/homepage/Brand3Desktop.avif",
      imageMobile: "/assets/homepage/Brand3Mobile.avif",
      alt: "Engage Brand"
    }
  ];

  return (
    <section>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-raven-bold text-black uppercase tracking-wide mb-6">
            Calidad, rendimiento y prestigio.
          </h2>
          
          <p className="text-sm md:text-base lg:text-lg text-black/70 font-urbanist max-w-4xl mx-auto leading-tight font-medium">
            En Fighter District seleccionamos marcas reconocidas a nivel mundial por su excelencia en el deporte de 
            combate. Cada producto que ofrecemos está respaldado por marcas que confían los atletas, entrenadores y 
            competidores más exigentes.
          </p>
        </div>

        {/* Brands Grid - Single Column */}
        <div className="space-y-4 mb-8">
          {brands.map((brand, index) => (
            <BrandCard
              key={index}
              imageDesktop={brand.imageDesktop}
              imageMobile={brand.imageMobile}
              alt={brand.alt}
            />
          ))}
        </div>

        {/* Ver todos button */}
        <div className="text-center">
          <Link 
            href="/products"
            className="inline-block bg-[#C0C0C0] hover:bg-black text-black/60 hover:text-white px-16 py-3 font-urbanist font-semibold transition-all duration-300 rounded-sm"
          >
            Ver todos
          </Link>
        </div>
      </div>
    </section>
  );
} 