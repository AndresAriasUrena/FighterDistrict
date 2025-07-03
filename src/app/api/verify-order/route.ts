import { NextRequest, NextResponse } from 'next/server'
import { api as woocommerce } from '@/lib/woocommerce'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }


    // Obtener la orden de WooCommerce
    const response = await woocommerce.get(`orders/${orderId}`)
    const order = response.data


    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        currency: order.currency,
        date_created: order.date_created,
        billing: order.billing,
        line_items: order.line_items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          total: item.total
        }))
      }
    })

  } catch (error: any) {
    console.error('❌ Error verificando orden:', error.message)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al verificar la orden',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 