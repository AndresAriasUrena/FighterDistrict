// src/app/api/products-clean/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Hardcoded para evitar cualquier problema con variables de entorno
    const wpUrl = 'https://wp.fighterdistrict.com';
    const wcKey = 'ck_5538dc73865459559e6995d160f5b434ba596f03';
    const wcSecret = 'cs_d52d1c859b2982220774a34deae3533b08c7d66a';

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const perPage = searchParams.get('per_page') || '12';
    const page = searchParams.get('page') || '1';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';

    // Construir URL completa sin variables problemáticas
    const fullUrl = `${wpUrl}/wp-json/wc/v3/products?consumer_key=${wcKey}&consumer_secret=${wcSecret}&per_page=${perPage}&page=${page}&orderby=${orderby}&order=${order}&status=publish`;

    console.log('Fetching from clean URL:', fullUrl.replace(wcSecret, '***'));

    // Hacer la petición
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FighterDistrict-Clean/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce Error:', {
        status: response.status,
        error: errorText.substring(0, 200)
      });
      
      return NextResponse.json(
        { 
          error: 'WooCommerce API Error',
          status: response.status,
          details: errorText.substring(0, 200)
        },
        { status: response.status }
      );
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
      console.error('Invalid response format:', typeof products);
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${products.length} products`);

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=300',
        'X-Products-Count': products.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Clean API Error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}