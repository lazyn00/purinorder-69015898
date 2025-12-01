import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, Facebook } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext"; // Import CartItem

const PAYMENT_INFO = {
  accountName: "BUI THANH NHU Y",
  vietcombank: "0441000787416",
  momo: "0931146787",
  zalopay: "0931146787"
};

// === HÀM HELPER: LẤY ẢNH THEO VARIANT ===
const getVariantImage = (item: CartItem) => {
  if (item.selectedVariant && item.variantImageMap) {
    const imageIndex = item.variantImageMap[item.selectedVariant];
    if (imageIndex !== undefined && item.images[imageIndex]) {
      return item.images[imageIndex];
    }
  }
  return item.images[0]; // Trả về ảnh đầu tiên nếu không tìm thấy
};
// === KẾT THÚC HÀM HELPER ===

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
    note: ""
  });
  
  const [selectedMethod, setSelectedMethod] = useState("Vietcombank");
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo.fb || !contactInfo.email || !contactInfo.phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ tất cả thông tin liên hệ.",
        variant: "destructive"
      });
      return;
    }
    
    // Nếu số điện thoại nhận hàng khác với số liên lạc thì phải điền
    if (deliveryInfo.phone && deliveryInfo.phone !== contactInfo.phone) {
      // Có điền số khác -> kiểm tra đầy đủ thông tin nhận hàng
      if (!deliveryInfo.name || !deliveryInfo.address) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin nhận hàng.",
          variant: "destructive"
        });
        return;
      }
    } else if (!deliveryInfo.phone) {
      // Không điền số nhận hàng -> dùng số liên lạc, nhưng vẫn cần tên và địa chỉ
      if (!deliveryInfo.name || !deliveryInfo.address) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin nhận hàng.",
          variant: "destructive"
        });
        return;
      }
    } else {
      // deliveryInfo.phone === contactInfo.phone -> dùng chung, cần tên và địa chỉ
      if (!deliveryInfo.name || !deliveryInfo.address) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin nhận hàng.",
          variant: "destructive"
        });
        return;
      }
    }

    if (!paymentProof) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng bill chuyển khoản trước khi đặt hàng.",
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

      // Generate order number #PO + YYYYMMDD + sequential number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `PO${dateStr}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;


      // Sử dụng số điện thoại liên lạc nếu không điền số nhận hàng
      const finalDeliveryPhone = deliveryInfo.phone || contactInfo.phone;

      const { error: insertError } = await (supabase as any)
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_fb: contactInfo.fb,
          customer_email: contactInfo.email,
          customer_phone: contactInfo.phone,
          delivery_name: deliveryInfo.name,
          delivery_phone: finalDeliveryPhone,
          delivery_address: deliveryInfo.address,
          delivery_note: deliveryInfo.note,
          items: cartItems as any,
          total_price: totalPrice,
          payment_method: selectedMethod,
          payment_type: paymentType,
          payment_proof_url: paymentProofUrl,
          payment_status: paymentType === 'deposit' ? 'Đã cọc' : 'Chưa thanh toán',
          order_progress: 'Đang xử lý'
        } as any);

      if (insertError) {
        throw insertError;
      }

      // Sync to Google Sheets
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-order-to-sheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            order: {
              id: orderNumber,
              order_number: orderNumber,
              created_at: new Date().toISOString(),
              customer_fb: contactInfo.fb,
              customer_email: contactInfo.email,
              customer_phone: contactInfo.phone,
              delivery_name: deliveryInfo.name,
              delivery_phone: finalDeliveryPhone,
              delivery_address: deliveryInfo.address,
              delivery_note: deliveryInfo.note,
              items: cartItems,
              total_price: totalPrice,
              payment_method: selectedMethod,
              payment_type: paymentType,
              payment_proof_url: paymentProofUrl,
              payment_status: paymentType === 'deposit' ? 'Đã cọc' : 'Chưa thanh toán',
              order_progress: 'Đang xử lý'
            }
          })
        }).catch(err => {
          console.warn('Failed to sync to Google Sheets:', err);
        });
      } catch (syncError) {
        console.warn('Google Sheets sync error:', syncError);
      }

      // Send order confirmation email
      try {
        await supabase.functions.invoke('send-order-email', {
          body: {
            email: contactInfo.email,
            orderNumber: orderNumber,
            customerName: deliveryInfo.name,
            items: cartItems.map(item => ({
              name: item.name,
              variant: item.selectedVariant,
              quantity: item.quantity,
              price: item.price
            })),
            totalPrice: totalPrice,
            status: paymentType === 'deposit' ? 'Đã cọc' : 'Chưa thanh toán',
            paymentStatus: paymentType === 'deposit' ? 'Đã cọc' : 'Chưa thanh toán',
            orderProgress: 'Đang xử lý',
            type: 'new_order',
            deliveryAddress: deliveryInfo.address
          }
        });
      } catch (emailError) {
        console.warn('Failed to send confirmation email:', emailError);
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
                <Label htmlFor="contact-fb">Link Facebook / Instagram *</Label>
                <Input id="contact-fb" value={contactInfo.fb} onChange={(e) => setContactInfo({...contactInfo, fb: e.target.value})} placeholder="https://..." required />
              </div>
              <div>
                <Label htmlFor="contact-email">Email *</Label>
                <Input id="contact-email" type="email" value={contactInfo.email} onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})} placeholder="email@example.com" required />
              </div>
              <div>
                <Label htmlFor="contact-phone">Số điện thoại *</Label>
                <Input id="contact-phone" type="tel" value={contactInfo.phone} onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} placeholder="090..." required />
              </div>
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
                <Label htmlFor="delivery-phone">Số điện thoại nhận hàng {contactInfo.phone && "(Bỏ trống nếu giống SĐT liên lạc)"}</Label>
                <Input 
                  id="delivery-phone" 
                  type="tel" 
                  value={deliveryInfo.phone} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} 
                  placeholder={contactInfo.phone || "090..."} 
                />
              </div>
              <div>
                <Label htmlFor="delivery-address">Địa chỉ nhận hàng *</Label>
                <Input id="delivery-address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} placeholder="Số nhà, đường, phường, quận, thành phố" required />
              </div>
              <div>
                <Label htmlFor="delivery-note">Ghi chú (Tùy chọn)</Label>
                <Textarea 
                  id="delivery-note" 
                  value={deliveryInfo.note} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, note: e.target.value})} 
                  placeholder="Ví dụ: Giao ngoài giờ hành chính, gọi trước khi giao..."
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thanh toán</h2>
            <div className="space-y-6">
              <div>
                <Label className="font-semibold mb-3 block">Hình thức thanh toán</Label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentType" 
                      value="full" 
                      checked={paymentType === 'full'} 
                      onChange={(e) => setPaymentType(e.target.value as "full")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Thanh toán đủ 100% ({totalPrice.toLocaleString('vi-VN')}đ)</div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentType" 
                      value="deposit" 
                      checked={paymentType === 'deposit'} 
                      onChange={(e) => setPaymentType(e.target.value as "deposit")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Đặt cọc 50% ({(totalPrice * 0.5).toLocaleString('vi-VN')}đ) - Hẹn hoàn cọc trong 1 tháng</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod" className="font-semibold">Chọn phương thức thanh toán</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger id="paymentMethod" className="mt-2">
                    <SelectValue placeholder="Chọn ngân hàng/ví điện tử" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ngân hàng">Ngân hàng</SelectItem>
                    <SelectItem value="Momo">Momo</SelectItem>
                    <SelectItem value="Zalopay">Zalopay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">Chuyển khoản</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = `${PAYMENT_INFO.accountName}\n${paymentDetails.label}: ${paymentDetails.number}`;
                      navigator.clipboard.writeText(text);
                      toast({
                        title: "Đã copy",
                        description: "Thông tin chuyển khoản đã được copy vào clipboard"
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p>Chủ tài khoản: <span className="font-bold">{PAYMENT_INFO.accountName}</span></p>
                <p>Ngân hàng/Ví: <span className="font-bold">{paymentDetails.label}</span></p>
                <p>Số tài khoản: <span className="font-bold">{paymentDetails.number}</span></p>
              </div>
              
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 bg-primary/5">
                <Label htmlFor="payment-proof" className="font-semibold text-lg mb-3 block">Đăng bill chuyển khoản *</Label>
                <Input 
                  id="payment-proof" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  required
                  className="cursor-pointer"
                />
                {paymentProof && (
                  <div className="mt-3 p-3 bg-background rounded-md flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{paymentProof.name}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">* Bắt buộc gửi bill trước khi bấm đặt hàng ngay</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Giỏ hàng</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant}`} className="flex items-center gap-4">
                  <img src={getVariantImage(item)} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-medium">x{item.quantity} {item.name}</p>
                    {item.selectedVariant && <p className="text-sm text-muted-foreground">{item.selectedVariant}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-6 bg-accent/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Facebook className="h-5 w-5 text-primary" />
              Theo dõi đơn hàng của bạn
            </h2>
            <p className="text-muted-foreground mb-4">
              Tham gia group Facebook để cập nhật tiến độ đơn hàng, nhận thông báo mới nhất và kết nối với cộng đồng!
            </p>
            <a 
              href="https://www.facebook.com/groups/1142581477955556/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="outline" className="w-full gap-2">
                <Facebook className="h-4 w-4" />
                Tham gia group theo dõi đơn hàng
              </Button>
            </a>
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
