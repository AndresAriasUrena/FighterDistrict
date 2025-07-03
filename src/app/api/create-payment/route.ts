import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/onvo';

export interface CreatePaymentRequest {
  total: number;
  currency?: string;
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
    const body: CreatePaymentRequest = await request.json();
    const { total, currency = 'USD', customerInfo, cartItems } = body;

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

    // Determinar el monto correcto según la moneda
    let finalAmount: number;
    let finalCurrency: string;
    
    // Si es USD, convertir a centavos
    if (currency === 'USD') {
      finalAmount = Math.round(total * 100); // Convertir a centavos para USD
      finalCurrency = 'USD';
    } else {
      finalAmount = Math.round(total); // Colones ya en unidad correcta
      finalCurrency = 'CRC';
    }

    // Crear descripción del pedido
    const itemsDescription = cartItems
      .map(item => `${item.quantity}x ${item.name}`)
      .join(', ');

    // Crear el payment intent en ONVO según documentación oficial
    const paymentIntentData = {
      amount: finalAmount,
      currency: finalCurrency,
      description: `Pedido Fighter District - ${itemsDescription}`,
      captureMethod: 'automatic' as const,
      metadata: {
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || '',
        store: 'Fighter District',
        items: JSON.stringify(cartItems),
        original_total: total.toString(),
        final_amount: finalAmount.toString(),
        final_currency: finalCurrency
      }
    };

    console.log('=== ONVO PAYMENT INTENT DEBUG ===');
    console.log('Datos enviados a ONVO:', JSON.stringify(paymentIntentData, null, 2));
    
    const paymentIntent = await createPaymentIntent(paymentIntentData);

    console.log('=== RESPUESTA DE ONVO ===');
    console.log('Payment intent creado:', JSON.stringify(paymentIntent, null, 2));

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