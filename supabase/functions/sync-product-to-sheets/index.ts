import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { product, action } = await req.json();
    
    console.log(`Syncing product to sheets - Action: ${action}, Product:`, product?.name);

    const webhookUrl = Deno.env.get('GOOGLE_SHEETS_WEBHOOK');
    
    if (!webhookUrl) {
      console.error('GOOGLE_SHEETS_WEBHOOK not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format data for Google Sheets
    const sheetData = {
      type: 'product', // To distinguish from order sync
      action: action, // 'create', 'update', 'delete'
      data: {
        id: product.id,
        name: product.name,
        te: product.te || '',
        rate: product.rate || '',
        r_v: product.r_v || '',
        can_weight: product.can_weight || '',
        pack: product.pack || '',
        cong: product.cong || '',
        total: product.total || '',
        price: product.price || '',
        fees_included: product.fees_included ?? true,
        category: product.category || '',
        subcategory: product.subcategory || '',
        artist: product.artist || '',
        status: product.status || 'Sẵn',
        order_deadline: product.order_deadline || '',
        images: JSON.stringify(product.images || []),
        description: product.description || '',
        production_time: product.production_time || '',
        master: product.master || '',
        variants: JSON.stringify(product.variants || []),
        option_groups: JSON.stringify(product.option_groups || []),
        variant_image_map: JSON.stringify(product.variant_image_map || {}),
        stock: product.stock || '',
        link_order: product.link_order || '',
        proof: product.proof || '',
        actual_rate: product.actual_rate || '',
        actual_can: product.actual_can || '',
        actual_pack: product.actual_pack || '',
        deposit_allowed: product.deposit_allowed ?? true,
      }
    };

    console.log('Sending to webhook:', sheetData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sheetData),
    });

    const responseText = await response.text();
    console.log('Webhook response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} - ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Product synced to sheets' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error syncing product to sheets:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
