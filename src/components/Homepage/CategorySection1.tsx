import Link from 'next/link';
import Image from 'next/image';

interface CategoryCardProps {
  title: string;
  subtitle: string;
  image: string;
}

function CategoryCard({ title, subtitle, image }: CategoryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg aspect-[4/4] block">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
            
      {/* Title */}
      <div className="absolute bottom-3 left-0 right-0 p-2 text-center">
        <h3 className="md:text-5xl text-3xl font-raven-regular text-white uppercase tracking-wide mx-auto max-w-xs mb-3">
          {title}
        </h3>
        <p className="text-sm md:text-base lg:text-lg text-white/70 font-urbanist mx-auto leading-tight font-medium  max-w-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function CategorySection1() {
  const categories = [
    {
      title: "STREETWEAR &\nROPA CASUAL",
      image: "/assets/homepage/Streetwear.avif",
      subtitle: "Estilo fuera del ring, con comodidad,\nactitud y diseño para el día a día.",
    },
    {
      title: "EQUIPO\nPROFESIONAL", 
      image: "/assets/homepage/EquipoProfesional.avif",
      subtitle: "Diseñado para el alto rendimiento,\nresistencia y funcionalidad en cada\nentrenamiento o competencia.",
    },
  ];

  return (
    <section>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-start mb-12">
          <h2 className="text-2xl md:text-3xl font-raven-bold text-black uppercase tracking-wide mb-6">
            Tu disciplina no termina en el dojo
          </h2>
          
          <p className="text-sm md:text-base lg:text-lg text-black/70 font-urbanist max-w-4xl leading-tight font-medium">
            La lucha va más allá del ring. Se refleja en cada decisión, en cada prenda que eliges usar. Por eso, reunimos lo 
            mejor del equipamiento profesional para quienes entrenan con propósito, y ropa streetwear pensada para llevar 
            tu mentalidad de combate a la calle.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              title={category.title}
              image={category.image}
              subtitle={category.subtitle}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 