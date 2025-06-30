import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/woocommerce';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

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

    return NextResponse.json(response.data[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
} 