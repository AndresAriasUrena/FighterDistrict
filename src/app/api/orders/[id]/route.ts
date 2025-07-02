import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    console.log('📦 Obteniendo orden:', orderId);

    // Validar que el ID sea válido
    if (!orderId || isNaN(Number(orderId))) {
      return NextResponse.json(
        { error: 'ID de orden inválido' },
        { status: 400 }
      );
    }

    // Obtener la orden desde WooCommerce
    const response = await api.get(`orders/${orderId}`);
    const order = response.data;

    console.log('✅ Orden obtenida exitosamente:', {
      id: order.id,
      number: order.number,
      status: order.status,
      total: order.total
    });

    // Retornar los datos de la orden
    return NextResponse.json({
      id: order.id,
      number: order.number,
      status: order.status,
      total: order.total,
      currency: order.currency,
      date_created: order.date_created,
      billing: {
        first_name: order.billing.first_name,
        last_name: order.billing.last_name,
        email: order.billing.email,
        phone: order.billing.phone,
        address_1: order.billing.address_1,
        city: order.billing.city,
        state: order.billing.state,
        country: order.billing.country
      },
      shipping: {
        first_name: order.shipping.first_name,
        last_name: order.shipping.last_name,
        address_1: order.shipping.address_1,
        city: order.shipping.city,
        state: order.shipping.state,
        country: order.shipping.country
      },
      line_items: order.line_items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product_id: item.product_id,
        variation_id: item.variation_id
      })),
      shipping_lines: order.shipping_lines,
      tax_lines: order.tax_lines,
      fee_lines: order.fee_lines,
      meta_data: order.meta_data,
      payment_method: order.payment_method,
      payment_method_title: order.payment_method_title,
      transaction_id: order.transaction_id,
      date_paid: order.date_paid,
      customer_note: order.customer_note
    });

  } catch (error) {
    console.error('❌ Error obteniendo orden:', error);
    
    // Manejo específico de errores de WooCommerce
    if (error && typeof error === 'object' && 'response' in error) {
      const wcError = error as any;
      
      if (wcError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Orden no encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Error del servidor de WooCommerce',
          details: wcError.response?.data?.message || wcError.message
        },
        { status: wcError.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 