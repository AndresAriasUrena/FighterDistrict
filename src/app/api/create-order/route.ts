import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';
import { CreateOrderRequest, CreateOrderResponse } from '@/types/onvo';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { orderData, cartItems } = body;

    // Validar que hay items en el carrito
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Validar datos de facturación
    if (!orderData.billing.email || !orderData.billing.first_name || !orderData.billing.last_name) {
      return NextResponse.json(
        { error: 'Datos de facturación incompletos' },
        { status: 400 }
      );
    }

    // Preparar line_items para WooCommerce
    const lineItems = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      // Si hay variaciones (talla, color), se pueden agregar aquí
      meta_data: [
        ...(item.selectedSize ? [{ key: 'Talla', value: item.selectedSize }] : []),
        ...(item.selectedColor ? [{ key: 'Color', value: item.selectedColor }] : []),
      ]
    }));

    // Crear la orden en WooCommerce
    const wooOrder = await api.post("orders", {
      payment_method: orderData.payment_method,
      payment_method_title: orderData.payment_method_title,
      set_paid: orderData.set_paid,
      status: orderData.status,
      billing: orderData.billing,
      shipping: orderData.shipping || orderData.billing, // Usar billing como shipping si no se proporciona
      line_items: lineItems,
      meta_data: [
        {
          key: '_payment_provider',
          value: 'onvo'
        },
        {
          key: '_created_via',
          value: 'fighter-district-frontend'
        }
      ]
    });

    const order = wooOrder.data;

    // Log para debugging
    console.log('✅ Orden creada en WooCommerce:', {
      id: order.id,
      number: order.number,
      total: order.total,
      status: order.status
    });

    const response: CreateOrderResponse = {
      orderId: order.id,
      orderNumber: order.number,
      total: parseFloat(order.total),
      currency: order.currency || 'CRC',
      status: order.status
    };

    console.log('📦 Respuesta de create-order:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating order:', error);

    // Log estructurado para debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/create-order',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
    console.error('Order Creation Error:', JSON.stringify(errorLog));

    // Manejar errores específicos de WooCommerce
    if (error instanceof Error) {
      if (error.message.includes('product_id')) {
        return NextResponse.json(
          { error: 'Uno o más productos no son válidos' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Email no válido' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear la orden' },
      { status: 500 }
    );
  }
} 