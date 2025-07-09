// src/app/api/products/[id]/related/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params;
    
    console.log(`🔗 Finding related products for product ID: ${productId}`);

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

    // Paso 1: Obtener el producto actual para extraer información relevante
    const productUrl = `${wpUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${wcKey}&consumer_secret=${wcSecret}`;
    
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

    const currentProduct = await productResponse.json();
    console.log(`📦 Current product: ${currentProduct.name}`);
    
    let relatedProducts: any[] = [];

    // Paso 2: Intentar usar los related_ids de WooCommerce
    if (currentProduct.related_ids && currentProduct.related_ids.length > 0) {
      console.log(`🎯 Using WooCommerce related_ids: ${currentProduct.related_ids}`);
      
      try {
        const relatedIds = currentProduct.related_ids.slice(0, 6); // Máximo 6 para tener buffer
        const includeParam = relatedIds.join(',');
        
        const relatedUrl = `${wpUrl}/wp-json/wc/v3/products?consumer_key=${wcKey}&consumer_secret=${wcSecret}&include=${includeParam}&status=publish&per_page=6`;
        
        const relatedResponse = await fetch(relatedUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (relatedResponse.ok) {
          const relatedFromIds = await relatedResponse.json();
          relatedProducts = [...relatedProducts, ...relatedFromIds];
          console.log(`✅ Found ${relatedFromIds.length} products from related_ids`);
        }
      } catch (error) {
        console.error('Error fetching related_ids products:', error);
      }
    }

    // Paso 3: Si no hay suficientes, buscar por categoría
    if (relatedProducts.length < 3 && currentProduct.categories && currentProduct.categories.length > 0) {
      console.log(`📂 Searching by categories: ${currentProduct.categories.map((c: any) => c.name).join(', ')}`);
      
      try {
        const categoryIds = currentProduct.categories.map((cat: any) => cat.id);
        const categoryParam = categoryIds.join(',');
        
        const categoryUrl = `${wpUrl}/wp-json/wc/v3/products?consumer_key=${wcKey}&consumer_secret=${wcSecret}&category=${categoryParam}&exclude=${productId}&status=publish&per_page=6&orderby=popularity`;
        
        const categoryResponse = await fetch(categoryUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (categoryResponse.ok) {
          const categoryProducts = await categoryResponse.json();
          
          // Evitar duplicados
          const existingIds = new Set(relatedProducts.map(p => p.id));
          const newCategoryProducts = categoryProducts.filter((p: any) => !existingIds.has(p.id));
          
          relatedProducts = [...relatedProducts, ...newCategoryProducts];
          console.log(`✅ Found ${newCategoryProducts.length} additional products from categories`);
        }
      } catch (error) {
        console.error('Error fetching category products:', error);
      }
    }

    // Paso 4: Si no hay suficientes, buscar por marca
    if (relatedProducts.length < 3 && currentProduct.brands && currentProduct.brands.length > 0) {
      console.log(`🏷️ Searching by brands: ${currentProduct.brands.map((b: any) => b.name).join(', ')}`);
      
      try {
        // Obtener todos los productos y filtrar por marca localmente
        // (WooCommerce no siempre tiene endpoint directo para marcas)
        const allProductsUrl = `${wpUrl}/wp-json/wc/v3/products?consumer_key=${wcKey}&consumer_secret=${wcSecret}&exclude=${productId}&status=publish&per_page=20&orderby=popularity`;
        
        const allProductsResponse = await fetch(allProductsUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (allProductsResponse.ok) {
          const allProducts = await allProductsResponse.json();
          const currentBrandNames = currentProduct.brands.map((b: any) => b.name.toLowerCase());
          
          const sameBrandProducts = allProducts.filter((product: any) => {
            if (!product.brands || product.brands.length === 0) return false;
            
            return product.brands.some((brand: any) => 
              currentBrandNames.includes(brand.name.toLowerCase())
            );
          });
          
          // Evitar duplicados
          const existingIds = new Set(relatedProducts.map(p => p.id));
          const newBrandProducts = sameBrandProducts.filter((p: any) => !existingIds.has(p.id));
          
          relatedProducts = [...relatedProducts, ...newBrandProducts];
          console.log(`✅ Found ${newBrandProducts.length} additional products from same brand`);
        }
      } catch (error) {
        console.error('Error fetching brand products:', error);
      }
    }

    // Paso 5: Si aún no hay suficientes, usar productos populares/recientes como fallback
    if (relatedProducts.length < 3) {
      console.log(`🔄 Using fallback: recent popular products`);
      
      try {
        const fallbackUrl = `${wpUrl}/wp-json/wc/v3/products?consumer_key=${wcKey}&consumer_secret=${wcSecret}&exclude=${productId}&status=publish&per_page=6&orderby=popularity`;
        
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (fallbackResponse.ok) {
          const fallbackProducts = await fallbackResponse.json();
          
          // Evitar duplicados
          const existingIds = new Set(relatedProducts.map(p => p.id));
          const newFallbackProducts = fallbackProducts.filter((p: any) => !existingIds.has(p.id));
          
          relatedProducts = [...relatedProducts, ...newFallbackProducts];
          console.log(`✅ Found ${newFallbackProducts.length} fallback products`);
        }
      } catch (error) {
        console.error('Error fetching fallback products:', error);
      }
    }

    // Paso 6: Limitar a 3 productos y ordenar por relevancia
    const finalRelatedProducts = relatedProducts
      .slice(0, 3)
      .map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price || product.regular_price || '0',
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        images: product.images || [],
        categories: product.categories || [],
        brands: product.brands || [],
        stock_status: product.stock_status,
        on_sale: product.on_sale || false
      }));

    console.log(`🎉 Returning ${finalRelatedProducts.length} related products:`, 
      finalRelatedProducts.map(p => p.name)
    );

    // Headers de respuesta
    const responseHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Related-Count': finalRelatedProducts.length.toString(),
      'X-Current-Product': currentProduct.name
    };

    return NextResponse.json(finalRelatedProducts, {
      headers: responseHeaders
    });

  } catch (error: any) {
    console.error('❌ Error in related products API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}