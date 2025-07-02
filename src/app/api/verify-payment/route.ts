import { NextRequest, NextResponse } from 'next/server';
import { verifyOnvoPayment } from '@/lib/onvo';

interface VerifyPaymentRequest {
  paymentIntentId: string; // Cambiar de sessionId a paymentIntentId
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const { paymentIntentId, orderId } = body;

    console.log('🔍 Verificando Payment Intent de ONVO:', {
      paymentIntentId,
      orderId,
      timestamp: new Date().toISOString()
    });

    // Validar datos requeridos
    if (!paymentIntentId || !orderId) {
      console.error('❌ Faltan datos requeridos:', { paymentIntentId, orderId });
      return NextResponse.json(
        { error: 'Se requiere paymentIntentId y orderId' },
        { status: 400 }
      );
    }

    try {
      // Verificar el estado del Payment Intent en ONVO
      const paymentStatus = await verifyOnvoPayment(paymentIntentId);
      
      console.log('📊 Estado del Payment Intent en ONVO:', {
        paymentIntentId,
        status: paymentStatus.status,
        amount: paymentStatus.amount,
        currency: paymentStatus.currency,
        transactionId: paymentStatus.transaction_id
      });

      // Actualizar la orden en WooCommerce si el pago fue exitoso
      if (paymentStatus.status === 'paid') {
        try {
          const { api } = await import('@/lib/woocommerce');
          
          console.log('🔄 Actualizando orden en WooCommerce...');
          
          await api.put(`orders/${orderId}`, {
            status: 'completed',
            set_paid: true,
            transaction_id: paymentStatus.transaction_id,
            meta_data: [
              {
                key: '_payment_method',
                value: 'onvo_pay'
              },
              {
                key: '_payment_method_title',
                value: 'ONVO Pay'
              },
              {
                key: '_onvo_payment_intent_id',
                value: paymentIntentId
              },
              {
                key: '_onvo_transaction_id',
                value: paymentStatus.transaction_id || ''
              },
              {
                key: '_paid_date',
                value: new Date().toISOString()
              }
            ]
          });

          console.log('✅ Orden actualizada exitosamente en WooCommerce');
        } catch (wcError) {
          console.error('⚠️ Error actualizando orden en WooCommerce:', wcError);
          // Continuar aunque falle la actualización de WooCommerce
        }
      }

      return NextResponse.json({
        success: true,
        payment: {
          paymentIntentId: paymentStatus.id,
          status: paymentStatus.status,
          amount: paymentStatus.amount,
          currency: paymentStatus.currency,
          orderId: paymentStatus.order_id,
          transactionId: paymentStatus.transaction_id,
          createdAt: paymentStatus.created_at,
          completedAt: paymentStatus.completed_at,
          isPaid: paymentStatus.status === 'paid'
        }
      });

    } catch (onvoError) {
      console.error('❌ Error verificando Payment Intent en ONVO:', onvoError);
      
      return NextResponse.json({
        success: false,
        error: 'Error al verificar el estado del pago',
        details: onvoError instanceof Error ? onvoError.message : 'Error desconocido'
      }, { status: 502 });
    }

  } catch (error) {
    console.error('❌ Error general en verify-payment:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET method para verificar manualmente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { error: 'payment_id y order_id son requeridos como query parameters' },
        { status: 400 }
      );
    }

    // Reutilizar la lógica del POST
    return await exports.POST(
      new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ paymentId, orderId }),
        headers: { 'Content-Type': 'application/json' }
      })
    );

  } catch (error) {
    console.error('Error in GET verify-payment:', error);
    
    return NextResponse.json(
      { error: 'Error al verificar el pago' },
      { status: 500 }
    );
  }
} 