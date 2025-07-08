// src/app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const { slug } = await params;

    // Verificar configuración
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const wcKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
    const wcSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

    if (!wpUrl || !wcKey || !wcSecret) {
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Buscar producto por slug
    const productUrl = `${wpUrl}/wp-json/wc/v3/products?slug=${slug}&consumer_key=${wcKey}&consumer_secret=${wcSecret}`;
    
    const productResponse = await fetch(productUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!productResponse.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const products = await productResponse.json();
    
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = products[0];

    // Si es un producto variable, obtener las variaciones
    if (product.type === 'variable' && product.id) {
      try {
        const variationsUrl = `${wpUrl}/wp-json/wc/v3/products/${product.id}/variations?consumer_key=${wcKey}&consumer_secret=${wcSecret}&per_page=100`;
        
        const variationsResponse = await fetch(variationsUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (variationsResponse.ok) {
          const variations = await variationsResponse.json();
          product.available_variations = variations;
        }
      } catch (error) {
        console.error('Error fetching variations:', error);
        // No falla si no puede obtener las variaciones
      }
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error('Error in product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}