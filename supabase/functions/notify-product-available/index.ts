import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  productId: number;
  productName: string;
  productUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, productUrl }: NotificationRequest = await req.json();

    console.log("Sending notifications for product:", productId);

    // Tạo Supabase client với service role key để có quyền admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lấy danh sách email chưa được thông báo
    const { data: notifications, error: fetchError } = await supabase
      .from('product_notifications')
      .select('id, email')
      .eq('product_id', productId)
      .eq('notified', false);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No notifications to send" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${notifications.length} emails to notify`);

    // Gửi email cho từng người đăng ký
    const emailPromises = notifications.map(async (notification) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "Product Notification <onboarding@resend.dev>",
          to: [notification.email],
          subject: `${productName} đã có hàng trở lại!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">
                Sản phẩm đã có hàng! 🎉
              </h1>
              
              <p style="font-size: 16px; color: #555;">
                Sản phẩm <strong>${productName}</strong> mà bạn đăng ký theo dõi đã có hàng trở lại!
              </p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: bold;">
                  ${productName}
                </p>
              </div>
              
              <a href="${productUrl}" 
                 style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">
                Xem sản phẩm ngay
              </a>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                Nhanh tay đặt hàng trước khi hết nhé!
              </p>
              
              <p style="margin-top: 30px;">
                Trân trọng,<br><strong>Purin Order</strong>
              </p>
            </div>
          `,
        });

        console.log(`Email sent to ${notification.email}:`, emailResponse);

        // Cập nhật trạng thái đã thông báo
        await supabase
          .from('product_notifications')
          .update({ 
            notified: true, 
            notified_at: new Date().toISOString() 
          })
          .eq('id', notification.id);

        return { success: true, email: notification.email };
      } catch (error) {
        console.error(`Failed to send to ${notification.email}:`, error);
        return { success: false, email: notification.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount} out of ${notifications.length} notifications`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-product-available function:", error);
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
