// @/pages/Checkout.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react"; 
import { Separator } from "@/components/ui/separator";

// === DÁN URL GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY (Bước 3) ===
const GAS_WEB_APP_URL = "DÁN_URL_APPS_SCRIPT_CỦA_BẠN_VÀO_ĐÂY"; // <<< CẦN THAY THẾ
// === URL GOOGLE FORM (Dùng để chuyển hướng sau khi gửi Apps Script) ===
const GOOGLE_FORM_URL = "https://forms.gle/tTcYYvFw3BjzER8QA";

// === THÔNG TIN THANH TOÁN TĨNH ===
const PAYMENT_INFO = {
    accountName: "BUI THANH NHU Y",
    vietcombank: "BNTY25",
    momo: "0931146787",
    zalopay: "0931146787"
};


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
  
  const [selectedMethod, setSelectedMethod] = useState("Vietcombank");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!customerInfo.phone && !customerInfo.email && !customerInfo.fb) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ít nhất một thông tin liên hệ (SĐT, Email hoặc FB/IG).",
        variant: "destructive"
      });
      return;
    }
    
    // Kiểm tra cấu hình Apps Script
    if (GAS_WEB_APP_URL.includes("DÁN_URL_APPS_SCRIPT_CỦA_BẠN_VÀO_ĐÂY")) {
      toast({
        title: "Lỗi cấu hình",
        description: "URL Google Apps Script chưa được thiết lập trong code.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      items: cartItems,
      totalPrice: totalPrice,
      customer: customerInfo,
      paymentMethod: selectedMethod, // Thêm phương thức thanh toán vào payload
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
        title: "Đơn hàng đã được ghi lại!",
        description: "Vui lòng điền nốt thông tin trên Google Form.",
      });
      
      // Chuyển hướng sang Google Form
      window.location.href = GOOGLE_FORM_URL;

    } catch (error) {
      console.error("Error submitting order:", error);
      setIsSubmitting(false);
      toast({
        title: "Lỗi mạng",
        description: "Đã có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  const getPaymentDetails = () => {
      switch (selectedMethod) {
          case 'Vietcombank':
              return { label: "Vietcombank", number: PAYMENT_INFO.vietcombank };
          case 'Momo':
              return { label: "Momo", number: PAYMENT_INFO.momo };
          case 'Zalopay':
              return { label: "Zalopay", number: PAYMENT_INFO.zalopay };
          default:
              return { label: "Vietcombank", number: PAYMENT_INFO.vietcombank };
      }
  };
  
  const paymentDetails = getPaymentDetails();

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
        {/* Nút quay lại mua sắm */}
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tiếp tục mua sắm
        </Button>
      
        <form onSubmit={handleSubmitOrder} className="space-y-8">
          
          {/* 1. Thông tin liên hệ */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thông tin liên hệ</h2>
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

          {/* 2. Thông tin Thanh toán */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thanh toán</h2>
            <div className="space-y-4">
                
                {/* Chọn phương thức */}
                <div>
                    <Label htmlFor="paymentMethod" className="font-semibold">Chọn phương thức thanh toán</Label>
                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                        <SelectTrigger id="paymentMethod" className="mt-2">
                            <SelectValue placeholder="Chọn ngân hàng/ví điện tử" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Vietcombank">Vietcombank</SelectItem>
                            <SelectItem value="Momo">Momo</SelectItem>
                            <SelectItem value="Zalopay">Zalopay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Chi tiết chuyển khoản */}
                <div className="bg-muted/50 p-4 rounded-md space-y-1">
                    <p className="font-semibold text-lg">Chuyển khoản</p>
                    <p>Chủ tài khoản: <span className="font-bold">{PAYMENT_INFO.accountName}</span></p>
                    {/* === SỬA TẠI ĐÂY: XÓA text-primary === */}
                    <p>Ngân hàng/Ví: <span className="font-bold">{paymentDetails.label}</span></p>
                    <p>Số tài khoản: <span className="font-bold">{paymentDetails.number}</span></p>
                    <p className="pt-2 text-sm text-amber-600">
                        *Vui lòng kiểm tra kỹ số tiền và chuyển khoản trước khi nhấn "Đặt hàng ngay".
                    </p>
                </div>
            </div>
          </div>


          {/* 3. Giỏ hàng */}
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

          {/* 4. Tổng cộng */}
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
                 "Đặt hàng ngay (Ghi lại đơn)"
               )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
