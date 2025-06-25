import Link from 'next/link';
import Image from 'next/image';

interface CategoryCardProps {
  title: string;
  image: string;
}

function CategoryCard({ title, image }: CategoryCardProps) {
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
      <div className="absolute bottom-3 left-0 right-0 p-2">
        <h3 className="text-5xl md:text-[4.4vw] font-raven-regular text-white uppercase tracking-wide text-center">
          {title}
        </h3>
      </div>
    </div>
  );
}

export default function CategorySection2() {
  const categories = [
    {
      title: "HOODIES",
      image: "/assets/homepage/Hoodies.avif",
    },
    {
      title: "JOGGERS", 
      image: "/assets/homepage/Joggers.avif",
    },
    {
      title: "CREWNECK",
      image: "/assets/homepage/Crewneck.avif", 
    }
  ];

  return (
    <section>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-left mb-12">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              title={category.title}
              image={category.image}
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