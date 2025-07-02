import { NextRequest, NextResponse } from 'next/server';
import { onvoClient } from '@/lib/onvo';
import { OnvoCreatePaymentRequest } from '@/types/onvo';

// Rate limiting simple
const requestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 5; // 5 requests por minuto por IP

interface CreatePaymentRequest {
  orderId: string;
  orderNumber: string;
  total: number;
  customerEmail: string;
  customerName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { orderId, orderNumber, total, customerEmail, customerName } = body;

    console.log('📋 Datos recibidos en create-payment:', {
      orderId,
      orderNumber,
      total,
      customerEmail,
      customerName,
      bodyComplete: body
    });

    // Verificar variables de entorno
    console.log('🔧 Variables de entorno:', {
      hasSecretKey: !!process.env.ONVO_SECRET_KEY,
      hasPublishableKey: !!process.env.ONVO_PUBLISHABLE_KEY,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL
    });

    // Rate limiting por IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const now = Date.now();
    const timestamps = requestTimestamps.get(clientIP) || [];
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    
    if (recentTimestamps.length >= MAX_REQUESTS) {
      console.warn(`⚠️ Rate limit excedido para IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }
    
    recentTimestamps.push(now);
    requestTimestamps.set(clientIP, recentTimestamps);

    // Validar datos requeridos
    if (!orderId || !orderNumber || !customerEmail || !customerName) {
      console.error('❌ Faltan datos requeridos:', {
        hasOrderId: !!orderId,
        hasOrderNumber: !!orderNumber,
        hasCustomerEmail: !!customerEmail,
        hasCustomerName: !!customerName
      });
      
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar total
    if (typeof total !== 'number' || total < 0) {
      console.error('❌ Total inválido:', { total, type: typeof total });
      return NextResponse.json(
        { error: 'El total debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      console.error('❌ Email inválido:', customerEmail);
      return NextResponse.json(
        { error: 'El email no tiene un formato válido' },
        { status: 400 }
      );
    }

    // Construir URLs de redirección
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/checkout/success?order_id=${orderId}&order_number=${orderNumber}`;
    const cancelUrl = `${baseUrl}/checkout/failed?order_id=${orderId}&order_number=${orderNumber}`;

    console.log('🔗 URLs de redirección:', { successUrl, cancelUrl });

    // Manejo especial para productos gratuitos
    if (total === 0) {
      console.log('🎁 Producto gratuito detectado, redirigiendo directamente al éxito');
      
      try {
        // Actualizar la orden en WooCommerce como completada
        const { api } = await import('@/lib/woocommerce');
        
        await api.put(`orders/${orderId}`, {
          status: 'completed',
          set_paid: true,
          meta_data: [
            {
              key: '_payment_method',
              value: 'free'
            },
            {
              key: '_payment_method_title',
              value: 'Orden Gratuita'
            },
            {
              key: '_order_type',
              value: 'free_product'
            }
          ]
        });

        console.log('✅ Orden gratuita marcada como completada');
      } catch (wcError) {
        console.error('⚠️ Error actualizando orden gratuita en WooCommerce:', wcError);
      }

      return NextResponse.json({
        success: true,
        redirectUrl: successUrl,
        isFreeOrder: true
      });
    }

    console.log('💳 Creando Payment Intent en ONVO Pay...');

    try {
      // Crear Payment Intent en ONVO (para usar con SDK en frontend)
      const onvoData: OnvoCreatePaymentRequest = {
        amount: total,
        currency: 'USD',
        description: `Orden #${orderId} - Fighter District`,
        order_id: orderId.toString(),
        customer_email: customerEmail,
        customer_name: customerName,
        redirect_url: '', // No se usa con SDK
        metadata: {
          source: 'Fighter District Checkout',
          environment: process.env.NODE_ENV || 'development'
        }
      };

      console.log('🎯 Enviando datos a ONVO:', onvoData);

      const paymentResult = await onvoClient.createPaymentIntent(onvoData);
      
      console.log('✅ Payment Intent creado:', paymentResult);

      // Actualizar metadatos de la orden en WooCommerce
      const { api: wooApi } = await import('@/lib/woocommerce');
      
      await wooApi.put(`orders/${orderId}`, {
        meta_data: [
          {
            key: '_onvo_payment_intent_id',
            value: paymentResult.id
          },
          {
            key: '_onvo_payment_status',
            value: paymentResult.status
          }
        ]
      });

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentResult.id, // Para usar con SDK de ONVO
        orderId: orderId,
        amount: total,
        currency: 'USD',
        // No hay redirect_url - se usa SDK en la misma página
      });

    } catch (onvoError) {
      console.error('❌ Error creando Payment Intent en ONVO:', onvoError);
      
      return NextResponse.json({
        success: false,
        error: 'Error con el proveedor de pagos. Intenta de nuevo.',
        details: onvoError instanceof Error ? onvoError.message : 'Error desconocido'
      }, { status: 502 });
    }

  } catch (error) {
    console.error('❌ Error general en create-payment:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 