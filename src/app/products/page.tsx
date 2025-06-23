import { api } from "@/lib/woocommerce";

export default async function ProductsPage() {
  const res = await api.get("products");
  const products = res.data;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product: any) => (
          <li key={product.id} className="border p-4 rounded shadow">
            <p className="font-semibold">{product.name}</p>
            <p>Precio: ${product.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
