import { NextRequest, NextResponse } from 'next/server';

export interface CreateCheckoutSessionRequest {
  orderId: number;
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
    const body: CreateCheckoutSessionRequest = await request.json();
    const { orderId, total, currency = 'CRC', customerInfo, cartItems } = body;

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

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Formatear teléfono para Costa Rica (+506)
    const formatPhone = (phone?: string): string | undefined => {
      if (!phone) return undefined;
      
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Números costarricenses de 8 dígitos que empiecen con 2, 4, 6, 7, 8
      if (cleanPhone.length === 8 && /^[24678]/.test(cleanPhone)) {
        return `+506${cleanPhone}`;
      }
      
      if (cleanPhone.startsWith('506') && cleanPhone.length === 11) {
        return `+${cleanPhone}`;
      }
      
      return phone.startsWith('+') ? phone : `+${cleanPhone}`;
    };

    // Preparar datos para checkout session
    const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`;
    const customerPhone = formatPhone(customerInfo.phone);
    
    // URLs de retorno
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/checkout/success?order_id=${orderId}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order_id=${orderId}`;

    // ✅ FORMATO CORRECTO: ONVO requiere al menos 1 elemento con quantity (sin name ni price)
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    const lineItems = [{ quantity: totalQuantity }];

    // Datos EXACTOS según ejemplo de documentación oficial
    const checkoutData = {
      customerName,
      customerEmail: customerInfo.email,
      customerPhone,
      redirectUrl: successUrl,
      cancelUrl: cancelUrl,
      lineItems,
      metadata: {
        orderId: orderId.toString(),
        cartId: `cart_${orderId}`
      }
    };

    // Hacer la petición a ONVO
    const response = await fetch('https://api.onvopay.com/v1/checkout/sessions/one-time-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONVO_SECRET_KEY}`,
      },
      body: JSON.stringify(checkoutData),
    });


    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`ONVO API Error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    return NextResponse.json({
      type: 'checkout_session',
      payment: {
        id: responseData.id,
        url: responseData.url,
      },
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { 
        error: 'Error al crear la sesión de checkout en ONVO',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 