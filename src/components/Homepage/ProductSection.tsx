// src/components/Homepage/ProductSection.tsx
import Link from 'next/link';
import ProductCard from '../ui/ProductCard';
import SimpleProductGrid from '../ui/SimpleProductGrid';
import { Product } from "@/types/product";

async function fetchProducts() {
  try {
    // Usar nuestra API route en lugar de llamar directamente a WooCommerce
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Fetch best sellers
    const bestSellersRes = await fetch(`${baseUrl}/api/products?orderby=popularity&per_page=3`, {
      cache: 'no-store'
    });
    
    if (!bestSellersRes.ok) {
      throw new Error('Failed to fetch best sellers');
    }
    
    const bestSellers: Product[] = await bestSellersRes.json();
    
    // Fetch new products
    const newProductsRes = await fetch(`${baseUrl}/api/products?orderby=date&order=desc&per_page=3`, {
      cache: 'no-store'
    });
    
    if (!newProductsRes.ok) {
      throw new Error('Failed to fetch new products');
    }
    
    const newProducts: Product[] = await newProductsRes.json();
    
    return { bestSellers, newProducts };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { bestSellers: [], newProducts: [] };
  }
}

export default async function ProductSection() {
  const { bestSellers, newProducts } = await fetchProducts();

  if (bestSellers.length === 0 && newProducts.length === 0) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-center text-gray-500">No hay productos disponibles en este momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8">
      {bestSellers.length > 0 && (
        <section className="pb-16 w-full">
          <div className="mx-auto w-full">
            <div className="flex justify-between items-center mb-8 w-full">
              <h2 className="text-2xl md:text-3xl font-raven-bold text-black uppercase tracking-wide">
                NUESTROS PRODUCTOS MÁS VENDIDOS
              </h2>
              <Link
                href="/products"
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

            <SimpleProductGrid cols={3} gap="small">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleProductGrid>
          </div>
        </section>
      )}

      {newProducts.length > 0 && (
        <section className="border-t border-gray-200 pt-16">
          <div className="mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-raven-bold text-black uppercase tracking-wide">
                NUEVOS DROPS
              </h2>

              <Link
                href="/store"
                className="group flex items-center gap-2 text-black hover:text-gray-700 transition-colors"
              >
                <span className="font-urbanist font-medium text-sm md:text-base">
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

            <SimpleProductGrid cols={3} gap="small">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleProductGrid>
          </div>
        </section>
      )}
    </div>
  );
}