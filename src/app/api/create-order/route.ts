import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';
import { CartItem } from '@/types/cart';

export interface CreateOrderRequest {
  cart: CartItem[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      address1?: string;
      address2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
  };
  paymentIntentId: string;
  paymentStatus: 'completed' | 'failed';
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { cart, customerInfo, paymentIntentId, paymentStatus } = body;

    // Validar que haya items en el carrito
    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Validar información del cliente
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Información del cliente incompleta' },
        { status: 400 }
      );
    }

    // Validar payment intent
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID es requerido' },
        { status: 400 }
      );
    }

    // Calcular total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Preparar line items para WooCommerce
    const lineItems = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      meta_data: [
        ...(item.selectedSize ? [{ key: 'Talla', value: item.selectedSize }] : []),
        ...(item.selectedColor ? [{ key: 'Color', value: item.selectedColor }] : []),
      ],
    }));

    // Crear la orden en WooCommerce
    const orderData = {
      payment_method: 'onvo',
      payment_method_title: 'ONVO Pay',
      set_paid: paymentStatus === 'completed',
      status: paymentStatus === 'completed' ? 'processing' : 'pending',
      billing: {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone || '',
        address_1: customerInfo.address?.address1 || '',
        address_2: customerInfo.address?.address2 || '',
        city: customerInfo.address?.city || '',
        state: customerInfo.address?.state || '',
        postcode: customerInfo.address?.postcode || '',
        country: customerInfo.address?.country || 'CR',
      },
      shipping: {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        address_1: customerInfo.address?.address1 || '',
        address_2: customerInfo.address?.address2 || '',
        city: customerInfo.address?.city || '',
        state: customerInfo.address?.state || '',
        postcode: customerInfo.address?.postcode || '',
        country: customerInfo.address?.country || 'CR',
      },
      line_items: lineItems,
      meta_data: [
        {
          key: 'created_via',
          value: 'fighter_district_frontend'
        },
        {
          key: 'payment_gateway',
          value: 'onvo'
        },
        {
          key: 'onvo_payment_intent_id',
          value: paymentIntentId
        }
      ]
    };


    const response = await api.post('orders', orderData);
    const order = response.data;


    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: parseFloat(order.total),
        currency: order.currency,
        status: order.status,
        order_key: order.order_key,
      }
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('WooCommerce API Error:', error.response.data);
      return NextResponse.json(
        { 
          error: 'Error al crear la orden en WooCommerce',
          details: error.response.data 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 