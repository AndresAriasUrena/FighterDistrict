// src/app/api/test-connection/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasWpUrl: !!process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
      hasWcKey: !!process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
      hasWcSecret: !!process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
    },
    urls: {
      wordpress: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'NOT SET',
      woocommerce: process.env.NEXT_PUBLIC_WC_URL || 'NOT SET',
    },
    tests: {
      wordpressApi: { status: 'pending', message: '' },
      woocommerceApi: { status: 'pending', message: '' },
      singleProduct: { status: 'pending', message: '' },
      error: { status: 'pending', message: '' }
    }
  };

  try {
    // Test 1: WordPress API básica
    console.log('Testing WordPress API...');
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    if (wpUrl) {
      const wpResponse = await fetch(`${wpUrl}/wp/v2/posts?per_page=1`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      results.tests.wordpressApi = {
        status: wpResponse.ok ? 'success' : 'failed',
        message: `Status: ${wpResponse.status} ${wpResponse.statusText}`
      };
    } else {
      results.tests.wordpressApi = {
        status: 'failed',
        message: 'WordPress URL not configured'
      };
    }

    // Test 2: WooCommerce API
    console.log('Testing WooCommerce API...');
    const wcKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
    const wcSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;
    
    if (wpUrl && wcKey && wcSecret) {
      const wcUrl = `${wpUrl}/wp-json/wc/v3/products?consumer_key=${wcKey}&consumer_secret=${wcSecret}&per_page=1`;
      
      const wcResponse = await fetch(wcUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (wcResponse.ok) {
        const products = await wcResponse.json();
        results.tests.woocommerceApi = {
          status: 'success',
          message: `Found ${Array.isArray(products) ? products.length : 0} products`
        };

        // Test 3: Single product details
        if (Array.isArray(products) && products.length > 0) {
          results.tests.singleProduct = {
            status: 'success',
            message: `First product: ${products[0].name} (ID: ${products[0].id})`
          };
        }
      } else {
        const errorText = await wcResponse.text();
        results.tests.woocommerceApi = {
          status: 'failed',
          message: `Status: ${wcResponse.status} - ${errorText.substring(0, 100)}...`
        };
      }
    } else {
      results.tests.woocommerceApi = {
        status: 'failed',
        message: 'WooCommerce credentials not configured'
      };
    }

  } catch (error) {
    console.error('Connection test error:', error);
    results.tests.error = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Determinar estado general
  const allTests = Object.values(results.tests);
  const hasFailures = allTests.some(test => test.status === 'failed');
  
  return NextResponse.json(results, {
    status: hasFailures ? 500 : 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}