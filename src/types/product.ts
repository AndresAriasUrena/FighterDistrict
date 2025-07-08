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

export interface WooCommerceAttributeValue {
  id: number;
  name: string;
  option: string;
}

export interface WooCommerceVariation {
  id: number;
  attributes: WooCommerceAttributeValue[];
  price: string;
  regular_price: string;
  sale_price: string;
  is_in_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
}

// Tipo base de WooCommerce
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
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
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: any[];
  brands?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  available_variations?: Array<{
    id: number;
    attributes: Array<{
      id: number;
      name: string;
      option: string;
    }>;
    price: string;
    regular_price: string;
    sale_price: string;
    is_in_stock: boolean;
    stock_quantity: number | null;
    stock_status: string;
  }>;
}

// Tipo simplificado para uso en la aplicación
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  images: Array<{
    src: string;
    alt?: string;
    name?: string;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  stock_status?: string;
  stock_quantity?: number | null;
  short_description?: string;
  on_sale?: boolean;
}

// Función para transformar de WooCommerce a nuestro tipo
export function transformWooCommerceProduct(wooProduct: WooCommerceProduct): Product {
  return {
    id: wooProduct.id,
    name: wooProduct.name,
    slug: wooProduct.slug,
    price: wooProduct.price || wooProduct.regular_price,
    regular_price: wooProduct.regular_price,
    sale_price: wooProduct.sale_price,
    images: wooProduct.images.map(img => ({
      src: img.src,
      alt: img.alt || wooProduct.name,
      name: img.name
    })),
    categories: wooProduct.categories,
    stock_status: wooProduct.stock_status,
    stock_quantity: wooProduct.stock_quantity,
    short_description: wooProduct.short_description,
    on_sale: wooProduct.on_sale
  };
}