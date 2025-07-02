// Tipos para ONVO Pay API

export interface OnvoPaymentLink {
  id: string;
  amount: number;
  currency: string;
  order_id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  url: string;
  created_at: string;
  expires_at: string;
}

export interface OnvoCreatePaymentRequest {
  amount: number;
  currency: 'CRC' | 'USD';
  order_id: string;
  description?: string;
  customer_email: string;
  customer_name: string;
  redirect_url: string;
  webhook_url?: string;
  metadata?: Record<string, string>;
}

export interface OnvoCreatePaymentResponse {
  id: string;
  url?: string;
  status: OnvoPaymentStatus;
  amount: number;
  currency: string;
  order_id: string;
  expires_at: string;
}

export interface OnvoPaymentStatus {
  id: string;
  status: 'paid' | 'unpaid' | 'open' | 'expired';
  amount: number;
  currency: string;
  order_id: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  completed_at?: string | null;
  metadata?: Record<string, any>;
}

export interface OnvoWebhookEvent {
  id: string;
  type: 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  data: OnvoPaymentStatus;
  created_at: string;
}

// Tipos para ordenes de WooCommerce adaptadas para checkout
export interface CheckoutOrderData {
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  payment_method: 'onvo';
  payment_method_title: 'ONVO Pay';
  set_paid: false;
  status: 'pending';
}

export interface CreateOrderRequest {
  orderData: CheckoutOrderData;
  cartItems: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
}

export interface CreateOrderResponse {
  orderId: number;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
}

// Tipos específicos para One Time Links
export interface OnvoLineItem {
  product: {
    name: string;
    description: string;
    isActive: boolean;
    isShippable: boolean;
    images?: string[];
  };
  price: {
    unitAmount: number; // En centavos
    currency: 'CRC' | 'USD';
    type: 'one_time' | 'recurring';
  };
  quantity: number;
}

export interface OnvoOneTimeLinkRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  redirectUrl: string;
  cancelUrl: string;
  lineItems: OnvoLineItem[];
  metadata?: Record<string, string>;
}

export interface OnvoOneTimeLinkResponse {
  id: string;
  accountId: string;
  url: string;
  updatedAt: string;
  createdAt: string;
  billingAddressCollection: boolean;
  allowPromotionCodes: boolean;
  successUrl: string;
  cancelUrl: string;
  status: 'open' | 'expired';
  lineItems: OnvoLineItem[];
  mode: 'test' | 'live';
  shippingAddressCollection: boolean;
  shippingCountries: string[];
  shippingRates: string[];
  paymentStatus: 'paid' | 'unpaid';
  paymentIntentId: string;
  account: any;
}

// Tipos para errores de ONVO
export interface OnvoError {
  statusCode: number;
  apiCode?: string;
  message: string[];
  error: string;
}

// Webhook payload types
export interface OnvoWebhookPayload {
  id: string;
  type: string;
  data: {
    object: OnvoOneTimeLinkResponse;
  };
  created: number;
} 