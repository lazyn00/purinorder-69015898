import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const PAYMENT_INFO = {
  accountName: "BUI THANH NHU Y",
  vietcombank: "0441000787416",
  momo: "0931146787",
  zalopay: "0931146787"
};

const getVariantImage = (item: CartItem) => {
  if (item.selectedVariant && item.variantImageMap) {
    const imageIndex = item.variantImageMap[item.selectedVariant];
    if (imageIndex !== undefined && item.images[imageIndex]) {
      return item.images[imageIndex];
    }
  }
  return item.images[0]; 
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
    note: ""
  });
  
  const [selectedMethod, setSelectedMethod] = useState("Vietcombank");
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      if (contactInfo.phone.length >= 10) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('delivery_name, delivery_phone, delivery_address')
            .or(`customer_phone.eq.${contactInfo.phone},delivery_phone.eq.${contactInfo.phone}`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0) {
            const prevOrder = data[0];
            setDeliveryInfo(prev => ({
              name: prev.name || prevOrder.delivery_name || "",
              phone: prev.phone || prevOrder.delivery_phone || "",
              address: prev.address || prevOrder.delivery_address || "",
              note: prev.note || ""
            }));
            toast({
              title: "Đã tự động điền thông tin",
              description: "Thông tin nhận hàng từ lần đặt trước đã được điền.",
            });
          }
        } catch (error) {
          console.error("Error fetching delivery info:", error);
        }
      }
    };

    fetchDeliveryInfo();
  }, [contactInfo.phone]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo.fb || !contactInfo.email || !contactInfo.phone) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ tất cả thông tin liên hệ.", variant: "destructive" });
      return;
    }
    
    if (deliveryInfo.phone && deliveryInfo.phone !== contactInfo.phone) {
      if (!deliveryInfo.name || !deliveryInfo.address) {
        toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhận hàng.", variant: "destructive" });
        return;
      }
    } else if (!deliveryInfo.phone) {
      if (!deliveryInfo.name || !deliveryInfo.address) {
        toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhận hàng.", variant: "destructive" });
        return;
      }
    } else {
      if (!deliveryInfo.name || !deliveryInfo.address) {
        toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhận hàng.", variant: "destructive" });
        return;
      }
    }

    if (!paymentProof) {
      toast({ title: "Lỗi", description: "Vui lòng đăng bill chuyển khoản trước khi đặt hàng.", variant: "destructive" });
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

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        paymentProofUrl = publicUrl;
      }

      // --- LOGIC TRẠNG THÁI THANH TOÁN MỚI ---
      // Nếu là cọc -> Đang xác nhận cọc
      // Nếu là full -> Đang xác nhận thanh toán
      const initialPaymentStatus = paymentType === 'deposit' 
        ? 'Đang xác nhận cọc' 
        : 'Đang xác nhận thanh toán';

      const masterGroups: { [key: string]: typeof cartItems } = {};
      
      cartItems.forEach(item => {
        const master = item.master || "no_master";
        if (!masterGroups[master]) masterGroups[master] = [];
        masterGroups[master].push(item);
      });

      const masterKeys = Object.keys(masterGroups);
      const orderNumbers: string[] = [];

      for (const master of masterKeys) {
        const groupItems = masterGroups[master];
        const groupTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const orderNumber = `PO${dateStr}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        orderNumbers.push(orderNumber);

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
            items: groupItems as any,
            total_price: groupTotal,
            payment_method: selectedMethod,
            payment_type: paymentType,
            payment_proof_url: paymentProofUrl,
            // SỬ DỤNG TRẠNG THÁI ĐÃ CẬP NHẬT
            payment_status: initialPaymentStatus,
            order_progress: 'Đang xử lý'
          } as any);

        if (insertError) throw insertError;

        try {
          for (const item of groupItems) {
            if (item.selectedVariant) {
              const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('variants')
                .eq('id', item.id)
                .single();

              if (!fetchError && product) {
                const updatedVariants = (product.variants as any[]).map((v: any) => {
                  if (v.name === item.selectedVariant && v.stock !== undefined) {
                    return { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) };
                  }
                  return v;
                });

                await supabase.from('products').update({ variants: updatedVariants }).eq('id', item.id);
              }
            } else if (item.stock !== undefined) {
              await supabase.from('products').update({ stock: Math.max(0, (item.stock || 0) - item.quantity) }).eq('id', item.id);
            }
          }
        } catch (stockError) {
          console.warn('Không thể cập nhật tồn kho:', stockError);
        }

        // Send Email
        try {
          await supabase.functions.invoke('send-order-email', {
            body: {
              email: contactInfo.email,
              orderNumber: orderNumber,
              customerName: deliveryInfo.name,
              items: groupItems.map(item => ({
                name: item.name,
                variant: item.selectedVariant,
                quantity: item.quantity,
                price: item.price
              })),
              totalPrice: groupTotal,
              status: initialPaymentStatus, // Gửi trạng thái mới vào email
              paymentStatus: initialPaymentStatus,
              orderProgress: 'Đang xử lý',
              type: 'new_order',
              deliveryAddress: deliveryInfo.address
            }
          });
        } catch (emailError) {
          console.warn('Failed to send confirmation email:', emailError);
        }
      }

      setIsSubmitting(false);
      clearCart();
      
      if (orderNumbers.length === 1) {
        toast({ title: "Đặt hàng thành công!", description: "Chúng tôi sẽ xác nhận thanh toán sớm nhất." });
        navigate(`/order-success?orderNumber=${orderNumbers[0]}`);
      } else {
        toast({ title: `Đặt hàng thành công ${orderNumbers.length} đơn!`, description: `Đơn hàng đã được tách theo master: ${orderNumbers.join(', ')}` });
        navigate(`/order-success?orderNumber=${orderNumbers[0]}`);
      }

    } catch (error) {
      console.error("Error submitting order:", error);
      setIsSubmitting(false);
      toast({ title: "Lỗi", description: "Đã có lỗi xảy ra. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const getPaymentDetails = () => {
    switch (selectedMethod) {
      case 'Vietcombank': return { label: "Vietcombank", number: PAYMENT_INFO.vietcombank };
      case 'Momo': return { label: "Momo", number: PAYMENT_INFO.momo };
      case 'Zalopay': return { label: "Zalopay", number: PAYMENT_INFO.zalopay };
      default: return { label: "Vietcombank", number: PAYMENT_INFO.vietcombank };
    }
  };
  
  const paymentDetails = getPaymentDetails();

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold mb-4">Giỏ hàng trống</h1>
          <p className="text-sm text-muted-foreground mb-6">Bạn chưa có sản phẩm nào để đặt hàng.</p>
          <Button onClick={() => navigate("/products")} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại mua sắm
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-xl px-4 py-8 md:py-10">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-4 gap-2 pl-0 hover:bg-transparent h-auto py-1">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Tiếp tục mua sắm</span>
        </Button>
      
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          
          <div className="rounded-lg border p-4 md:p-6 bg-white shadow-sm">
            <h2 className="text-lg font-bold mb-4">Thông tin liên hệ</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="contact-fb" className="text-sm">Link Facebook / Instagram *</Label>
                <Input id="contact-fb" className="h-9 text-sm mt-1" value={contactInfo.fb} onChange={(e) => setContactInfo({...contactInfo, fb: e.target.value})} placeholder="https://..." required />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-sm">Email *</Label>
                <Input id="contact-email" type="email" className="h-9 text-sm mt-1" value={contactInfo.email} onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})} placeholder="email@example.com" required />
              </div>
              <div>
                <Label htmlFor="contact-phone" className="text-sm">Số điện thoại *</Label>
                <Input id="contact-phone" type="tel" className="h-9 text-sm mt-1" value={contactInfo.phone} onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} placeholder="090..." required />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 md:p-6 bg-white shadow-sm">
            <h2 className="text-lg font-bold mb-4">Thông tin nhận hàng</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="delivery-name" className="text-sm">Họ và tên người nhận *</Label>
                <Input id="delivery-name" className="h-9 text-sm mt-1" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} placeholder="Nguyễn Văn A" required />
              </div>
              <div>
                <Label htmlFor="delivery-phone" className="text-sm">Số điện thoại nhận hàng <span className="text-xs text-muted-foreground font-normal">(Bỏ trống nếu giống SĐT liên lạc)</span></Label>
                <Input 
                  id="delivery-phone" 
                  type="tel" 
                  className="h-9 text-sm mt-1"
                  value={deliveryInfo.phone} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} 
                  placeholder={contactInfo.phone || "090..."} 
                />
              </div>
              <div>
                <Label htmlFor="delivery-address" className="text-sm">Địa chỉ nhận hàng *</Label>
                <Input id="delivery-address" className="h-9 text-sm mt-1" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} placeholder="Số nhà, đường, phường, quận, thành phố" required />
              </div>
              <div>
                <Label htmlFor="delivery-note" className="text-sm">Ghi chú (Tùy chọn)</Label>
                <Textarea 
                  id="delivery-note" 
                  value={deliveryInfo.note} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, note: e.target.value})} 
                  placeholder="Ví dụ: Giao ngoài giờ hành chính..."
                  className="resize-none text-sm mt-1"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 md:p-6 bg-white shadow-sm">
            <h2 className="text-lg font-bold mb-4">Thanh toán</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Hình thức thanh toán</Label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="radio" name="paymentType" value="full" checked={paymentType === 'full'} onChange={(e) => setPaymentType(e.target.value as "full")} className="mt-1" />
                    <div>
                      <div className="text-sm font-medium">Thanh toán đủ 100% ({totalPrice.toLocaleString('vi-VN')}đ)</div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="radio" name="paymentType" value="deposit" checked={paymentType === 'deposit'} onChange={(e) => setPaymentType(e.target.value as "deposit")} className="mt-1" />
                    <div>
                      <div className="text-sm font-medium">Đặt cọc 50% ({(totalPrice * 0.5).toLocaleString('vi-VN')}đ)</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Hoàn cọc trong 1 tháng</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod" className="text-sm font-semibold">Chọn phương thức chuyển khoản</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger id="paymentMethod" className="mt-1 h-9 text-sm">
                    <SelectValue placeholder="Chọn ngân hàng/ví điện tử" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ngân hàng">Ngân hàng</SelectItem>
                    <SelectItem value="Momo">Momo</SelectItem>
                    <SelectItem value="Zalopay">Zalopay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 p-3 rounded-md space-y-1 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Thông tin chuyển khoản</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      const text = `${PAYMENT_INFO.accountName}\n${paymentDetails.label}: ${paymentDetails.number}`;
                      navigator.clipboard.writeText(text);
                      toast({ title: "Đã copy", description: "Đã copy thông tin chuyển khoản" });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p>Chủ TK: <span className="font-bold">{PAYMENT_INFO.accountName}</span></p>
                <p>Ngân hàng: <span className="font-bold">{paymentDetails.label}</span></p>
                <p>Số TK: <span className="font-bold">{paymentDetails.number}</span></p>
              </div>
              
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                <Label htmlFor="payment-proof" className="font-semibold text-sm mb-2 block">Đăng bill chuyển khoản *</Label>
                <Input 
                  id="payment-proof" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  required 
                  className="cursor-pointer h-9 text-sm"
                />
                {paymentProof && (
                  <div className="mt-2 p-2 bg-white rounded border flex items-center gap-2">
                    <Upload className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium truncate max-w-[200px]">{paymentProof.name}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">* Bắt buộc gửi bill trước khi đặt hàng</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 md:p-6 bg-white shadow-sm">
            <h2 className="text-lg font-bold mb-4">Đơn hàng của bạn</h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant}`} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <img src={getVariantImage(item)} alt={item.name} className="w-12 h-12 object-cover rounded border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                            {item.selectedVariant && <span>{item.selectedVariant} • </span>}
                            x{item.quantity}
                        </p>
                        <p className="text-sm font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-white shadow-sm sticky bottom-0 md:static">
            <div className="flex justify-between items-center text-base font-medium mb-4">
              <span>Tổng thanh toán:</span>
              <span className="text-xl font-bold text-primary">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <Separator className="mb-4" />
            <Button type="submit" className="w-full text-base font-semibold h-11 shadow-lg" size="lg" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đặt hàng ngay"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
