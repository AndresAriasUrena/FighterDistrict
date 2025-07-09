// src/components/Store/ProductGrid.tsx
'use client';

import { useState, useEffect, useContext } from 'react';
import ProductCard from '../ui/ProductCard';
import { IoFilter, IoClose, IoReload } from 'react-icons/io5';
import { SearchContext } from '@/lib/SearchContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';

interface ProductGridProps {
  filters: any;
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

  // Configuración de paginación ajustable
  const PRODUCTS_PER_PAGE = 24; // Aumentado de 12 a 24
  const INITIAL_LOAD = 48; // Cargar más productos inicialmente

  // Función para obtener productos
  const fetchProducts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Usar más productos en la primera carga
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
          // Evitar duplicados
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      } else {
        setProducts(data);
      }

      // Obtener información de paginación de los headers
      const totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');
      const totalCount = parseInt(response.headers.get('X-Total') || data.length.toString());
      
      setTotalProducts(totalCount);
      setHasMore(pageNum < totalPages && data.length === perPage);

      console.log(`Total products available: ${totalCount}, Has more: ${pageNum < totalPages}`);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar todos los productos
  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        per_page: '100', // Máximo permitido por WooCommerce
        page: '1',
        orderby: sortBy.split('-')[0],
        order: sortBy.includes('asc') ? 'asc' : 'desc'
      });

      console.log('Loading all products...');

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar productos');
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }

      console.log(`Loaded all ${data.length} products`);

      setProducts(data);
      setTotalProducts(data.length);
      setHasMore(false);
      setPage(1);

    } catch (err) {
      console.error('Error loading all products:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos inicialmente
  useEffect(() => {
    fetchProducts(1, false);
  }, [sortBy]);

  // Función para reintentar
  const handleRetry = () => {
    setError(null);
    fetchProducts(page, false);
  };

  // Filtrar productos localmente
  const filteredProducts = products.filter(product => {
    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.categories?.some(cat => cat.name.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Filtros adicionales si existen
    if (filters) {
      // Por categorías
      if (filters.categories?.length > 0) {
        const hasCategory = product.categories?.some(cat => 
          filters.categories.includes(cat.slug) || filters.categories.includes(cat.name)
        );
        if (!hasCategory) return false;
      }

      // Por precio
      if (filters.priceRange) {
        const price = parseFloat(product.price);
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
      }
    }

    return true;
  });

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

          {/* Botón para cargar todos */}
          {hasMore && !loading && (
            <button
              onClick={loadAllProducts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Ver todos ({totalProducts})
            </button>
          )}

          {/* Selector de ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC1D25]"
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

              {/* Mensaje cuando se han cargado todos */}
              {!hasMore && products.length > INITIAL_LOAD && (
                <div className="text-center mt-8 py-4 text-gray-500">
                  ✓ Todos los productos han sido cargados ({filteredProducts.length} total)
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No se encontraron productos
                {searchTerm && ` para "${searchTerm}"`}
              </p>
              {searchTerm && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-[#EC1D25] hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
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