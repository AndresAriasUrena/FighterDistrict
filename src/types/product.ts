// Tipos para WooCommerce Products API

export interface WooCommerceImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceTag {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceBrand {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  sold_individually: boolean;
  weight: string;
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  parent_id: number;
  purchase_note: string;
  categories: WooCommerceCategory[];
  tags: WooCommerceTag[];
  brands: WooCommerceBrand[];
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  menu_order: number;
  meta_data: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}

// Tipo simplificado para usar en componentes
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  inStock: boolean;
  featured?: boolean;
}

// Función helper para convertir WooCommerce product a Product
export function transformWooCommerceProduct(wooProduct: WooCommerceProduct): Product {
  return {
    id: wooProduct.id,
    name: wooProduct.name,
    price: parseFloat(wooProduct.price) || 0,
    category: wooProduct.categories[0]?.name || 'Sin categoría',
    image: wooProduct.images[0]?.src || '/placeholder-product.jpg',
    slug: wooProduct.slug,
    description: wooProduct.description,
    shortDescription: wooProduct.short_description,
    inStock: wooProduct.stock_status === 'instock',
    featured: wooProduct.featured
  };
} 