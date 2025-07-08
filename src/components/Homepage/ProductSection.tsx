import Link from 'next/link';
import ProductCard from '../ui/ProductCard';
import SimpleProductGrid from '../ui/SimpleProductGrid'; // 👈 Nuevo import
import { api } from "@/lib/woocommerce";
import { WooCommerceProduct, transformWooCommerceProduct } from "@/types/product";

export default async function ProductSection() {
  try {
    const bestSellersRes = await api.get("products", {
      per_page: 3,
      orderby: 'popularity'
    });

    const newProductsRes = await api.get("products", {
      per_page: 3,
      orderby: 'date',
      order: 'desc'
    });

    const bestSellersWoo: WooCommerceProduct[] = bestSellersRes.data;
    const newProductsWoo: WooCommerceProduct[] = newProductsRes.data;

    const bestSellers = bestSellersWoo.map(transformWooCommerceProduct);
    const newProducts = newProductsWoo.map(transformWooCommerceProduct);

    return (
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
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

        <section className="border-t border-gray-200">
          <div className=" mx-auto">
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
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-center text-gray-500">Error al cargar productos</p>
        </div>
      </div>
    );
  }
}
