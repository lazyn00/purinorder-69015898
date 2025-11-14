import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

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
  
  const [contactInfo, setContactInfo] = useState({
    fb: "",
    email: "",
    phone: ""
  });
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: "",
    phone: "",
    address: "",
    email: ""
  });
  
  const [selectedMethod, setSelectedMethod] = useState("Vietcombank");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo.phone && !contactInfo.email && !contactInfo.fb) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ít nhất một thông tin liên hệ.",
        variant: "destructive"
      });
      return;
    }
    
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin nhận hàng.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let paymentProofUrl = null;
      
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, paymentProof);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        paymentProofUrl = publicUrl;
      }

      const { error: insertError } = await (supabase as any)
        .from('orders')
        .insert({
          customer_fb: contactInfo.fb || null,
          customer_email: contactInfo.email || null,
          customer_phone: contactInfo.phone,
          delivery_name: deliveryInfo.name,
          delivery_phone: deliveryInfo.phone,
          delivery_address: deliveryInfo.address,
          delivery_email: deliveryInfo.email || null,
          items: cartItems as any,
          total_price: totalPrice,
          payment_method: selectedMethod,
          payment_proof_url: paymentProofUrl
        } as any);

      if (insertError) {
        throw insertError;
      }

      setIsSubmitting(false);
      clearCart();
      
      toast({
        title: "Đặt hàng thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn sớm nhất.",
      });
      
      navigate("/");

    } catch (error) {
      console.error("Error submitting order:", error);
      setIsSubmitting(false);
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại.",
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
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Tiếp tục mua sắm
        </Button>
      
        <form onSubmit={handleSubmitOrder} className="space-y-8">
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thông tin liên hệ</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-fb">Link Facebook / Instagram</Label>
                <Input id="contact-fb" value={contactInfo.fb} onChange={(e) => setContactInfo({...contactInfo, fb: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" type="email" value={contactInfo.email} onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <div>
                <Label htmlFor="contact-phone">Số điện thoại *</Label>
                <Input id="contact-phone" type="tel" value={contactInfo.phone} onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} placeholder="090..." required />
              </div>
              <p className="text-sm text-muted-foreground">* Vui lòng điền ít nhất một thông tin liên hệ</p>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thông tin nhận hàng</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delivery-name">Họ và tên người nhận *</Label>
                <Input id="delivery-name" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} placeholder="Nguyễn Văn A" required />
              </div>
              <div>
                <Label htmlFor="delivery-phone">Số điện thoại nhận hàng *</Label>
                <Input id="delivery-phone" type="tel" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} placeholder="090..." required />
              </div>
              <div>
                <Label htmlFor="delivery-address">Địa chỉ nhận hàng *</Label>
                <Input id="delivery-address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} placeholder="Số nhà, đường, phường, quận, thành phố" required />
              </div>
              <div>
                <Label htmlFor="delivery-email">Email nhận hàng</Label>
                <Input id="delivery-email" type="email" value={deliveryInfo.email} onChange={(e) => setDeliveryInfo({...deliveryInfo, email: e.target.value})} placeholder="email@example.com" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thanh toán</h2>
            <div className="space-y-4">
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

              <div className="bg-muted/50 p-4 rounded-md space-y-1">
                <p className="font-semibold text-lg">Chuyển khoản</p>
                <p>Chủ tài khoản: <span className="font-bold">{PAYMENT_INFO.accountName}</span></p>
                <p>Ngân hàng/Ví: <span className="font-bold">{paymentDetails.label}</span></p>
                <p>Số tài khoản: <span className="font-bold">{paymentDetails.number}</span></p>
              </div>
              
              <div>
                <Label htmlFor="payment-proof">Đăng bill chuyển khoản</Label>
                <Input id="payment-proof" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
                {paymentProof && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <Upload className="inline h-4 w-4 mr-1" />
                    {paymentProof.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Giỏ hàng</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant}`} className="flex items-center gap-4">
                  <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.selectedVariant && <p className="text-sm text-muted-foreground">{item.selectedVariant}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                    <p className="text-sm text-muted-foreground">SL: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>Tổng cộng:</span>
              <span className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <Separator />
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đặt hàng ngay"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
