import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';

// Rate limiting simple en memoria
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 30; // requests por minuto
const WINDOW_MS = 60 * 1000; // 1 minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);
  
  if (!userRequests) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  // Reset si pasó la ventana de tiempo
  if (now - userRequests.timestamp > WINDOW_MS) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  // Incrementar contador
  userRequests.count++;
  
  return userRequests.count > RATE_LIMIT;
}

function validateQueryParams(searchParams: URLSearchParams) {
  const perPage = searchParams.get('per_page');
  const orderby = searchParams.get('orderby');
  const order = searchParams.get('order');
  
  // Validar per_page
  if (perPage) {
    const num = parseInt(perPage);
    if (isNaN(num) || num < 1 || num > 100) {
      throw new Error('per_page debe ser un número entre 1 y 100');
    }
  }
  
  // Validar orderby
  const validOrderBy = ['date', 'id', 'title', 'slug', 'modified', 'menu_order', 'price'];
  if (orderby && !validOrderBy.includes(orderby)) {
    throw new Error('orderby inválido');
  }
  
  // Validar order
  const validOrder = ['asc', 'desc'];
  if (order && !validOrder.includes(order)) {
    throw new Error('order debe ser asc o desc');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: WINDOW_MS / 1000 },
        { status: 429 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Validar parámetros
    validateQueryParams(searchParams);
    
    const perPage = searchParams.get('per_page') || '100';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';

    const response = await api.get("products", {
      per_page: parseInt(perPage),
      orderby,
      order
    });

    // Headers de cache
    const headers = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutos
      'Content-Type': 'application/json',
    };

    return NextResponse.json(response.data, { headers });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Log estructurado para monitoreo
    const errorLog = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/products',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };
    
    console.error('API Error:', JSON.stringify(errorLog));
    
    // Respuesta de error sanitizada
    if (error instanceof Error && error.message.includes('inválido')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 