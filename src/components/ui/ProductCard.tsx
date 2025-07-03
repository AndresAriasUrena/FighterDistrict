import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  id: string | number;
  name: string;
  category: string;
  price: number;
  image: string;
  href?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function ProductCard({ 
  id, 
  name, 
  category, 
  price, 
  image, 
  href,
  size = 'medium',
  className = ''
}: ProductCardProps) {
  const sizeClasses = {
    small: {
      container: 'w-full',
      image: 'h-48 sm:h-52',
      categoryPrice: 'text-xs sm:text-sm',
      title: 'text-sm sm:text-base',
      padding: 'p-3 sm:p-4'
    },
    medium: {
      container: 'w-full',
      image: 'h-56 sm:h-64 lg:h-72 xl:h-80',
      categoryPrice: 'text-sm lg:text-base',
      title: 'text-sm sm:text-base lg:text-lg',
      padding: 'p-4 lg:p-5 xl:p-6'
    },
    large: {
      container: 'w-full',
      image: 'h-64 sm:h-72 lg:h-80 xl:h-96',
      categoryPrice: 'text-base lg:text-lg',
      title: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
      padding: 'p-5 lg:p-6 xl:p-8'
    }
  };

  const currentSize = sizeClasses[size];
  const productHref = href || `/products/${id}`;

  // Función para formatear precios en colones
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount || 0);
  };

  return (
    <Link href={productHref} className={`block ${className}`}>
      <div className={`
        ${currentSize.container} 
        bg-white 
        rounded-md
        shadow-sm 
        hover:shadow-lg 
        transition-all 
        duration-300 
        hover:scale-[1.02] 
        overflow-hidden
        group
        h-full
        flex
        flex-col
      `}>
        {/* Header with Category and Price */}
        <div className={`
          ${currentSize.padding} 
          pb-0 
          flex 
          justify-between 
          items-start
        `}>
          <span className={`
            ${currentSize.categoryPrice} 
            text-black/40 
            font-urbanist 
            font-semibold
            group-hover:text-gray-800
            transition-colors
          `}>
            {category}
          </span>
          <span className={`
            ${currentSize.categoryPrice} 
            font-urbanist 
            font-bold 
            text-black/60
          `}>
            {formatPrice(price)}
          </span>
        </div>

        {/* Product Image */}
        <div className={`
          ${currentSize.image} 
          ${currentSize.padding} 
          pt-2 
          pb-2
        `}>
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-50 p-1">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300 rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>

        {/* Product Name */}
        <div className={`${currentSize.padding} pt-0 flex-1 flex items-end`}>
          <p className={`
            ${currentSize.title} 
            font-raven-regular
            text-black 
            group-hover:text-gray-800
            transition-colors
            leading-tight
            w-full
          `}>
            {name}
          </p>
        </div>
      </div>
    </Link>
  );
}

interface ProductGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ProductGrid({ 
  children, 
  cols = 3, 
  gap = 'medium',
  className = '' 
}: ProductGridProps) {
  const gapClasses = {
    small: 'gap-4 lg:gap-5',
    medium: 'gap-6 lg:gap-8 xl:gap-10',
    large: 'gap-8 lg:gap-10 xl:gap-12'
  };

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  };

  return (
    <div className={`
      grid 
      ${colClasses[cols]} 
      ${gapClasses[gap]} 
      w-full
      ${className}
    `}>
      {children}
    </div>
  );
} 