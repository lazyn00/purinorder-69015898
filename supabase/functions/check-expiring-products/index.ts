import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Product {
  id: number;
  name: string;
  order_deadline: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body for optional parameters
    let daysBeforeExpiry = 3; // Default 3 days
    let adminEmail = "";
    let sendEmail = false;

    try {
      const body = await req.json();
      if (body.daysBeforeExpiry) daysBeforeExpiry = body.daysBeforeExpiry;
      if (body.adminEmail) adminEmail = body.adminEmail;
      if (body.sendEmail) sendEmail = body.sendEmail;
    } catch {
      // No body provided, use defaults
    }

    // Calculate the date threshold
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);

    console.log(`Checking for products expiring before: ${thresholdDate.toISOString()}`);

    // Fetch products with order_deadline within the threshold
    const { data: expiringProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, name, order_deadline, status")
      .not("order_deadline", "is", null)
      .gte("order_deadline", now.toISOString())
      .lte("order_deadline", thresholdDate.toISOString())
      .neq("status", "Hết")
      .order("order_deadline", { ascending: true });

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringProducts?.length || 0} expiring products`);

    // Also get products that are already expired but not marked as "Hết"
    const { data: expiredProducts, error: expiredError } = await supabase
      .from("products")
      .select("id, name, order_deadline, status")
      .not("order_deadline", "is", null)
      .lt("order_deadline", now.toISOString())
      .neq("status", "Hết")
      .order("order_deadline", { ascending: true });

    if (expiredError) {
      console.error("Error fetching expired products:", expiredError);
    }

    const result = {
      expiringProducts: expiringProducts || [],
      expiredProducts: expiredProducts || [],
      checkedAt: now.toISOString(),
      thresholdDate: thresholdDate.toISOString(),
      emailSent: false
    };

    // Send email notification if requested and there are products to notify about
    if (sendEmail && adminEmail && resendApiKey && (result.expiringProducts.length > 0 || result.expiredProducts.length > 0)) {
      try {
        const resend = new Resend(resendApiKey);

        const formatDate = (dateStr: string) => {
          return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        };

        let emailContent = `
          <h2>🍮 Purin Order - Thông báo sản phẩm sắp hết hạn</h2>
          <p>Thời gian kiểm tra: ${formatDate(now.toISOString())}</p>
        `;

        if (result.expiredProducts.length > 0) {
          emailContent += `
            <h3 style="color: #dc2626;">⚠️ Sản phẩm đã hết hạn (${result.expiredProducts.length})</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr style="background-color: #fee2e2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sản phẩm</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hạn order</th>
              </tr>
              ${result.expiredProducts.map(p => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; color: #dc2626;">${formatDate(p.order_deadline)}</td>
                </tr>
              `).join('')}
            </table>
          `;
        }

        if (result.expiringProducts.length > 0) {
          emailContent += `
            <h3 style="color: #f59e0b;">⏰ Sản phẩm sắp hết hạn trong ${daysBeforeExpiry} ngày (${result.expiringProducts.length})</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr style="background-color: #fef3c7;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sản phẩm</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hạn order</th>
              </tr>
              ${result.expiringProducts.map(p => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; color: #f59e0b;">${formatDate(p.order_deadline)}</td>
                </tr>
              `).join('')}
            </table>
          `;
        }

        emailContent += `
          <p style="margin-top: 20px; color: #666;">
            Email này được gửi tự động từ hệ thống Purin Order.
          </p>
        `;

        await resend.emails.send({
          from: "Purin Order <noreply@lovable.app>",
          to: [adminEmail],
          subject: `[Purin Order] ${result.expiredProducts.length > 0 ? '⚠️ Có sản phẩm đã hết hạn' : '⏰ Sản phẩm sắp hết hạn'}`,
          html: emailContent,
        });

        result.emailSent = true;
        console.log(`Email sent to ${adminEmail}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in check-expiring-products function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
