import axios from 'axios';
import { 
  OnvoCreatePaymentRequest, 
  OnvoCreatePaymentResponse, 
  OnvoPaymentStatus 
} from '@/types/onvo';

// Cliente para ONVO Pay API - Usando Payment Intents
class OnvoPayClient {
  private apiUrl: string;
  private secretKey: string;
  private publishableKey: string;

  constructor() {
    this.apiUrl = 'https://api.onvopay.com/v1';
    this.secretKey = process.env.ONVO_SECRET_KEY || '';
    this.publishableKey = process.env.ONVO_PUBLISHABLE_KEY || '';

    console.log('🔧 Configuración ONVO:', {
      hasSecretKey: !!this.secretKey,
      hasPublishableKey: !!this.publishableKey,
      secretKeyLength: this.secretKey?.length || 0,
      apiUrl: this.apiUrl,
      secretKeyPrefix: this.secretKey?.substring(0, 20) + '...'
    });

    if (!this.secretKey) {
      throw new Error('ONVO_SECRET_KEY is required');
    }
  }

  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Crear Payment Intent (para usar con SDK de ONVO en frontend)
  async createPaymentIntent(data: OnvoCreatePaymentRequest): Promise<OnvoCreatePaymentResponse> {
    try {
      const payload = {
        amount: Math.round(data.amount * 100), // ONVO espera centavos
        currency: data.currency,
        description: data.description || `Orden #${data.order_id}`,
        captureMethod: 'automatic',
        metadata: {
          orderId: data.order_id,
          customerEmail: data.customer_email,
          customerName: data.customer_name,
          store: 'Fighter District',
          ...data.metadata
        }
      };

      console.log('🚀 Creando Payment Intent en ONVO:', {
        url: `${this.apiUrl}/payment-intents`,
        payload,
        headers: this.getAuthHeaders()
      });

      const response = await axios.post(
        `${this.apiUrl}/payment-intents`,
        payload,
        {
          headers: this.getAuthHeaders(),
          timeout: 30000
        }
      );

      console.log('✅ Payment Intent creado exitosamente:', {
        status: response.status,
        data: response.data
      });

      // Retornar datos para uso con SDK de ONVO en frontend
      return {
        id: response.data.id,
        url: undefined, // No hay URL directa - se usa SDK
        status: response.data.status || 'requires_confirmation',
        amount: data.amount, // Mantener el monto original
        currency: data.currency,
        order_id: data.order_id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      };

    } catch (error) {
      console.error('❌ Error creating ONVO Payment Intent:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });

        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`ONVO API Error (${error.response?.status || 'Unknown'}): ${message}`);
      }
      
      throw new Error('Failed to create ONVO payment intent');
    }
  }

  // Verificar estado de Payment Intent
  async getPaymentIntentStatus(paymentIntentId: string): Promise<OnvoPaymentStatus> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/payment-intents/${paymentIntentId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        id: response.data.id,
        status: this.mapPaymentIntentStatus(response.data.status),
        amount: response.data.amount / 100, // Convertir de centavos
        currency: response.data.currency,
        order_id: response.data.metadata?.orderId || '',
        payment_method: 'onvo_payment_intent',
        transaction_id: response.data.id,
        created_at: response.data.createdAt,
        completed_at: response.data.status === 'succeeded' ? response.data.updatedAt : null,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error('Error getting ONVO payment intent status:', error);
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`ONVO API Error: ${message}`);
      }
      
      throw new Error('Failed to get payment intent status');
    }
  }

  // Mapear estados de Payment Intent a nuestros estados
  private mapPaymentIntentStatus(onvoStatus: string): 'paid' | 'unpaid' | 'open' | 'expired' {
    switch (onvoStatus) {
      case 'succeeded':
        return 'paid';
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'processing':
        return 'unpaid';
      case 'canceled':
        return 'expired';
      default:
        return 'unpaid';
    }
  }

  // Verificar webhook signature (para seguridad)
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Get publishable key for frontend
  getPublishableKey(): string {
    return this.publishableKey;
  }
}

// Singleton instance
export const onvoClient = new OnvoPayClient();

// Helper functions
export async function createOnvoPaymentLink(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
  redirectUrl: string
): Promise<OnvoCreatePaymentResponse> {
  return onvoClient.createPaymentIntent({
    amount,
    currency: 'CRC',
    order_id: orderId,
    description: `Compra en Fighter District - Orden #${orderId}`,
    customer_email: customerEmail,
    customer_name: customerName,
    redirect_url: redirectUrl,
    metadata: {
      store: 'Fighter District',
      source: 'website'
    }
  });
}

export async function verifyOnvoPayment(paymentIntentId: string): Promise<OnvoPaymentStatus> {
  return onvoClient.getPaymentIntentStatus(paymentIntentId);
} 