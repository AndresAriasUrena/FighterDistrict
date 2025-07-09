// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Cache para reducir llamadas a WooCommerce
let cachedProducts: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function GET(request: NextRequest) {
  try {
    // Verificar configuración
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const wcKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
    const wcSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

    if (!wpUrl || !wcKey || !wcSecret) {
      console.error('Missing WooCommerce configuration:', {
        hasWpUrl: !!wpUrl,
        hasWcKey: !!wcKey,
        hasWcSecret: !!wcSecret
      });
      
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store',
          'X-Error': 'Missing WooCommerce configuration'
        }
      });
    }

    // Usar cache si está disponible y no ha expirado
    const now = Date.now();
    if (cachedProducts && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedProducts, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const perPage = searchParams.get('per_page') || '100';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';
    const page = searchParams.get('page') || '1';

    // Construir URL de WooCommerce - AQUÍ ESTÁ LA CORRECCIÓN
    const apiUrl = `${wpUrl}/wp-json/wc/v3/products`;
    const params = new URLSearchParams({
      consumer_key: wcKey,
      consumer_secret: wcSecret,
      per_page: perPage,
      orderby: orderby,
      order: order,
      page: page,
      status: 'publish'
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log('Fetching products from:', fullUrl.replace(wcSecret, '***'));

    // Hacer la petición a WooCommerce
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'FighterDistrict/1.0'
      },
      cache: 'no-store'
    });

    // Manejar errores de la API
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl.replace(wcSecret, '***'),
        error: errorText
      });

      // Errores específicos
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed', details: 'Invalid WooCommerce credentials' },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Not found', details: 'WooCommerce endpoint not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: 'WooCommerce API error',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }

    // Parsear la respuesta
    const products = await response.json();

    // Validar que sea un array
    if (!Array.isArray(products)) {
      console.error('WooCommerce returned non-array:', typeof products);
      return NextResponse.json(
        { error: 'Invalid response format from WooCommerce' },
        { status: 500 }
      );
    }

    // Actualizar cache
    cachedProducts = products;
    cacheTimestamp = now;

    console.log(`Successfully fetched ${products.length} products`);

    // Retornar productos con headers de cache
    return NextResponse.json(products, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Products-Count': products.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Fatal error in products API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}