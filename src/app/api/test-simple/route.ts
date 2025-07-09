// src/app/api/test-simple/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    wpUrl: process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
    wcKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
    wcSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
    nodeEnv: process.env.NODE_ENV
  };

  console.log('Environment Config:', {
    wpUrl: config.wpUrl,
    hasKey: !!config.wcKey,
    hasSecret: !!config.wcSecret,
    keyStart: config.wcKey?.substring(0, 10),
    secretStart: config.wcSecret?.substring(0, 10)
  });

  if (!config.wpUrl || !config.wcKey || !config.wcSecret) {
    return NextResponse.json({
      error: 'Missing configuration',
      config: {
        hasWpUrl: !!config.wpUrl,
        hasWcKey: !!config.wcKey,
        hasWcSecret: !!config.wcSecret,
        wpUrl: config.wpUrl
      }
    }, { status: 500 });
  }

  try {
    // Test WooCommerce products endpoint
    const wcUrl = `${config.wpUrl}/wp-json/wc/v3/products?consumer_key=${config.wcKey}&consumer_secret=${config.wcSecret}&per_page=5`;
    
    console.log('Fetching from:', wcUrl.replace(config.wcSecret, '***'));
    
    const response = await fetch(wcUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FighterDistrict-Test/1.0'
      }
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce Error:', errorText);
      
      return NextResponse.json({
        error: 'WooCommerce API Error',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        url: config.wpUrl
      }, { status: response.status });
    }

    const products = await response.json();
    console.log('Products fetched:', Array.isArray(products) ? products.length : 'Not an array');

    return NextResponse.json({
      success: true,
      config: {
        wpUrl: config.wpUrl,
        environment: config.nodeEnv
      },
      results: {
        productsCount: Array.isArray(products) ? products.length : 0,
        firstProduct: Array.isArray(products) && products.length > 0 ? {
          id: products[0].id,
          name: products[0].name,
          price: products[0].price
        } : null
      }
    });

  } catch (error: any) {
    console.error('Fetch Error:', error.message);
    
    return NextResponse.json({
      error: 'Network Error',
      message: error.message,
      config: {
        wpUrl: config.wpUrl,
        environment: config.nodeEnv
      }
    }, { status: 500 });
  }
}