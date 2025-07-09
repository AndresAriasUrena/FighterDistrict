'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { WooCommerceProduct, transformWooCommerceProduct, Product } from '@/types/product';
import { IoStar } from 'react-icons/io5';
import { BsCart3 } from 'react-icons/bs';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import SimpleProductGrid from '../ui/SimpleProductGrid';
import { useCart } from '@/lib/CartContext';

interface ProductDetailProps {
  slug: string;
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart, openCart } = useCart();
  const [product, setProduct] = useState<WooCommerceProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableCombinations, setAvailableCombinations] = useState<{
    [key: string]: string[];
  }>({
    color: [],
    talla: []
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }

        const wooProduct: WooCommerceProduct = await response.json();

        // Si es un producto variable, procesar las combinaciones disponibles
        if (wooProduct.type === 'variable' && wooProduct.available_variations) {
          const combinations = {
            color: [] as string[],
            talla: [] as string[]
          };

          wooProduct.available_variations.forEach(variation => {
            variation.attributes.forEach(attr => {
              const name = attr.name.toLowerCase();
              const option = attr.option;
              if (name === 'color' && !combinations.color.includes(option)) {
                combinations.color.push(option);
              }
              if (name === 'talla' && !combinations.talla.includes(option)) {
                combinations.talla.push(option);
              }
            });
          });

          setAvailableCombinations(combinations);
        }
        
        setProduct(wooProduct);

        /// 🔥 NUEVA LÓGICA DE PRODUCTOS RELACIONADOS
      console.log(`🔗 Fetching related products for: ${wooProduct.name} (ID: ${wooProduct.id})`);
      
      try {
        // Usar la nueva API de productos relacionados
        const relatedResponse = await fetch(`/api/products/${wooProduct.id}/related`);
        
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          
          console.log(`✅ Related products loaded:`, relatedData.map((p: any) => p.name));
          setRelatedProducts(relatedData);
        } else {
          console.warn('❌ Related products API failed, using fallback');
          
          // Fallback: obtener productos de la misma categoría
          const categoryIds = wooProduct.categories?.map(cat => cat.id) || [];
          
          if (categoryIds.length > 0) {
            const fallbackResponse = await fetch(
              `/api/products?per_page=4&exclude=${wooProduct.id}&category=${categoryIds[0]}`
            );
            
            if (fallbackResponse.ok) {
              const fallbackProducts: WooCommerceProduct[] = await fallbackResponse.json();
              const transformedFallback = fallbackProducts
                .slice(0, 3)
                .map(transformWooCommerceProduct);
              setRelatedProducts(transformedFallback);
              console.log(`🔄 Fallback related products:`, transformedFallback.map(p => p.name));
            }
          } else {
            // Último fallback: productos recientes
            const lastResortResponse = await fetch('/api/products?per_page=4&orderby=date');
            if (lastResortResponse.ok) {
              const lastResortProducts: WooCommerceProduct[] = await lastResortResponse.json();
              const transformedLastResort = lastResortProducts
                .filter(p => p.id !== wooProduct.id)
                .slice(0, 3)
                .map(transformWooCommerceProduct);
              setRelatedProducts(transformedLastResort);
              console.log(`🆘 Last resort related products:`, transformedLastResort.map(p => p.name));
              }
            }
          }
        } catch (relatedError) {
          console.error('❌ Error loading related products:', relatedError);
          setRelatedProducts([]); // En caso de error, mostrar sección vacía
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

  // Función para formatear precios en colones
  const formatPrice = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(numAmount || 0);
  };

  // Función para verificar si una combinación está disponible
  const isCombinationAvailable = (color: string, talla: string): boolean => {
    // Si no hay variaciones o no hay ambos atributos, no necesitamos verificar
    if (!product?.available_variations || !sizes.length || !colors.length) return true;

    // Si hay ambos atributos, verificar la combinación
    return product.available_variations.some(variation => {
      const varColor = variation.attributes.find(attr => attr.name.toLowerCase() === 'color')?.option;
      const varTalla = variation.attributes.find(attr => attr.name.toLowerCase() === 'talla')?.option;
      return varColor === color && varTalla === talla;
    });
  };

  // Manejadores para la selección
  const handleSizeSelect = (size: string) => setSelectedSize(size);
  const handleColorSelect = (color: string) => setSelectedColor(color);

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

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price || '0') || 0,
      image: product.images[0]?.src || '/placeholder-product.jpg',
      slug: product.slug,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
    };

    addToCart(cartItem, quantity);
    // Pequeña pausa para mostrar el toast antes de abrir el carrito
    setTimeout(() => {
      openCart();
    }, 500);
  };

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
                {formatPrice(product.price || '0')}
                </p>
                {product.on_sale && product.regular_price && (
                  <>
                    <p className="font-urbanist text-lg text-gray-500 line-through">
                    {formatPrice(product.price || '0')}
                    </p>
                    <p className="bg-[#EC1D25] text-white px-2 py-1 rounded-md text-sm font-urbanist font-bold">
                      -{Math.round((((parseFloat(product.regular_price || '0') || 0) - (parseFloat(product.price || '0') || 0)) / (parseFloat(product.regular_price || '0') || 1)) * 100)}%
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
                        onClick={() => handleSizeSelect(size)}
                        className={`px-10 py-2 rounded-md font-urbanist font-semibold transition-colors 
                          ${selectedSize === size
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
                        onClick={() => handleColorSelect(color)}
                        className={`px-6 py-2 rounded-md font-urbanist font-semibold transition-colors 
                          ${selectedColor === color
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
              <button 
                onClick={handleAddToCart}
                disabled={
                  // Si no hay atributos, siempre habilitado
                  (sizes.length === 0 && colors.length === 0) ? false :
                  // Si solo hay talla, verificar que esté seleccionada
                  (sizes.length > 0 && colors.length === 0) ? !selectedSize :
                  // Si solo hay color, verificar que esté seleccionado
                  (sizes.length === 0 && colors.length > 0) ? !selectedColor :
                  // Si hay ambos, verificar que estén seleccionados y la combinación sea válida
                  !selectedSize || !selectedColor || !isCombinationAvailable(selectedColor, selectedSize)
                }
                className={`w-full py-4 rounded-md font-raven-medium text-lg duration-300 transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 hover:shadow-lg
                  ${
                    // Si no hay atributos, habilitado
                    (sizes.length === 0 && colors.length === 0) ||
                    // Si solo hay talla y está seleccionada
                    (sizes.length > 0 && colors.length === 0 && selectedSize) ||
                    // Si solo hay color y está seleccionado
                    (sizes.length === 0 && colors.length > 0 && selectedColor) ||
                    // Si hay ambos y la combinación es válida
                    (selectedSize && selectedColor && isCombinationAvailable(selectedColor, selectedSize))
                      ? 'bg-black text-white hover:bg-[#EC1D25]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <BsCart3 className="w-5 h-5 transition-transform duration-200" />
                {sizes.length > 0 && colors.length > 0 && selectedSize && selectedColor && !isCombinationAvailable(selectedColor, selectedSize)
                  ? 'Combinación no disponible'
                  : 'Añadir al carrito'}
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

        {/* Sección de productos relacionados - MEJORADA */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Productos Relacionados
              </h2>
              <Link 
                href="/store" 
                className="text-[#EC1D25] hover:underline font-medium"
              >
                Ver todos →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
            
            {/* Debug info - remover en producción */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
                <strong>Debug:</strong> Mostrando {relatedProducts.length} productos relacionados
                {product?.categories && (
                  <span> | Categorías del producto actual: {product.categories.map(c => c.name).join(', ')}</span>
                )}
                {product?.brands && (
                  <span> | Marcas: {product.brands.map((b: any) => b.name).join(', ')}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 