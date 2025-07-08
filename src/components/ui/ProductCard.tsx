// src/components/ui/ProductCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useContext } from 'react';
import { CartContext } from '@/lib/CartContext';
import { IoCart, IoCheckmark } from 'react-icons/io5';

// Interfaz para el producto
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  images: Array<{ 
    src: string; 
    alt?: string;
    name?: string;
  }>;
  categories?: Array<{ 
    id: number; 
    name: string; 
    slug: string;
  }>;
  stock_status?: string;
  stock_quantity?: number | null;
  short_description?: string;
  on_sale?: boolean;
}

// Props del componente
export interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, justAdded } = useContext(CartContext);

  // Función para formatear precio
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice || 0);
  };

  // Manejar agregar al carrito
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir navegación del Link
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.src || '/placeholder.jpg',
      slug: product.slug
    });
  };

  // Verificar si está agotado
  const isOutOfStock = product.stock_status === 'outofstock' || 
                       (product.stock_quantity !== null && product.stock_quantity === 0);

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {/* Imagen del producto */}
        <div className="relative aspect-square bg-gray-100">
          {product.images && product.images[0] ? (
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <IoCart size={48} />
            </div>
          )}
          
          {/* Badge de oferta */}
          {product.on_sale && product.sale_price && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded">
              OFERTA
            </div>
          )}
          
          {/* Badge de agotado */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-black px-4 py-2 rounded font-semibold">
                AGOTADO
              </span>
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="p-4">
          {/* Categoría */}
          {product.categories && product.categories[0] && (
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {product.categories[0].name}
            </p>
          )}

          {/* Nombre del producto */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#EC1D25] transition-colors">
            {product.name}
          </h3>

          {/* Precios */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {product.sale_price ? (
                <>
                  <span className="text-lg font-bold text-[#EC1D25]">
                    {formatPrice(product.sale_price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.regular_price || product.price)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Botón de agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2 px-4 rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : justAdded === product.id
                ? 'bg-green-600 text-white'
                : 'bg-[#EC1D25] text-white hover:bg-red-700 transform hover:scale-105'
            }`}
          >
            {justAdded === product.id ? (
              <>
                <IoCheckmark size={20} />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <IoCart size={20} />
                <span>{isOutOfStock ? 'Agotado' : 'Agregar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}