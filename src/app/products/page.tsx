import { api } from "@/lib/woocommerce";
import { WooCommerceProduct, transformWooCommerceProduct } from "@/types/product";
import ProductCard, { ProductGrid } from "@/components/ui/ProductCard";

export default async function ProductsPage() {
  try {
    const res = await api.get("products");
    const wooProducts: WooCommerceProduct[] = res.data;
    const products = wooProducts.map(transformWooCommerceProduct);

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-raven-bold text-black mb-8">Productos</h1>
        
        <ProductGrid cols={3} gap="medium">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              category={product.category}
              price={product.price}
              image={product.image}
              href={`/products/${product.slug}`}
            />
          ))}
        </ProductGrid>
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-raven-bold text-black mb-8">Productos</h1>
        <p className="text-red-500">Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>
      </div>
    );
  }
}
