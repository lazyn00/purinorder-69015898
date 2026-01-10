import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the products URL from environment variable
    const sheetUrl = Deno.env.get('GOOGLE_SHEETS_PRODUCTS_URL');
    
    if (!sheetUrl) {
      throw new Error('GOOGLE_SHEETS_PRODUCTS_URL secret is not configured');
    }

    console.log('Fetching products from Google Sheet Apps Script');

    // Fetch data from Google Apps Script doGet endpoint
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Apps Script: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received data from Apps Script:', JSON.stringify(data).slice(0, 500));

    // Parse products from sheet data
    const products = data.products || data;
    
    if (!Array.isArray(products)) {
      throw new Error('Invalid data format: expected array of products');
    }

    console.log(`Found ${products.length} products in sheet`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        // Map sheet fields to database fields
        const productData: any = {
          name: product.name || product['Tên'] || '',
          price: parseInt(product.price || product['Giá']) || 0,
          te: parseFloat(product.te || product['tệ']) || null,
          rate: parseFloat(product.rate || product['Rate']) || null,
          r_v: parseFloat(product['r-v'] || product.r_v) || null,
          can_weight: parseFloat(product['cân'] || product.can_weight) || null,
          pack: parseFloat(product.pack || product['Pack']) || null,
          cong: parseFloat(product['công'] || product.cong) || null,
          total: parseFloat(product['tổng'] || product.total) || null,
          category: product.category || product['Danh mục'] || null,
          subcategory: product.subcategory || null,
          artist: product.artist || product['Nghệ sĩ'] || null,
          status: product.status || product['Trạng thái'] || 'Sẵn',
          description: product.description || product['Mô tả'] || null,
          stock: parseInt(product.stock) || null,
          master: product.master || null,
          link_order: product['link order'] || product.link_order || null,
          proof: product.proof || null,
          production_time: product.productionTime || product.production_time || null,
          actual_rate: parseFloat(product['rate thực'] || product.actual_rate) || null,
          actual_can: parseFloat(product['cân thực'] || product.actual_can) || null,
          actual_pack: parseFloat(product['pack thực'] || product.actual_pack) || null,
          fees_included: product.feesIncluded === true || product.feesIncluded === 'true' || product.fees_included === true,
          deposit_allowed: product.depositAllowed !== false && product.deposit_allowed !== false,
        };

        // Handle order_deadline
        if (product.orderDeadline || product.order_deadline) {
          const deadline = product.orderDeadline || product.order_deadline;
          if (deadline && deadline !== '') {
            try {
              productData.order_deadline = new Date(deadline).toISOString();
            } catch (e) {
              console.log('Invalid deadline format:', deadline);
            }
          }
        }

        // Handle images
        if (product.images) {
          if (typeof product.images === 'string') {
            productData.images = product.images.split(',').map((s: string) => s.trim()).filter((s: string) => s);
          } else if (Array.isArray(product.images)) {
            productData.images = product.images;
          }
        }

        // Handle variants - format: "Name:Price:Stock,Name2:Price2:Stock2"
        if (product.variants) {
          if (typeof product.variants === 'string') {
            productData.variants = product.variants.split(',').map((v: string) => {
              const parts = v.split(':');
              const variant: any = { 
                name: parts[0]?.trim() || '', 
                price: parseFloat(parts[1]) || 0 
              };
              if (parts[2] !== undefined) {
                variant.stock = parseFloat(parts[2]) || 0;
              }
              return variant;
            });
          } else if (Array.isArray(product.variants)) {
            productData.variants = product.variants;
          }
        }

        // Handle optiongroups
        if (product.optiongroups || product.option_groups) {
          const og = product.optiongroups || product.option_groups;
          if (typeof og === 'string') {
            productData.option_groups = og.split('|').map((g: string) => {
              const parts = g.split(':');
              return { 
                name: parts[0]?.trim() || '', 
                options: (parts[1] || '').split(',').map((o: string) => o.trim())
              };
            });
          } else if (Array.isArray(og)) {
            productData.option_groups = og;
          }
        }

        // Auto-calculate r_v if te and rate are present
        if (productData.te && productData.rate && !productData.r_v) {
          productData.r_v = productData.te * productData.rate;
        }

        // Auto-calculate total if components are present
        if (!productData.total) {
          const rv = productData.r_v || 0;
          const can = productData.can_weight || 0;
          const pack = productData.pack || 0;
          const cong = productData.cong || 0;
          if (rv > 0 || can > 0 || pack > 0 || cong > 0) {
            productData.total = rv + can + pack + cong;
          }
        }

        if (!productData.name) {
          console.log('Skipping product without name');
          continue;
        }

        // Check if product exists by ID first, then by name
        let existingProduct = null;
        
        if (product.id) {
          const { data: byId } = await supabase
            .from('products')
            .select('id')
            .eq('id', product.id)
            .maybeSingle();
          existingProduct = byId;
        }
        
        if (!existingProduct) {
          const { data: byName } = await supabase
            .from('products')
            .select('id')
            .eq('name', productData.name)
            .maybeSingle();
          existingProduct = byName;
        }

        if (existingProduct) {
          // Update existing product
          const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id);

          if (error) {
            console.error('Error updating product:', error);
            failed++;
            errors.push(`Update ${productData.name}: ${error.message}`);
          } else {
            updated++;
            console.log('Updated product:', productData.name);
          }
        } else {
          // Insert new product
          const { error } = await supabase
            .from('products')
            .insert(productData);

          if (error) {
            console.error('Error inserting product:', error);
            failed++;
            errors.push(`Insert ${productData.name}: ${error.message}`);
          } else {
            created++;
            console.log('Created product:', productData.name);
          }
        }
      } catch (productError: any) {
        console.error('Error processing product:', productError);
        failed++;
        errors.push(`Process ${product.name || 'unknown'}: ${productError?.message || 'Unknown error'}`);
      }
    }

    console.log(`Sync complete: ${created} created, ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        created,
        updated,
        failed,
        total: products.length,
        errors: errors.slice(0, 10) // Only return first 10 errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in pull-products-from-sheet:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
