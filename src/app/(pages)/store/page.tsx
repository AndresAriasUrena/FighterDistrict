// src/app/(pages)/store/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/Store/FilterSidebar';
import ProductGrid from '@/components/Store/ProductGrid';

interface FilterData {
  categories: string[];
  brands: string[];
  sizes: string[];
  sports: string[];
  priceRange: [number, number];
}

function StoreContent() {
  const [filters, setFilters] = useState<FilterData | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debug para verificar que los filtros se están pasando correctamente
  useEffect(() => {
    if (filters) {
      console.log('📊 Store page received filters:', filters);
    }
  }, [filters]);

  const handleFilterChange = (newFilters: FilterData) => {
    console.log('🔄 Filter change received in store page:', newFilters);
    setFilters(newFilters);
  };

  return (
    <div className="flex max-w-7xl mx-auto relative">
      {/* Sidebar de filtros */}
      <FilterSidebar 
        onFilterChange={handleFilterChange}
        isMobileOpen={isMobileFiltersOpen}
        setIsMobileOpen={setIsMobileFiltersOpen}
      />

      {/* Área principal de productos */}
      <ProductGrid 
        filters={filters} 
        onOpenFilters={() => setIsMobileFiltersOpen(true)}
      />
    </div>
  );
}

export default function StorePage() {
  return (
    <>
      <div className="min-h-screen bg-[#E9E9E9]">
        <Navbar />
        <Suspense fallback={
          <div className="flex max-w-7xl mx-auto relative">
            <div className="hidden lg:block w-64 p-6 border-r border-gray-200">
              <div className="text-center text-gray-500">Cargando filtros...</div>
            </div>
            <div className="flex-1 p-4 lg:p-6">
              <div className="text-center text-gray-500 py-12">Cargando productos...</div>
            </div>
          </div>
        }>
          <StoreContent />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}