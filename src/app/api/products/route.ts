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

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '24'), 100); // Máximo 100
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');

    console.log(`API: Fetching products - page: ${page}, per_page: ${perPage}, orderby: ${orderby}`);
    

    // Verificar cache solo para la primera página con configuración estándar
    const now = Date.now();
    const isStandardRequest = page === 1 && perPage === 24 && orderby === 'date' && order === 'desc';
    
    if (isStandardRequest && cachedProducts && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached products');
      return NextResponse.json(cachedProducts, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Products-Count': cachedProducts.length.toString(),
          'X-Total-Pages': '1' // Cache solo para primera página
        }
      });
    }

    // Construir URL de WooCommerce
    const apiUrl = `${wpUrl}/wp-json/wc/v3/products`;
    const params = new URLSearchParams({
      consumer_key: wcKey,
      consumer_secret: wcSecret,
      per_page: perPage.toString(),
      orderby: orderby,
      order: order,
      page: page.toString(),
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
        error: errorText.substring(0, 500) // Limitar el log
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
          details: errorText.substring(0, 200)
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

    console.log(`Successfully fetched ${products.length} products`);

    // Obtener información de paginación de los headers de WooCommerce
    const totalProducts = response.headers.get('X-WP-Total') || products.length.toString();
    const totalPages = response.headers.get('X-WP-TotalPages') || '1';

    console.log(`Pagination info: Total Products: ${totalProducts}, Total Pages: ${totalPages}`);

    // Actualizar cache solo para requests estándar
    if (isStandardRequest) {
      cachedProducts = products;
      cacheTimestamp = now;
    }

    // Construir headers de respuesta
    const responseHeaders = {
      'X-Cache': 'MISS',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Products-Count': products.length.toString(),
      'X-Total': totalProducts,
      'X-Total-Pages': totalPages,
      'X-Current-Page': page.toString(),
      'X-Per-Page': perPage.toString()
    };

    // Retornar productos con headers de paginación
    return NextResponse.json(products, {
      headers: responseHeaders
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

// Función de utilidad para debug - optional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'clear-cache') {
      cachedProducts = null;
      cacheTimestamp = 0;
      
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

    if (body.action === 'cache-status') {
      return NextResponse.json({
        cached: !!cachedProducts,
        cacheAge: Date.now() - cacheTimestamp,
        productsCount: cachedProducts?.length || 0
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}