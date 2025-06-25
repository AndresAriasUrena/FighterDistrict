import Link from 'next/link';
import Image from 'next/image';

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  className?: string;
}

function CategoryCard({ title, description, image, className = "" }: CategoryCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-lg h-[280px] md:h-[400px] block w-full ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/15" />
      
      {/* Content */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-raven-light text-white uppercase tracking-wide mb-3">
          {title}
        </h3>
        <p className="text-sm md:text-base text-white/70 font-urbanist leading-tight max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Welcome() {
  const categories = [
    {
      title: "EQUIPAMIENTO DE BOXEO",
      description: "Nuestro equipo de boxeo ofrece protección, precisión y comodidad. Ya sea en el ring o en el gimnasio, entrena con la confianza de estar listo para cualquier combate.",
      image: "/assets/homepage/Grid1.avif"
    },
    {
      title: "GI BRAZILIAN JIU JITSU",
      description: "Hechos para soportar la presión del combate y fluir con tu técnica. Nuestros Gis combinan resistencia, ligereza, estética y la mejor libertad de movimiento.",
      image: "/assets/homepage/Grid2.avif"
    },
    {
      title: "EQUIPAMIENTO DE MMA",
      description: "Diseñado para resistir cada golpe, agarre y transición. Nuestra línea de MMA combina protección, movilidad y ligereza para que domines en cada round.",
      image: "/assets/homepage/Grid3.avif"
    },
    {
      title: "SHORTS DE COMBATE",
      description: "Ligeros, firmes y listos para todo, te acompañan en cada patada, derribo o intercambio explosivo. Pelea sin restricciones.",
      image: "/assets/homepage/Grid4.avif"
    },
    {
      title: "ROPA Y MOCHILAS",
      description: "Para quienes viven el combate más allá del gimnasio, nuestra ropa refleja disciplina, fuerza y mentalidad de lucha.",
      image: "/assets/homepage/Grid5.avif"
    },
    {
      title: "ACCESORIOS",
      description: "Desde protectores hasta cuerdas y finger tapes, cada accesorio cumple una función clave en tu entrenamiento. Ligereza, practicidad y resistencia para acompañarte en cada sesión.",
      image: "/assets/homepage/Grid6.avif"
    }
  ];

  return (
    <section>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-raven-bold text-black uppercase tracking-wide mb-6">
            Bienvenido Fighter District
          </h2>
          
          <p className="text-sm md:text-base lg:text-lg text-black/70 font-urbanist max-w-4xl mx-auto leading-tight font-medium">
            En Fighter District entendemos que la lucha no comienza en el ring, sino en cada entrenamiento, cada sacrificio y 
            cada decisión. Por eso, seleccionamos cuidadosamente cada producto para ofrecerte solo lo mejor en calidad, 
            resistencia y rendimiento.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Primera fila - 2 columnas */}
          <CategoryCard {...categories[0]} />
          <CategoryCard {...categories[1]} />
          
          {/* Segunda fila - 1 columna completa */}
          <div className="md:col-span-2">
            <CategoryCard {...categories[2]} className="h-[280px] md:h-[400px]" />
          </div>
          
          {/* Tercera fila - 2 columnas */}
          <CategoryCard {...categories[3]} />
          <CategoryCard {...categories[4]} />
          
          {/* Cuarta fila - 1 columna completa */}
          <div className="md:col-span-2">
            <CategoryCard {...categories[5]} className="h-[280px] md:h-[400px]" />
          </div>
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