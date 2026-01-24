import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all active affiliates
    const { data: affiliates, error: affiliatesError } = await supabase
      .from("affiliates")
      .select("id, name, commission_rate")
      .eq("status", "approved");

    if (affiliatesError) {
      throw affiliatesError;
    }

    const updates: { id: string; name: string; oldRate: number; newRate: number; orderCount: number }[] = [];

    for (const affiliate of affiliates || []) {
      // Count orders for this affiliate in current month
      const { count, error: countError } = await supabase
        .from("affiliate_orders")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliate.id)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      if (countError) {
        console.error(`Error counting orders for affiliate ${affiliate.id}:`, countError);
        continue;
      }

      const orderCount = count || 0;
      let newRate = 10; // Default 10%

      if (orderCount >= 50) {
        newRate = 30; // 30% for 50+ orders
      } else if (orderCount >= 20) {
        newRate = 20; // 20% for 20+ orders
      }

      // Only update if rate changed
      if (newRate !== affiliate.commission_rate) {
        const { error: updateError } = await supabase
          .from("affiliates")
          .update({ 
            commission_rate: newRate,
            updated_at: new Date().toISOString()
          })
          .eq("id", affiliate.id);

        if (updateError) {
          console.error(`Error updating affiliate ${affiliate.id}:`, updateError);
        } else {
          updates.push({
            id: affiliate.id,
            name: affiliate.name,
            oldRate: affiliate.commission_rate,
            newRate,
            orderCount
          });
        }
      }
    }

    console.log(`Updated ${updates.length} affiliate commission rates`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã cập nhật ${updates.length} CTV`,
        updates,
        totalAffiliates: affiliates?.length || 0,
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error updating affiliate commissions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
