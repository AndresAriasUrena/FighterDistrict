'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { WooCommerceProduct, transformWooCommerceProduct, Product } from '@/types/product';
import { IoStar } from 'react-icons/io5';
import { BsCart3 } from 'react-icons/bs';
import Link from 'next/link';
import ProductCard, { ProductGrid } from '@/components/ui/ProductCard';

interface ProductDetailProps {
  slug: string;
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<WooCommerceProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }

        const wooProduct: WooCommerceProduct = await response.json();
        setProduct(wooProduct);

        // Fetch related products
        const relatedResponse = await fetch('/api/products?per_page=4');
        if (relatedResponse.ok) {
          const relatedWooProducts: WooCommerceProduct[] = await relatedResponse.json();
          const transformedRelated = relatedWooProducts
            .filter(p => p.id !== wooProduct.id)
            .slice(0, 3)
            .map(transformWooCommerceProduct);
          setRelatedProducts(transformedRelated);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Actualizar URL cuando cambien las selecciones
  useEffect(() => {
    if (!product) return;
    
    const params = new URLSearchParams();
    
    if (selectedSize) {
      params.set('size', selectedSize);
    }
    if (selectedColor) {
      params.set('color', selectedColor);
    }
    if (quantity > 1) {
      params.set('quantity', quantity.toString());
    }
    
    const newURL = params.toString() 
      ? `/products/${slug}?${params.toString()}`
      : `/products/${slug}`;
    
    router.replace(newURL, { scroll: false });
  }, [selectedSize, selectedColor, quantity, slug, router, product]);

  // Cargar parámetros de la URL al inicializar
  useEffect(() => {
    if (!product) return;
    
    // Obtener tallas y colores de los atributos del producto
    const sizeAttribute = product?.attributes?.find(attr =>
      attr.name.toLowerCase().includes('size') ||
      attr.name.toLowerCase().includes('talla') ||
      attr.name.toLowerCase().includes('tamaño')
    );
    const availableSizes = sizeAttribute?.options || [];

    const colorAttribute = product?.attributes?.find(attr =>
      attr.name.toLowerCase().includes('color') ||
      attr.name.toLowerCase().includes('colour')
    );
    const availableColors = colorAttribute?.options || [];
    
    const sizeFromURL = searchParams.get('size');
    const colorFromURL = searchParams.get('color');
    const quantityFromURL = searchParams.get('quantity');
    
    if (sizeFromURL && availableSizes.includes(sizeFromURL)) {
      setSelectedSize(sizeFromURL);
    }
    if (colorFromURL && availableColors.includes(colorFromURL)) {
      setSelectedColor(colorFromURL);
    }
    if (quantityFromURL) {
      const qty = parseInt(quantityFromURL);
      if (!isNaN(qty) && qty > 0) {
        setQuantity(qty);
      }
    }
  }, [product, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E9E9E9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#EC1D25] mx-auto mb-4"></div>
          <p className="font-urbanist text-lg">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#E9E9E9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-raven-bold text-2xl mb-4">Producto no encontrado</h1>
          <p className="font-urbanist text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Obtener tallas de los atributos del producto
  const sizeAttribute = product?.attributes?.find(attr =>
    attr.name.toLowerCase().includes('size') ||
    attr.name.toLowerCase().includes('talla') ||
    attr.name.toLowerCase().includes('tamaño')
  );
  const sizes = sizeAttribute?.options || [];

  // Obtener colores de los atributos del producto
  const colorAttribute = product?.attributes?.find(attr =>
    attr.name.toLowerCase().includes('color') ||
    attr.name.toLowerCase().includes('colour')
  );
  const colors = colorAttribute?.options || [];

  return (
    <div className="min-h-screen bg-[#E9E9E9] px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-7xl mx-auto">
        {/* Product Detail Section */}
        <div className="rounded-lg overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">

            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden">
                <Image
                  src={product.images[selectedImageIndex]?.src || product.images[0]?.src || '/placeholder-product.jpg'}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto bg-white p-1">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${selectedImageIndex === index ? 'border-[#EC1D25]' : 'border-gray-200'
                        }`}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt || `${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              {/* Category */}
              <p className="text-sm font-urbanist font-medium border-2 border-[#BFBFBF] p-1.5 w-56 flex justify-center text-center items-center rounded-sm text-black uppercase tracking-wider">
                {product.categories[0]?.name || 'Producto'}
              </p>

              {/* Product Name */}
              <h1 className="font-raven-regular text-3xl lg:text-4xl text-black">
                {product.name}
              </h1>

              {/* Rating and Reviews */}
              {(product.average_rating && parseFloat(product.average_rating) > 0) && (
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IoStar
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(parseFloat(product.average_rating))
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="font-urbanist text-sm text-gray-600">
                    ({product.rating_count} {product.rating_count === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-4">
                <p className="font-urbanist font-semibold text-xl text-black">
                  ${parseFloat(product.price).toFixed(2)}
                </p>
                {product.on_sale && product.regular_price && (
                  <>
                    <p className="font-urbanist text-lg text-gray-500 line-through">
                      ${parseFloat(product.regular_price).toFixed(2)}
                    </p>
                    <p className="bg-[#EC1D25] text-white px-2 py-1 rounded-md text-sm font-urbanist font-bold">
                      -{Math.round(((parseFloat(product.regular_price) - parseFloat(product.price)) / parseFloat(product.regular_price)) * 100)}%
                    </p>
                  </>
                )}
              </div>

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-urbanist font-extralight text-[#000000]/70 text-lg">Selecciona una talla</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-10 py-2 rounded-md font-urbanist font-semibold transition-colors ${selectedSize === size
                            ? 'bg-black text-white'
                            : 'bg-[#CFCFCF] text-black hover:bg-gray-400'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {colors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-urbanist font-extralight text-[#000000]/70 text-lg">Selecciona la variante</h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-6 py-2 rounded-md font-urbanist font-semibold transition-colors ${selectedColor === color
                            ? 'bg-black text-white'
                            : 'bg-[#CFCFCF] text-black hover:bg-gray-400'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-3">
                <h3 className="font-urbanist font-extralight text-[#000000]/70 text-lg">Cantidad</h3>
                <div className="flex items-center gap-4">
                  <div className="w-full flex items-center bg-[#CFCFCF] border-2 border-[#CFCFCF] rounded-md overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 font-urbanist font-bold text-lg bg-black hover:bg-[#EC1D25] transition-colors duration-300 text-white"
                    >
                      −
                    </button>
                    <div className="w-full text-center py-3 font-urbanist text-black font-semibold text-lg border-x border-[#CFCFCF]">
                      {quantity}
                    </div>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-3 font-urbanist font-bold text-lg bg-black hover:bg-[#EC1D25] transition-colors duration-300 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button className="w-full bg-black text-white py-4 rounded-md font-raven-medium text-lg hover:bg-[#EC1D25] duration-300 transition-colors flex items-center justify-center gap-2">
                <BsCart3 className="w-5 h-5" />
                Añadir al carrito
              </button>

              {/* Description */}
              {product.description && (
                <div className="space-y-2 border-2 border-[#CFCFCF] p-4 rounded-md">
                    <h3 className="font-urbanist font-extralight text-[#000000]/70 text-lg">Descripción</h3>
                  <div
                    className="font-urbanist text-[#000000]/40 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}


            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="p-6 lg:p-8">
              <div className="flex justify-between items-center mb-8 w-full">
                <h2 className="text-2xl md:text-3xl font-raven-bold text-black uppercase tracking-wide">
                  PRODUCTOS RELACIONADOS
                </h2>

                <Link
                  href="/store"
                  className="group flex items-center gap-2 text-black hover:text-gray-700 transition-colors"
                >
                  <span className="font-urbanist font-semibold text-sm md:text-base text-[#373737]">
                    Ver todos
                  </span>
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>

              <ProductGrid cols={3} gap="small">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    id={relatedProduct.id}
                    name={relatedProduct.name}
                    category={relatedProduct.category}
                    price={relatedProduct.price}
                    image={relatedProduct.image}
                    href={`/products/${relatedProduct.slug}`}
                  />
                ))}
              </ProductGrid>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 