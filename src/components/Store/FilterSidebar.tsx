'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IoChevronUp, IoChevronDown, IoClose, IoFilter } from 'react-icons/io5';
import { WooCommerceProduct } from '@/types/product';

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterData) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

interface FilterItem {
  label: string;
  count: number;
}

interface FilterData {
  categories: string[];
  brands: string[];
  sizes: string[];
  sports: string[];
  priceRange: [number, number];
}

const FilterSidebar = ({ onFilterChange, isMobileOpen = false, setIsMobileOpen = () => {} }: FilterSidebarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: false,
    sizes: false,
    sports: false,
    price: false
  });

  const [selectedFilters, setSelectedFilters] = useState<FilterData>({
    categories: [],
    brands: [],
    sizes: [],
    sports: [],
    priceRange: [0, 200]
  });

  const [availableFilters, setAvailableFilters] = useState({
    categories: [] as FilterItem[],
    brands: [] as FilterItem[],
    sizes: [] as FilterItem[],
    sports: [] as FilterItem[],
    priceRange: [0, 200] as [number, number]
  });

  const [loading, setLoading] = useState(true);

  // Función para actualizar la URL con los filtros actuales
  const updateURL = (filters: FilterData) => {
    const params = new URLSearchParams();

    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }
    if (filters.brands.length > 0) {
      params.set('brands', filters.brands.join(','));
    }
    if (filters.sizes.length > 0) {
      params.set('sizes', filters.sizes.join(','));
    }
    if (filters.sports.length > 0) {
      params.set('sports', filters.sports.join(','));
    }
    if (filters.priceRange[0] > 0) {
      params.set('minPrice', filters.priceRange[0].toString());
    }

    const newURL = params.toString() ? `?${params.toString()}` : '/store';
    router.replace(newURL, { scroll: false });
  };

  // Función para cargar filtros desde la URL
  const loadFiltersFromURL = () => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const sports = searchParams.get('sports')?.split(',').filter(Boolean) || [];
    const minPrice = parseInt(searchParams.get('minPrice') || '0');

    return {
      categories,
      brands,
      sizes,
      sports,
      priceRange: [minPrice, 200] as [number, number] // Temporal, se actualizará con datos reales
    };
  };

  // Función para formatear precios en colones
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount);
  };

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching products for filters...');
        
        // Obtener todos los productos
        const response = await fetch('/api/products?per_page=100');
        const products: WooCommerceProduct[] = await response.json();
  
        console.log('📦 Sample product structure:', products[0]);
  
        // Maps para contar ocurrencias
        const categoryMap = new Map<string, number>();
        const brandMap = new Map<string, number>();
        const sizeMap = new Map<string, number>();
        const sportMap = new Map<string, number>();
  
        products.forEach(product => {
          // 1. EXTRAER CATEGORÍAS
          product.categories?.forEach(cat => {
            categoryMap.set(cat.name, (categoryMap.get(cat.name) || 0) + 1);
          });
  
          // 2. EXTRAER MARCAS (campo brands directo)
          product.brands?.forEach(brand => {
            brandMap.set(brand.name, (brandMap.get(brand.name) || 0) + 1);
          });
  
          // 3. EXTRAER TALLAS (atributos)
          product.attributes?.forEach(attr => {
            if (attr.name.toLowerCase() === 'talla' || attr.name.toLowerCase() === 'size') {
              attr.options?.forEach(size => {
                sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
              });
            }
          });
  
          // 4. EXTRAER DEPORTES (tags relevantes)
          product.tags?.forEach(tag => {
            const tagName = tag.name;
            const tagLower = tagName.toLowerCase();
  
            // Keywords para identificar deportes
            const sportKeywords = [
              'bjj', 'jiu jitsu', 'jiu-jitsu', 'judo', 'grappling', 
              'boxing', 'boxeo', 'mma', 'wrestling', 'lucha',
              'muay thai', 'kickboxing', 'entrenamiento', 'competencia',
              'crossfit', 'fitness', 'gym'
            ];
            
            const isSport = sportKeywords.some(sport => 
              tagLower.includes(sport) || sport.includes(tagLower)
            );
  
            if (isSport) {
              sportMap.set(tagName, (sportMap.get(tagName) || 0) + 1);
            }
          });
        });
  
        // Calcular rango de precios real
        const prices = products.map(p => {
          // Intentar obtener precio de diferentes campos
          let price = 0;
          
          if (p.price && p.price !== '') {
            price = parseFloat(p.price);
          } else if (p.regular_price && p.regular_price !== '') {
            price = parseFloat(p.regular_price);
          }
          
          return price;
        }).filter(p => p > 0);
  
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000; // 100k colones max
  
        // Debug de filtros encontrados
        console.log('🏷️ Filters extracted:', {
          categories: Array.from(categoryMap.entries()),
          brands: Array.from(brandMap.entries()),
          sizes: Array.from(sizeMap.entries()),
          sports: Array.from(sportMap.entries()),
          priceRange: [minPrice, maxPrice]
        });
  
        // Actualizar filtros disponibles
        setAvailableFilters({
          categories: Array.from(categoryMap.entries())
            .map(([name, count]) => ({ label: name, count }))
            .sort((a, b) => b.count - a.count), // Ordenar por popularidad
          
          brands: Array.from(brandMap.entries())
            .map(([name, count]) => ({ label: name, count }))
            .sort((a, b) => a.label.localeCompare(b.label)), // Ordenar alfabéticamente
          
          sizes: Array.from(sizeMap.entries())
            .map(([name, count]) => ({ label: name, count }))
            .sort((a, b) => {
              // Ordenamiento especial para tallas
              const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
              const aIndex = sizeOrder.indexOf(a.label);
              const bIndex = sizeOrder.indexOf(b.label);
              
              if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
              } else if (aIndex !== -1) {
                return -1;
              } else if (bIndex !== -1) {
                return 1;
              } else {
                return a.label.localeCompare(b.label);
              }
            }),
          
          sports: Array.from(sportMap.entries())
            .map(([name, count]) => ({ label: name, count }))
            .sort((a, b) => b.count - a.count), // Ordenar por popularidad
          
          priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)]
        });
  
        // Cargar filtros desde la URL
        const urlFilters = loadFiltersFromURL();
        setSelectedFilters({
          ...urlFilters,
          priceRange: [
            urlFilters.priceRange[0] || Math.floor(minPrice), 
            Math.ceil(maxPrice)
          ]
        });
  
        setLoading(false);
  
      } catch (error) {
        console.error('❌ Error fetching products for filters:', error);
        setLoading(false);
      }
    };
  
    fetchFilters();
  }, []);

  // useEffect para actualizar la URL cuando cambien los filtros
  useEffect(() => {
    if (!loading) {
      console.log('🔄 Notifying filter changes:', selectedFilters);
      onFilterChange?.(selectedFilters);
    }
  }, [selectedFilters, loading]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCheckboxChange = (category: keyof FilterData, value: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      const currentArray = newFilters[category] as string[];

      if (currentArray.includes(value)) {
        (newFilters[category] as string[]) = currentArray.filter(v => v !== value);
      } else {
        (newFilters[category] as string[]) = [...currentArray, value];
      }

      return newFilters;
    });
  };

  // Notificar cambios de filtros con useEffect
  useEffect(() => {
    if (!loading) {
      onFilterChange?.(selectedFilters);
    }
  }, [selectedFilters, onFilterChange, loading]);

  const handlePriceChange = (newRange: [number, number]) => {
    setSelectedFilters(prev => ({
      ...prev,
      priceRange: newRange
    }));
  };

  if (loading) {
    return (
      <div className="hidden lg:block w-64 p-6 border-r border-gray-200">
        <h2 className="font-raven-regular text-4xl text-black mb-6">Tienda</h2>
        <div className="text-center text-gray-500">
          Cargando filtros...
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="space-y-6">
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
      `}</style>
      <h2 className="font-raven-regular text-4xl text-black mb-6">Tienda</h2>

      <div className="space-y-6">
        {/* Productos (Categorías) */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="font-urbanist text-lg text-black">Productos</h3>
            <div className={`transform transition-transform duration-300 ${expandedSections.categories ? 'rotate-180' : 'rotate-0'}`}>
              <IoChevronDown className="w-4 h-4 text-[#EC1D25]" />
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.categories ? 'opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-2 pt-1">
              {availableFilters.categories.length === 0 && loading ? (
                <div className="text-sm text-gray-500">Cargando...</div>
              ) : availableFilters.categories.length === 0 ? (
                <div className="text-sm text-gray-500">No hay opciones disponibles</div>
              ) : (
                availableFilters.categories.map((item, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedFilters.categories.includes(item.label)}
                        onChange={() => handleCheckboxChange('categories', item.label)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${selectedFilters.categories.includes(item.label)
                          ? 'bg-[#EC1D25] border-[#EC1D25]'
                          : 'border-[#8B8B8B] hover:border-[#EC1D25]'
                        }`}>
                        {selectedFilters.categories.includes(item.label) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-full">{item.count}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Marca */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('brands')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="font-urbanist text-lg text-black">Marca</h3>
            <div className={`transform transition-transform duration-300 ${expandedSections.brands ? 'rotate-180' : 'rotate-0'}`}>
              <IoChevronDown className="w-4 h-4 text-[#EC1D25]" />
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.brands ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-2 pt-1">
              {availableFilters.brands.length === 0 && loading ? (
                <div className="text-sm text-gray-500">Cargando...</div>
              ) : availableFilters.brands.length === 0 ? (
                <div className="text-sm text-gray-500">No hay opciones disponibles</div>
              ) : (
                availableFilters.brands.map((item, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedFilters.brands.includes(item.label)}
                        onChange={() => handleCheckboxChange('brands', item.label)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${selectedFilters.brands.includes(item.label)
                          ? 'bg-[#EC1D25] border-[#EC1D25]'
                          : 'border-[#8B8B8B] hover:border-[#EC1D25]'
                        }`}>
                        {selectedFilters.brands.includes(item.label) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-full">{item.count}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Talla */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('sizes')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="font-urbanist text-lg text-black">Talla</h3>
            <div className={`transform transition-transform duration-300 ${expandedSections.sizes ? 'rotate-180' : 'rotate-0'}`}>
              <IoChevronDown className="w-4 h-4 text-[#EC1D25]" />
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.sizes ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-2 pt-1">
              {availableFilters.sizes.length === 0 && loading ? (
                <div className="text-sm text-gray-500">Cargando...</div>
              ) : availableFilters.sizes.length === 0 ? (
                <div className="text-sm text-gray-500">No hay opciones disponibles</div>
              ) : (
                availableFilters.sizes.map((item, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedFilters.sizes.includes(item.label)}
                        onChange={() => handleCheckboxChange('sizes', item.label)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${selectedFilters.sizes.includes(item.label)
                          ? 'bg-[#EC1D25] border-[#EC1D25]'
                          : 'border-[#8B8B8B] hover:border-[#EC1D25]'
                        }`}>
                        {selectedFilters.sizes.includes(item.label) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-full">{item.count}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Deporte */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('sports')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="font-urbanist text-lg text-black">Deporte</h3>
            <div className={`transform transition-transform duration-300 ${expandedSections.sports ? 'rotate-180' : 'rotate-0'}`}>
              <IoChevronDown className="w-4 h-4 text-[#EC1D25]" />
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.sports ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-2 pt-1">
              {availableFilters.sports.length === 0 && loading ? (
                <div className="text-sm text-gray-500">Cargando...</div>
              ) : availableFilters.sports.length === 0 ? (
                <div className="text-sm text-gray-500">No hay opciones disponibles</div>
              ) : (
                availableFilters.sports.map((item, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedFilters.sports.includes(item.label)}
                        onChange={() => handleCheckboxChange('sports', item.label)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${selectedFilters.sports.includes(item.label)
                          ? 'bg-[#EC1D25] border-[#EC1D25]'
                          : 'border-[#8B8B8B] hover:border-[#EC1D25]'
                        }`}>
                        {selectedFilters.sports.includes(item.label) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-full">{item.count}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Precio */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="font-urbanist text-lg text-black">Precio</h3>
            <div className={`transform transition-transform duration-300 ${expandedSections.price ? 'rotate-180' : 'rotate-0'}`}>
              <IoChevronDown className="w-4 h-4 text-[#EC1D25]" />
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.price ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Precio mínimo: {formatPrice(selectedFilters.priceRange[0])}</label>
                <input
                  type="range"
                  min={availableFilters.priceRange[0]}
                  max={availableFilters.priceRange[1]}
                  value={selectedFilters.priceRange[0]}
                  onChange={(e) => handlePriceChange([parseInt(e.target.value), selectedFilters.priceRange[1]])}
                  className="w-full h-2 bg-[#8B8B8B] rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Min: {formatPrice(availableFilters.priceRange[0])}</span>
                <span>Max: {formatPrice(availableFilters.priceRange[1])}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay móvil */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 backdrop-blur-lg z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar móvil */}
      <div className={`lg:hidden bg-[#E9E9E9] fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 overflow-y-auto ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Header móvil */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-raven-bold text-xl text-black">Filtros</h2>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          {sidebarContent}
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:block w-64 p-6 border-r border-gray-200">
        {sidebarContent}
      </div>
    </>
  );
};

export default FilterSidebar; 