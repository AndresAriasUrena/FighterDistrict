// src/lib/woocommerce.ts
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Verificar que las variables de entorno estén definidas
const WC_URL = process.env.NEXT_PUBLIC_WC_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const WC_CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

if (!WC_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
  console.error('WooCommerce configuration missing:', {
    url: !!WC_URL,
    key: !!WC_CONSUMER_KEY,
    secret: !!WC_CONSUMER_SECRET
  });
}

export const api = new WooCommerceRestApi({
  url: WC_URL || '',
  consumerKey: WC_CONSUMER_KEY || '',
  consumerSecret: WC_CONSUMER_SECRET || '',
  version: "wc/v3"
});