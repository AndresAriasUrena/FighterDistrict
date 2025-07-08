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
      console.error('Missing WooCommerce configuration');
      
      // Devolver array vacío en lugar de error para no romper la UI
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

    // Construir URL de WooCommerce
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

    console.log('Fetching products from:', `${apiUrl}?${params.toString().replace(wcSecret, '***')}`);

    // Hacer la petición a WooCommerce
    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'FighterDistrict/1.0'
      },
      // No usar cache en fetch para controlar nosotros el cache
      cache: 'no-store'
    });

    // Manejar errores de la API
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API Error:', {
        status: response.status,
        statusText: response.statusText,
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
      console.error('Invalid response format:', products);
      return NextResponse.json(
        { error: 'Invalid response format from WooCommerce' },
        { status: 500 }
      );
    }

    // Transformar productos para asegurar que tienen la estructura correcta
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price || product.regular_price || '0',
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      images: product.images || [],
      categories: product.categories || [],
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
      short_description: product.short_description,
      on_sale: product.on_sale
    }));

    // Actualizar cache
    cachedProducts = transformedProducts;
    cacheTimestamp = now;

    // Obtener headers de paginación
    const totalProducts = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');

    // Devolver respuesta con headers útiles
    return NextResponse.json(transformedProducts, {
      headers: {
        'X-Total-Count': totalProducts || '0',
        'X-Total-Pages': totalPages || '1',
        'X-Current-Page': page,
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Unexpected error in products API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Endpoint para limpiar cache manualmente si es necesario
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

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Bad request' 
    }, { status: 400 });
  }
}