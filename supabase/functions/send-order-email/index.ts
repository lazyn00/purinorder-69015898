import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  email: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    variant: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: string;
  type: 'new_order' | 'status_change' | 'refund';
  deliveryAddress?: string;
  trackingCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      orderNumber, 
      customerName, 
      items, 
      totalPrice, 
      status,
      type,
      deliveryAddress,
      trackingCode 
    }: OrderEmailRequest = await req.json();

    console.log("Sending order email:", { email, orderNumber, type });

    let subject = "";
    let htmlContent = "";

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.variant}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('vi-VN')}đ</td>
      </tr>
    `).join('');

    if (type === 'new_order') {
      subject = `Xác nhận đơn hàng #${orderNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">Đơn hàng của bạn đã được ghi nhận!</h1>
          
          <p>Xin chào <strong>${customerName}</strong>,</p>
          
          <p>Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được ghi nhận và đang được xử lý.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> ${orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Trạng thái:</strong> ${status}</p>
            ${deliveryAddress ? `<p style="margin: 5px 0;"><strong>Địa chỉ giao hàng:</strong> ${deliveryAddress}</p>` : ''}
          </div>
          
          <h2 style="color: #333; margin-top: 30px;">Chi tiết đơn hàng:</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Sản phẩm</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Phân loại</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Số lượng</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px;">Tổng cộng:</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px; color: #4CAF50;">${totalPrice.toLocaleString('vi-VN')}đ</td>
              </tr>
            </tfoot>
          </table>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Chúng tôi sẽ gửi email thông báo khi có cập nhật về đơn hàng của bạn.
          </p>
          
          <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ hỗ trợ</strong></p>
        </div>
      `;
    } else if (type === 'status_change') {
      subject = `Cập nhật trạng thái đơn hàng #${orderNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 3px solid #2196F3; padding-bottom: 10px;">Cập nhật đơn hàng</h1>
          
          <p>Xin chào <strong>${customerName}</strong>,</p>
          
          <p>Đơn hàng #${orderNumber} của bạn đã được cập nhật trạng thái.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <p style="margin: 5px 0; font-size: 18px;"><strong>Trạng thái mới:</strong> <span style="color: #2196F3;">${status}</span></p>
            ${trackingCode ? `<p style="margin: 5px 0;"><strong>Mã vận đơn:</strong> ${trackingCode}</p>` : ''}
          </div>
          
          <h2 style="color: #333; margin-top: 30px;">Chi tiết đơn hàng:</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Sản phẩm</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Phân loại</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Số lượng</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ hỗ trợ</strong></p>
        </div>
      `;
    } else if (type === 'refund') {
      subject = `Thông báo hoàn cọc đơn hàng #${orderNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 3px solid #FF9800; padding-bottom: 10px;">Thông báo hoàn cọc</h1>
          
          <p>Xin chào <strong>${customerName}</strong>,</p>
          
          <p>Chúng tôi đã xử lý hoàn cọc cho đơn hàng #${orderNumber} của bạn.</p>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF9800;">
            <p style="margin: 5px 0; font-size: 16px;"><strong>Trạng thái:</strong> ${status}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Số tiền:</strong> <span style="color: #FF9800; font-size: 18px;">${totalPrice.toLocaleString('vi-VN')}đ</span></p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Vui lòng kiểm tra tài khoản của bạn. Nếu có bất kỳ thắc mắc nào, hãy liên hệ với chúng tôi.
          </p>
          
          <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ hỗ trợ</strong></p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Order System <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
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
