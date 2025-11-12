// @/pages/Checkout.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// === DÁN URL GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY ===
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/ABC.../exec"; 
// === NHỚ THAY THẾ URL TRÊN ===


export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    fb: "",
    email: "",
    phone: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.phone && !customerInfo.email && !customerInfo.fb) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ít nhất một thông tin liên hệ (SĐT, Email hoặc FB/IG).",
        variant: "destructive"
      });
      return;
    }
    
    // (Kiểm tra nếu URL chưa được thay thế)
    if (GAS_WEB_APP_URL.includes("ABC...")) {
      toast({
        title: "Lỗi cấu hình",
        description: "URL Google Apps Script chưa được thiết lập trong file Checkout.tsx.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      items: cartItems,
      totalPrice: totalPrice,
      customer: customerInfo
    };

    try {
      await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors", 
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Gửi thành công
      setIsSubmitting(false);
      clearCart(); // Xóa giỏ hàng
      toast({
        title: "Đặt hàng thành công!",
        description: "Purin sẽ liên hệ bạn sớm 💛 Cảm ơn bạn!",
      });
      // Chuyển về trang chủ
      navigate("/"); 

    } catch (error) {
      console.error("Error submitting order:", error);
      setIsSubmitting(false);
      toast({
        title: "Gửi đơn hàng thất bại",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ Purin.",
        variant: "destructive"
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
          <p className="text-muted-foreground mb-6">Bạn chưa có sản phẩm nào để đặt hàng.</p>
          <Button onClick={() => navigate("/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại mua sắm
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        {/* Nút quay lại giỏ hàng */}
        <Button
          variant="ghost"
          onClick={() => navigate("/products")} // Hoặc -1 để quay lại
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tiếp tục mua sắm
        </Button>
      
        <form onSubmit={handleSubmitOrder} className="space-y-8">
          {/* 1. Thông tin đặt hàng (Giống ảnh) */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thông tin đặt hàng</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fb">Link Facebook / Instagram *</Label>
                <Input id="fb" value={customerInfo.fb} onChange={handleInputChange} placeholder="https... (cần ít nhất 1 trong 3)" />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={customerInfo.email} onChange={handleInputChange} placeholder="email@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input id="phone" type="tel" value={customerInfo.phone} onChange={handleInputChange} placeholder="090... (ưu tiên SĐT)" required />
              </div>
            </div>
          </div>

          {/* 2. Giỏ hàng (Giống ảnh) */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Giỏ hàng</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant}`} className="flex items-center gap-4">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.selectedVariant && (
                      <p className="text-sm text-muted-foreground">
                        {item.selectedVariant}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                    <p className="text-sm text-muted-foreground">SL: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Tổng cộng (Giống ảnh) */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>Tổng cộng:</span>
              <span className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <Separator />
            <Button
              type="submit"
              className="w-full bg-gradient-primary"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Đặt hàng ngay"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
