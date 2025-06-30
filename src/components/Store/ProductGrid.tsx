'use client';

import { useState, useEffect } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import ProductCard from '@/components/ui/ProductCard';
import { WooCommerceProduct } from '@/types/product';

interface ProductGridProps {
    filters?: any;
}

interface SortOption {
    value: string;
    label: string;
}

const sortOptions: SortOption[] = [
    { value: 'default', label: 'Orden por defecto' },
    { value: 'name_asc', label: 'Nombre A-Z' },
    { value: 'name_desc', label: 'Nombre Z-A' },
    { value: 'price_asc', label: 'Precio menor a mayor' },
    { value: 'price_desc', label: 'Precio mayor a menor' },
    { value: 'date_desc', label: 'Más recientes' },
    { value: 'date_asc', label: 'Más antiguos' },
];

const PRODUCTS_PER_PAGE = 12;

const ProductGrid = ({ filters }: ProductGridProps) => {
    const [products, setProducts] = useState<WooCommerceProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<WooCommerceProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('default');
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

    // Fetch productos
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/products?per_page=100');
                const data: WooCommerceProduct[] = await response.json();
                setProducts(data);
                setFilteredProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = () => {
            setSortDropdownOpen(false);
        };

        if (sortDropdownOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [sortDropdownOpen]);

    // Aplicar filtros
    useEffect(() => {
        if (!filters) {
            setFilteredProducts(products);
            return;
        }

        let filtered = products.filter(product => {
            // Filtrar por categorías
            if (filters.categories?.length > 0) {
                const hasCategory = product.categories?.some(cat =>
                    filters.categories.includes(cat.name)
                );
                if (!hasCategory) return false;
            }

            // Filtrar por marcas (tags)
            if (filters.brands?.length > 0) {
                const hasBrand = product.tags?.some(tag =>
                    filters.brands.includes(tag.name)
                );
                if (!hasBrand) return false;
            }

            // Filtrar por tallas
            if (filters.sizes?.length > 0) {
                const hasSize = product.attributes?.some(attr =>
                    attr.name === 'Talla' && attr.options?.some(option =>
                        filters.sizes.includes(option)
                    )
                );
                if (!hasSize) return false;
            }

            // Filtrar por deportes (tags)
            if (filters.sports?.length > 0) {
                const hasSport = product.tags?.some(tag =>
                    filters.sports.includes(tag.name)
                );
                if (!hasSport) return false;
            }

            // Filtrar por precio
            if (filters.priceRange) {
                const price = parseFloat(product.price) || parseFloat(product.regular_price) || 0;
                if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
                    return false;
                }
            }

            return true;
        });

        setFilteredProducts(filtered);
        setCurrentPage(1); // Reset página al filtrar
    }, [filters, products]);

    // Aplicar ordenamiento
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'price_asc':
                const priceA = parseFloat(a.price) || parseFloat(a.regular_price) || 0;
                const priceB = parseFloat(b.price) || parseFloat(b.regular_price) || 0;
                return priceA - priceB;
            case 'price_desc':
                const priceA2 = parseFloat(a.price) || parseFloat(a.regular_price) || 0;
                const priceB2 = parseFloat(b.price) || parseFloat(b.regular_price) || 0;
                return priceB2 - priceA2;
            case 'date_desc':
                return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
            case 'date_asc':
                return new Date(a.date_created).getTime() - new Date(b.date_created).getTime();
            default:
                return 0;
        }
    });

    // Calcular paginación
    const totalProducts = sortedProducts.length;
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const currentProducts = sortedProducts.slice(startIndex, endIndex);

    // Generar números de página
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const PaginationComponent = ({ position }: { position: 'top' | 'bottom' }) => (
        <div className={`flex items-center ${position === 'top' ? 'justify-end' : 'justify-center'} gap-2`}>
            <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md text-[#000000] disabled:text-[#8E8E8E] cursor-pointer disabled:cursor-not-allowed"
            >
                <IoChevronBack className="w-4 h-4" />
            </button>

            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    className={`px-2 py-2 rounded-md text-md font-semibold text-[#8E8E8E] ${page === currentPage
                        ? 'text-[#000000]'
                        : typeof page === 'number'
                            ? 'cursor-pointer disabled:cursor-not-allowed text-gray-700'
                            : 'text-gray-400 cursor-default'
                        }`}
                    disabled={typeof page !== 'number'}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md text-[#000000] disabled:text-[#8E8E8E] cursor-pointer disabled:cursor-not-allowed"
            >
                <IoChevronForward className="w-4 h-4" />
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex-1 p-4 lg:p-6">
                <div className="text-center text-gray-500 py-12">
                    Cargando productos...
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 lg:p-6">
            {/* Header con contador, ordenamiento y paginación */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-row gap-2 items-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSortDropdownOpen(!sortDropdownOpen);
                        }}
                        className="flex items-center gap-5 px-4 py-2 rounded-md bg-[#EC1D25] text-black"
                    >
                        <span className="text-sm font-medium">
                            {sortOptions.find(option => option.value === sortBy)?.label}
                        </span>
                        <IoChevronDown className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Dropdown de ordenamiento */}
                    <div className="relative">
                        {sortDropdownOpen && (
                            <div className="absolute -right-17 top-5 mt-1 w-56 bg-black text-white border border-gray-200 rounded-md shadow-lg z-10">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSortBy(option.value);
                                            setSortDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm text-white ${sortBy === option.value ? 'bg-[#EC1D25] font-medium' : ''
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm hidden lg:block">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, totalProducts)} de {totalProducts} productos
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Paginación superior */}
                    {totalPages > 1 && <PaginationComponent position="top" />}
                </div>
            </div>

            {/* Grid de productos */}
            {currentProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-2">No se encontraron productos</p>
                    <p className="text-gray-400">Intenta ajustar los filtros</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8 border-t border-[#2F2F2F] pt-6">
                    {currentProducts.map((product) => {
                        const price = parseFloat(product.price) || parseFloat(product.regular_price) || 0;
                        const category = product.categories?.[0]?.name || 'Producto';

                        return (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                category={category}
                                price={price}
                                image={product.images?.[0]?.src || '/placeholder-product.jpg'}
                                href={`/products/${product.slug}`}
                                size="medium"
                            />
                        );
                    })}
                </div>
            )}

            {/* Paginación inferior */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <PaginationComponent position="bottom" />
                </div>
            )}
        </div>
    );
};

export default ProductGrid; 