// src/components/Store/ProductGrid.tsx
'use client';

import { useState, useEffect, useContext } from 'react';
import ProductCard from '../ui/ProductCard';
import { IoFilter, IoClose, IoReload } from 'react-icons/io5';
import { SearchContext } from '@/lib/SearchContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';

interface FilterData {
  categories: string[];
  brands: string[];
  sizes: string[];
  sports: string[];
  priceRange: [number, number];
}

interface ProductGridProps {
  filters: FilterData | null;
  onOpenFilters: () => void;
}

export default function ProductGrid({ filters, onOpenFilters }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [totalProducts, setTotalProducts] = useState(0);
  const { searchTerm } = useContext(SearchContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Configuración de paginación
  const PRODUCTS_PER_PAGE = 24;
  const INITIAL_LOAD = 48;

  // Función para obtener productos
  const fetchProducts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const perPage = pageNum === 1 ? INITIAL_LOAD : PRODUCTS_PER_PAGE;

      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: pageNum.toString(),
        orderby: sortBy.split('-')[0],
        order: sortBy.includes('asc') ? 'asc' : 'desc'
      });

      console.log(`Fetching products: page ${pageNum}, per_page ${perPage}`);

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar productos');
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }

      console.log(`Received ${data.length} products`);

      // Actualizar productos
      if (append) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      } else {
        setProducts(data);
      }

      // Obtener información de paginación
      const totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');
      const totalCount = parseInt(response.headers.get('X-Total') || data.length.toString());
      
      setTotalProducts(totalCount);
      setHasMore(pageNum < totalPages && data.length === perPage);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos inicialmente
  useEffect(() => {
    fetchProducts(1, false);
  }, [sortBy]);

  // Función para filtrar productos - MEJORADA PARA TODOS LOS FILTROS
  const filteredProducts = products.filter(product => {
    // 1. FILTRO POR BÚSQUEDA
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.short_description?.toLowerCase().includes(searchLower) ||
        product.categories?.some(cat => cat.name.toLowerCase().includes(searchLower)) ||
        (product as any).tags?.some((tag: any) => tag.name.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // 2. FILTROS AVANZADOS
    if (filters) {
      console.log(`Filtering product: ${product.name}`, {
        filters,
        productBrands: (product as any).brands,
        productCategories: product.categories,
        productPrice: product.price
      });

      // FILTRO POR CATEGORÍAS
      if (filters.categories?.length > 0) {
        const hasCategory = product.categories?.some(cat => 
          filters.categories.includes(cat.slug) || 
          filters.categories.includes(cat.name)
        );
        if (!hasCategory) {
          console.log(`❌ Category filter failed for ${product.name}`);
          return false;
        }
      }

      // FILTRO POR MARCAS
      if (filters.brands?.length > 0) {
        const productBrands = (product as any).brands;
        
        if (!productBrands || productBrands.length === 0) {
          console.log(`❌ No brands found for product: ${product.name}`);
          return false;
        }

        const brandMatches = productBrands.some((brand: any) =>
          filters.brands.some(filterBrand => 
            brand.name.toLowerCase() === filterBrand.toLowerCase() ||
            brand.slug.toLowerCase() === filterBrand.toLowerCase()
          )
        );

        if (!brandMatches) {
          console.log(`❌ Brand filter failed for ${product.name}. Product brands:`, productBrands.map((b: any) => b.name));
          return false;
        } else {
          console.log(`✅ Brand match for ${product.name}`);
        }
      }

      // FILTRO POR TALLAS
      if (filters.sizes?.length > 0) {
        const productAttributes = (product as any).attributes || [];
        
        const hasSizes = productAttributes.some((attr: any) => {
          if (attr.name.toLowerCase() === 'talla' || attr.name.toLowerCase() === 'size') {
            return attr.options?.some((size: string) => 
              filters.sizes.includes(size)
            );
          }
          return false;
        });

        if (!hasSizes) {
          console.log(`❌ Size filter failed for ${product.name}`);
          return false;
        }
      }

      // FILTRO POR DEPORTES (usando tags)
      if (filters.sports?.length > 0) {
        const productTags = (product as any).tags || [];
        
        const hasSports = productTags.some((tag: any) => 
          filters.sports.includes(tag.name) || filters.sports.includes(tag.slug)
        );

        if (!hasSports) {
          console.log(`❌ Sport filter failed for ${product.name}`);
          return false;
        }
      }

      // FILTRO POR PRECIO
      if (filters.priceRange && filters.priceRange[0] > 0) {
        const productPrice = parseFloat(product.price) || parseFloat(product.regular_price || '0') || 0;
        
        if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) {
          console.log(`❌ Price filter failed for ${product.name}. Price: ${productPrice}, Range: ${filters.priceRange}`);
          return false;
        }
      }
    }

    return true;
  });

  // Debug de filtros aplicados
  useEffect(() => {
    if (filters) {
      console.log('🔍 FILTER DEBUG:', {
        totalProducts: products.length,
        filteredProducts: filteredProducts.length,
        activeFilters: {
          categories: filters.categories?.length || 0,
          brands: filters.brands?.length || 0,
          sizes: filters.sizes?.length || 0,
          sports: filters.sports?.length || 0,
          priceRange: filters.priceRange
        },
        searchTerm
      });
    }
  }, [filters, filteredProducts.length, products.length, searchTerm]);

  // Función para reintentar
  const handleRetry = () => {
    setError(null);
    fetchProducts(page, false);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    router.push('/store');
  };

  // Renderizar estado de error
  if (error) {
    return (
      <div className="flex-1 p-4 lg:p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar productos
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <IoReload className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Todos los Productos
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} de {totalProducts} productos encontrados
            {searchTerm && ` para "${searchTerm}"`}
          </p>
          
          {/* Mostrar filtros activos */}
          {filters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.brands?.map(brand => (
                <span key={brand} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Marca: {brand}
                </span>
              ))}
              {filters.categories?.map(category => (
                <span key={category} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Categoría: {category}
                </span>
              ))}
              {filters.sizes?.map(size => (
                <span key={size} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Talla: {size}
                </span>
              ))}
              {filters.sports?.map(sport => (
                <span key={sport} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Deporte: {sport}
                </span>
              ))}
              {(filters.brands?.length > 0 || filters.categories?.length > 0 || filters.sizes?.length > 0 || filters.sports?.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
                >
                  ✕ Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Botón de filtros móvil */}
          <button
            onClick={onOpenFilters}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <IoFilter className="w-4 h-4" />
            Filtros
          </button>

          {/* Selector de ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
          >
            <option value="date">Más recientes</option>
            <option value="price-asc">Precio: Menor a mayor</option>
            <option value="price-desc">Precio: Mayor a menor</option>
            <option value="title-asc">Nombre: A-Z</option>
            <option value="title-desc">Nombre: Z-A</option>
          </select>
        </div>
      </div>

      {/* Estado de carga inicial */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid de productos */}
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Botón de cargar más */}
              {hasMore && !loading && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      fetchProducts(nextPage, true);
                    }}
                    className="bg-black text-white px-6 py-3 rounded-md hover:bg-[#EC1D25] transition-colors duration-300"
                  >
                    Cargar más productos
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No se encontraron productos con los filtros seleccionados
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 text-[#EC1D25] hover:underline"
              >
                Limpiar filtros y ver todos los productos
              </button>
            </div>
          )}
        </>
      )}

      {/* Indicador de carga adicional */}
      {loading && products.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#EC1D25] border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Cargando más productos...</p>
        </div>
      )}
    </div>
  );
}