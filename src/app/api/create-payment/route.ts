import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/onvo';

export interface CreatePaymentRequest {
  total: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  cartItems: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que las credenciales de ONVO están configuradas
    if (!process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY || !process.env.ONVO_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Error de configuración: credenciales de ONVO no disponibles' },
        { status: 500 }
      );
    }

    const body: CreatePaymentRequest = await request.json();
    const { total, customerInfo, cartItems } = body;

    // Validaciones
    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'El total debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Información del cliente incompleta' },
        { status: 400 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Crear descripción del pedido
    const itemsDescription = cartItems
      .map(item => `${item.quantity}x ${item.name}`)
      .join(', ');

    // Crear el payment intent en ONVO
    const roundedAmount = Math.round(total);
    
    // Validación adicional del monto
    if (roundedAmount < 1) {
      return NextResponse.json(
        { error: 'El monto mínimo debe ser 1 colón' },
        { status: 400 }
      );
    }
    
    // ONVO espera el monto en céntimos (unidad más pequeña de CRC)
    // 1 colón = 100 céntimos
    const amountInCentimos = roundedAmount * 100;
    
    const paymentIntentData = {
      amount: amountInCentimos, // Monto en céntimos
      currency: 'CRC',
      description: `Pedido Fighter District - ${itemsDescription}`,
      captureMethod: 'automatic' as const,
      metadata: {
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || '',
        store: 'Fighter District',
        items: JSON.stringify(cartItems),
        total_amount: total.toString(),
        currency: 'CRC'
      }
    };



    const paymentIntent = await createPaymentIntent(paymentIntentData);

    // Verificar que el payment intent fue creado correctamente
    if (!paymentIntent.id) {
      throw new Error('No se pudo crear el payment intent');
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    if (error.response) {
      console.error('ONVO API Error:', error.response.data);
      return NextResponse.json(
        { 
          error: 'Error al crear el payment intent en ONVO',
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