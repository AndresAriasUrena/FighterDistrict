import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Solo verificar si las variables están SET, no mostrar valores
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      WC_URL_SET: !!process.env.NEXT_PUBLIC_WC_URL,
      WC_CONSUMER_KEY_SET: !!process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
      WC_CONSUMER_SECRET_SET: !!process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
      WORDPRESS_URL_SET: !!process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
      ONVO_PUBLISHABLE_KEY_SET: !!process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY,
      ONVO_SECRET_KEY_SET: !!process.env.ONVO_SECRET_KEY,
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      environment: envStatus,
      message: 'Environment check completed'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error checking environment',
      message: error.message
    }, { status: 500 });
  }
} 