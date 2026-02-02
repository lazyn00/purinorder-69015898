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

// Email mặc định của admin
const DEFAULT_ADMIN_EMAIL = "ppurin.order@gmail.com";
// Số ngày mặc định để cảnh báo
const DEFAULT_DAYS_BEFORE_EXPIRY = 7;

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
    let daysBeforeExpiry = DEFAULT_DAYS_BEFORE_EXPIRY;
    let adminEmail = DEFAULT_ADMIN_EMAIL;
    let sendEmail = true; // Mặc định gửi email
    let createNotifications = true; // Mặc định tạo thông báo trong admin

    try {
      const body = await req.json();
      if (body.daysBeforeExpiry !== undefined) daysBeforeExpiry = body.daysBeforeExpiry;
      if (body.adminEmail) adminEmail = body.adminEmail;
      if (body.sendEmail !== undefined) sendEmail = body.sendEmail;
      if (body.createNotifications !== undefined) createNotifications = body.createNotifications;
    } catch {
      // No body provided, use defaults
    }

    // Calculate the date threshold
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);

    console.log(`Checking for products expiring before: ${thresholdDate.toISOString()}`);
    console.log(`Days before expiry: ${daysBeforeExpiry}, Admin email: ${adminEmail}`);

    // Fetch products with order_deadline within the threshold (expiring soon)
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
      emailSent: false,
      notificationsCreated: 0
    };

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getDaysUntilExpiry = (deadline: string) => {
      const deadlineDate = new Date(deadline);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // Create admin notifications for expiring products
    if (createNotifications && (result.expiringProducts.length > 0 || result.expiredProducts.length > 0)) {
      const notifications = [];
      
      // Generate proper UUID for product notifications
      const generateProductNotificationId = (productId: number, type: string) => {
        // Use crypto.randomUUID() for unique IDs
        return crypto.randomUUID();
      };

      // Notifications for expired products
      for (const product of result.expiredProducts) {
        notifications.push({
          type: 'product_expired',
          order_id: generateProductNotificationId(product.id, 'expired'),
          order_number: `SP-${product.id}`,
          message: `⚠️ Sản phẩm "${product.name}" đã hết hạn order từ ${formatDate(product.order_deadline)}`,
          is_read: false
        });
      }

      // Notifications for expiring soon products
      for (const product of result.expiringProducts) {
        const daysLeft = getDaysUntilExpiry(product.order_deadline);
        notifications.push({
          type: 'product_expiring',
          order_id: generateProductNotificationId(product.id, 'expiring'),
          order_number: `SP-${product.id}`,
          message: `⏰ Sản phẩm "${product.name}" sắp hết hạn order (còn ${daysLeft} ngày - ${formatDate(product.order_deadline)})`,
          is_read: false
        });
      }

      if (notifications.length > 0) {
        // Check existing notifications to avoid duplicates (within last 24 hours)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: existingNotifs } = await supabase
          .from('admin_notifications')
          .select('order_number, type')
          .in('order_number', notifications.map(n => n.order_number))
          .in('type', ['product_expired', 'product_expiring'])
          .gte('created_at', oneDayAgo);

        const existingKeys = new Set(existingNotifs?.map(n => `${n.order_number}_${n.type}`) || []);
        const newNotifications = notifications.filter(n => !existingKeys.has(`${n.order_number}_${n.type}`));

        if (newNotifications.length > 0) {
          const { error: insertError } = await supabase
            .from('admin_notifications')
            .insert(newNotifications);

          if (insertError) {
            console.error("Error creating notifications:", insertError);
          } else {
            result.notificationsCreated = newNotifications.length;
            console.log(`Created ${newNotifications.length} admin notifications`);
          }
        } else {
          console.log("No new notifications to create (duplicates found within 24h)");
        }
      }
    }

    // Send email notification if requested and there are products to notify about
    if (sendEmail && adminEmail && resendApiKey && (result.expiringProducts.length > 0 || result.expiredProducts.length > 0)) {
      try {
        const resend = new Resend(resendApiKey);

        let emailContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f472b6;">🍮 Purin Order - Thông báo sản phẩm</h2>
            <p style="color: #666;">Thời gian kiểm tra: ${formatDate(now.toISOString())}</p>
        `;

        if (result.expiredProducts.length > 0) {
          emailContent += `
            <h3 style="color: #dc2626; margin-top: 24px;">⚠️ Sản phẩm đã hết hạn (${result.expiredProducts.length})</h3>
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
              <tr style="background-color: #fee2e2;">
                <th style="border: 1px solid #fecaca; padding: 12px; text-align: left;">Sản phẩm</th>
                <th style="border: 1px solid #fecaca; padding: 12px; text-align: left;">Hạn order</th>
              </tr>
              ${result.expiredProducts.map(p => `
                <tr>
                  <td style="border: 1px solid #fecaca; padding: 12px;">${p.name}</td>
                  <td style="border: 1px solid #fecaca; padding: 12px; color: #dc2626; font-weight: bold;">${formatDate(p.order_deadline)}</td>
                </tr>
              `).join('')}
            </table>
          `;
        }

        if (result.expiringProducts.length > 0) {
          emailContent += `
            <h3 style="color: #f59e0b; margin-top: 24px;">⏰ Sản phẩm sắp hết hạn trong ${daysBeforeExpiry} ngày (${result.expiringProducts.length})</h3>
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
              <tr style="background-color: #fef3c7;">
                <th style="border: 1px solid #fde68a; padding: 12px; text-align: left;">Sản phẩm</th>
                <th style="border: 1px solid #fde68a; padding: 12px; text-align: left;">Hạn order</th>
                <th style="border: 1px solid #fde68a; padding: 12px; text-align: left;">Còn lại</th>
              </tr>
              ${result.expiringProducts.map(p => {
                const daysLeft = getDaysUntilExpiry(p.order_deadline);
                return `
                  <tr>
                    <td style="border: 1px solid #fde68a; padding: 12px;">${p.name}</td>
                    <td style="border: 1px solid #fde68a; padding: 12px; color: #f59e0b;">${formatDate(p.order_deadline)}</td>
                    <td style="border: 1px solid #fde68a; padding: 12px; color: #f59e0b; font-weight: bold;">${daysLeft} ngày</td>
                  </tr>
                `;
              }).join('')}
            </table>
          `;
        }

        emailContent += `
            <p style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px; color: #666; font-size: 14px;">
              📌 Vui lòng kiểm tra và cập nhật trạng thái sản phẩm trong trang quản trị.<br>
              Email này được gửi tự động từ hệ thống Purin Order.
            </p>
          </div>
        `;

        await resend.emails.send({
          from: "Purin Order <noreply@lovable.app>",
          to: [adminEmail],
          subject: `[Purin Order] ${result.expiredProducts.length > 0 ? '⚠️ Có sản phẩm đã hết hạn' : '⏰ Sản phẩm sắp hết hạn'} - ${result.expiredProducts.length + result.expiringProducts.length} sản phẩm`,
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
