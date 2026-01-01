import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting auto-complete orders job...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const cutoffDate = tenDaysAgo.toISOString();

    console.log(`📅 Looking for orders with "Đang giao" status updated before: ${cutoffDate}`);

    // Find orders that are "Đang giao" and haven't been updated in 10 days
    // We use created_at as a proxy since we don't have a status_updated_at column
    // In production, you might want to add a dedicated column for tracking status changes
    const { data: ordersToComplete, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, order_progress, created_at')
      .eq('order_progress', 'Đang giao')
      .is('deleted_at', null)
      .lt('created_at', cutoffDate);

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      throw fetchError;
    }

    console.log(`📦 Found ${ordersToComplete?.length || 0} orders to auto-complete`);

    if (!ordersToComplete || ordersToComplete.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orders to auto-complete',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update each order to "Đã hoàn thành"
    const orderIds = ordersToComplete.map(order => order.id);
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ order_progress: 'Đã hoàn thành' })
      .in('id', orderIds);

    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully auto-completed ${orderIds.length} orders`);
    
    // Log the order numbers for reference
    ordersToComplete.forEach(order => {
      console.log(`  - Order #${order.order_number || order.id.slice(0, 8)} completed`);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Auto-completed ${orderIds.length} orders`,
        count: orderIds.length,
        orders: ordersToComplete.map(o => o.order_number || o.id.slice(0, 8))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in auto-complete job:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
