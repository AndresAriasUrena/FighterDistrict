import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/onvo';

export interface CreatePaymentRequest {
  orderId: number;
  total: number;
  currency?: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { orderId, total, currency = 'CRC', customerInfo } = body;

    // Validaciones
    if (!orderId || !total || total <= 0) {
      return NextResponse.json(
        { error: 'Información de la orden inválida' },
        { status: 400 }
      );
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Información del cliente incompleta' },
        { status: 400 }
      );
    }

    // Determinar el monto correcto según la moneda
    let finalAmount: number;
    let finalCurrency: string;
    
    // Si el total es menor a 100, probablemente está en USD y necesita centavos
    // Si es mayor, probablemente está en colones y ya está en la unidad correcta
    if (currency === 'USD' || total < 100) {
      finalAmount = Math.round(total * 100); // Convertir a centavos para USD
      finalCurrency = 'USD';
    } else {
      finalAmount = Math.round(total); // Colones ya en unidad correcta
      finalCurrency = 'CRC';
    }

    // Crear el payment intent en ONVO según documentación oficial
    const paymentIntentData = {
      amount: finalAmount,
      currency: finalCurrency,
      description: `Orden #${orderId} - Fighter District`,
      captureMethod: 'automatic' as const,
      metadata: {
        order_id: orderId.toString(),
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        store: 'Fighter District',
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

    // Obtener la URL base del sitio para las redirecciones
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    
    // Para desarrollo, usar una URL que funcione con ONVO
    // En producción, usar la URL real del sitio
    let baseUrl: string;
    if (host.includes('localhost')) {
      // Por ahora usar localhost para testing (ONVO puede tener problemas con esto)
      baseUrl = `${protocol}://${host}`;
      
      // TODO: En producción usar ngrok o una URL pública:
      // baseUrl = 'https://tu-dominio.ngrok.io';
    } else {
      baseUrl = `${protocol}://${host}`;
    }

    const successUrl = `${baseUrl}/checkout/success?order_id=${orderId}&payment_intent_id=${paymentIntent.id}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order_id=${orderId}&payment_intent_id=${paymentIntent.id}`;

    console.log('=== URLs DE RETORNO ===');
    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);

    // Construir URL de checkout con return URLs
    const checkoutUrl = `https://checkout.onvopay.com/pay/${paymentIntent.id}?return_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;

    console.log('=== URL DE CHECKOUT FINAL ===');
    console.log('Checkout URL:', checkoutUrl);

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentIntent.id,
        url: checkoutUrl,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });

  } catch (error: any) {
    console.error('Error creating payment link:', error);
    
    // Log more details about the error
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