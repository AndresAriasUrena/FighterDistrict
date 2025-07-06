import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // Buscar producto por slug
    const response = await api.get("products", {
      slug: slug,
      per_page: 1
    });

    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = response.data[0];

    // Si el producto es variable, obtener todas sus variaciones
    if (product.type === 'variable') {
      try {
        const variations = await api.get(`products/${product.id}/variations`, {
          per_page: 100,
          status: 'publish',
          orderby: 'menu_order',
          order: 'asc'
        });
        
        product.available_variations = variations.data;
      } catch (variationError) {
        console.error('Error fetching variations:', variationError);
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
} 