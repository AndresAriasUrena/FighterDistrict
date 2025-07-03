import axios from 'axios';

// Configuración de ONVO API
export const onvoConfig = {
  baseURL: 'https://api.onvopay.com/v1',
  publishableKey: process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY!,
  secretKey: process.env.ONVO_SECRET_KEY!,
};

// Cliente HTTP para ONVO API
export const onvoApi = axios.create({
  baseURL: onvoConfig.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos para ONVO según documentación oficial
export interface OnvoPaymentIntentRequest {
  amount: number;
  currency: string;
  description?: string;
  captureMethod?: 'automatic' | 'manual';
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface OnvoPaymentIntentResponse {
  id: string;
  amount: number;
  baseAmount: number;
  exchangeRate: number;
  currency: string;
  status: 'requires_confirmation' | 'requires_payment_method' | 'requires_action' | 'succeeded' | 'refunded' | 'canceled';
  description: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
  nextAction?: {
    type: 'redirect_to_url';
    redirectToUrl: {
      url: string;
      return_url: string;
    };
  };
}

export interface OnvoPaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

// Función para crear un payment intent según documentación oficial
export async function createPaymentIntent(data: OnvoPaymentIntentRequest): Promise<OnvoPaymentIntentResponse> {
  const response = await onvoApi.post('/payment-intents', data, {
    headers: {
      Authorization: `Bearer ${onvoConfig.secretKey}`,
    },
  });
  
  return response.data;
}

// Función para obtener el estado de un pago
export async function getPaymentIntent(paymentIntentId: string): Promise<OnvoPaymentIntent> {
  const response = await onvoApi.get(`/payment_intents/${paymentIntentId}`, {
    headers: {
      Authorization: `Bearer ${onvoConfig.secretKey}`,
    },
  });
  
  return response.data;
}

// Función para verificar un webhook de ONVO
export function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  // Implementar verificación de webhook cuando sea necesario
  // Por ahora retornamos true para development
  return true;
} 