import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSION = '2.0.0';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`🚀 [v${VERSION}] Starting auto-complete orders job...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    console.log(`📅 [v${VERSION}] Looking for orders changed to "Đang giao" before: ${cutoffDate}`);

    // First, get all orders currently in "Đang giao" status
    const { data: shippingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('order_progress', 'Đang giao')
      .is('deleted_at', null);

    if (ordersError) {
      console.error(`❌ [v${VERSION}] Error fetching shipping orders:`, ordersError);
      throw ordersError;
    }

    if (!shippingOrders || shippingOrders.length === 0) {
      console.log(`📦 [v${VERSION}] No orders in "Đang giao" status`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orders in shipping status',
          count: 0,
          version: VERSION
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 [v${VERSION}] Found ${shippingOrders.length} orders in "Đang giao" status`);

    // Get the status history to find when each order was changed to "Đang giao"
    const orderIds = shippingOrders.map(o => o.id);
    
    const { data: statusHistory, error: historyError } = await supabase
      .from('order_status_history')
      .select('order_id, changed_at')
      .in('order_id', orderIds)
      .eq('field_changed', 'order_progress')
      .eq('new_value', 'Đang giao')
      .order('changed_at', { ascending: false });

    if (historyError) {
      console.error(`❌ [v${VERSION}] Error fetching status history:`, historyError);
      throw historyError;
    }

    // Create a map of order_id -> latest change to "Đang giao"
    const orderShippingDates = new Map<string, string>();
    statusHistory?.forEach(record => {
      // Only keep the most recent change to "Đang giao" for each order
      if (!orderShippingDates.has(record.order_id)) {
        orderShippingDates.set(record.order_id, record.changed_at);
      }
    });

    console.log(`📋 [v${VERSION}] Found status history for ${orderShippingDates.size} orders`);

    // Filter orders that have been in "Đang giao" for more than 7 days
    const ordersToComplete: { id: string; order_number: string | null; shippingDate: string }[] = [];
    
    for (const order of shippingOrders) {
      const shippingDate = orderShippingDates.get(order.id);
      
      if (shippingDate) {
        // Order has history record - check if it's been 7+ days
        if (shippingDate < cutoffDate) {
          ordersToComplete.push({ 
            id: order.id, 
            order_number: order.order_number,
            shippingDate 
          });
          console.log(`  ✓ Order #${order.order_number || order.id.slice(0, 8)} - shipped on ${shippingDate} (eligible)`);
        } else {
          console.log(`  ○ Order #${order.order_number || order.id.slice(0, 8)} - shipped on ${shippingDate} (not yet 7 days)`);
        }
      } else {
        // No history record - this is an older order, use created_at as fallback
        // But log a warning
        console.log(`  ⚠ Order #${order.order_number || order.id.slice(0, 8)} - no status history found, skipping`);
      }
    }

    console.log(`📦 [v${VERSION}] ${ordersToComplete.length} orders eligible for auto-complete`);

    if (ordersToComplete.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orders ready to auto-complete (none have been shipping for 7+ days)',
          count: 0,
          version: VERSION
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update each order to "Đã hoàn thành"
    const orderIdsToUpdate = ordersToComplete.map(order => order.id);
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ order_progress: 'Đã hoàn thành' })
      .in('id', orderIdsToUpdate);

    if (updateError) {
      console.error(`❌ [v${VERSION}] Error updating orders:`, updateError);
      throw updateError;
    }

    // Record the status change in history for each order
    const historyRecords = ordersToComplete.map(order => ({
      order_id: order.id,
      field_changed: 'order_progress',
      old_value: 'Đang giao',
      new_value: 'Đã hoàn thành',
      changed_by: 'auto-complete-job'
    }));

    const { error: historyInsertError } = await supabase
      .from('order_status_history')
      .insert(historyRecords);

    if (historyInsertError) {
      console.error(`⚠ [v${VERSION}] Error recording status history:`, historyInsertError);
      // Don't throw - the main operation succeeded
    }

    console.log(`✅ [v${VERSION}] Successfully auto-completed ${orderIdsToUpdate.length} orders`);
    
    // Log the order numbers for reference
    ordersToComplete.forEach(order => {
      console.log(`  - Order #${order.order_number || order.id.slice(0, 8)} completed (was shipping since ${order.shippingDate})`);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Auto-completed ${orderIdsToUpdate.length} orders`,
        count: orderIdsToUpdate.length,
        orders: ordersToComplete.map(o => o.order_number || o.id.slice(0, 8)),
        version: VERSION
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [v${VERSION}] Error in auto-complete job:`, errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
