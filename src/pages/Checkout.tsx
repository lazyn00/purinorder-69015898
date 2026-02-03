import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, Facebook, Tag, X, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

const PAYMENT_INFO = {
  accountName: "BUI THANH NHU Y",
  vpbank: "0395939035",
  momo: "0395939035",
  zalopay: "0395939035"
};

// === HÀM HELPER: LẤY ẢNH THEO VARIANT ===
const getVariantImage = (item: CartItem) => {
  if (item.selectedVariant && item.variantImageMap) {
    const imageIndex = item.variantImageMap[item.selectedVariant];
    if (imageIndex !== undefined && item.images[imageIndex]) {
      return item.images[imageIndex];
    }
  }
  return item.images[0];
};
// === KẾT THÚC HÀM HELPER ===

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  applicable_categories: string[] | null;
  applicable_product_ids: number[] | null;
}

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
  
  const [selectedMethod, setSelectedMethod] = useState("VPBank");
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  
  // === DISCOUNT CODE STATE ===
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Auto-fill delivery info from database when contact phone changes
  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      if (contactInfo.phone.length >= 10) {
        try {
          // First try to fetch from database
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

  // === VALIDATE DISCOUNT CODE ===
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return;
    
    setIsValidatingCode(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Mã giảm giá không hợp lệ",
          description: "Mã này không tồn tại hoặc đã hết hạn",
          variant: "destructive"
        });
        return;
      }

      // Check date validity
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) {
        toast({
          title: "Mã chưa có hiệu lực",
          description: "Mã giảm giá này chưa bắt đầu",
          variant: "destructive"
        });
        return;
      }
      if (data.end_date && new Date(data.end_date) < now) {
        toast({
          title: "Mã đã hết hạn",
          description: "Mã giảm giá này đã hết hạn sử dụng",
          variant: "destructive"
        });
        return;
      }

      // Check max uses
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast({
          title: "Mã đã hết lượt sử dụng",
          description: "Mã giảm giá này đã được sử dụng hết",
          variant: "destructive"
        });
        return;
      }

      // Check min order value
      if (data.min_order_value && totalPrice < data.min_order_value) {
        toast({
          title: "Không đủ điều kiện",
          description: `Đơn hàng tối thiểu ${data.min_order_value.toLocaleString('vi-VN')}đ để áp dụng mã này`,
          variant: "destructive"
        });
        return;
      }

      // Check applicable products/categories
      const cartProductIds = cartItems.map(item => item.id);
      const cartCategories = cartItems.map(item => item.category).filter(Boolean);
      
      let isApplicable = true;
      if (data.applicable_product_ids && data.applicable_product_ids.length > 0) {
        isApplicable = cartProductIds.some((id: number) => data.applicable_product_ids?.includes(id));
      } else if (data.applicable_categories && data.applicable_categories.length > 0) {
        isApplicable = cartCategories.some((cat: string) => data.applicable_categories?.includes(cat));
      }

      if (!isApplicable) {
        toast({
          title: "Mã không áp dụng",
          description: "Mã giảm giá này không áp dụng cho các sản phẩm trong giỏ hàng",
          variant: "destructive"
        });
        return;
      }

      // Calculate discount amount
      let discount = 0;
      if (data.discount_type === 'percentage') {
        discount = totalPrice * (data.discount_value / 100);
        if (data.max_discount && discount > data.max_discount) {
          discount = data.max_discount;
        }
      } else {
        discount = data.discount_value;
      }

      setAppliedDiscount(data as DiscountCode);
      setDiscountAmount(discount);
      toast({
        title: "Áp dụng thành công!",
        description: `Giảm ${discount.toLocaleString('vi-VN')}đ`,
      });
    } catch (error) {
      console.error("Error validating discount code:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra mã giảm giá",
        variant: "destructive"
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCode("");
  };

  const finalPrice = totalPrice - discountAmount;

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

      // === TÁCH ĐỌN THEO MASTER (NHÓM ITEMS THEO MASTER) ===
      const masterGroups: { [key: string]: typeof cartItems } = {};
      
      cartItems.forEach(item => {
        const master = item.master || "no_master";
        if (!masterGroups[master]) {
          masterGroups[master] = [];
        }
        masterGroups[master].push(item);
      });

      const masterKeys = Object.keys(masterGroups);
      const orderNumbers: string[] = [];

      // TẠO TỪNG ĐƠN HÀNG CHO MỖI MASTER
      for (const master of masterKeys) {
        const groupItems = masterGroups[master];
        const groupTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Generate order number cho đơn này
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
            payment_status: paymentType === 'deposit' ? 'Đang xác nhận cọc' : 'Đang xác nhận thanh toán',
            order_progress: 'Đang xử lý'
          } as any);

        if (insertError) {
          throw insertError;
        }

        // === TỰ ĐỘNG TRỪ TỒN KHO TRONG DATABASE (CHO NHÓM NÀY) ===
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

                await supabase
                  .from('products')
                  .update({ variants: updatedVariants })
                  .eq('id', item.id);
              }
            } else if (item.stock !== undefined) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, (item.stock || 0) - item.quantity) })
                .eq('id', item.id);
            }
          }
        } catch (stockError) {
          console.warn('Không thể cập nhật tồn kho:', stockError);
        }

        // === TẠO AFFILIATE ORDER NẾU CÓ REFERRAL CODE ===
        // Hoa hồng được tính dựa trên cột "cong" (tiền công) của sản phẩm, không phải giá bán
        try {
          const referralCode = localStorage.getItem('purin_referral_code');
          const referralTimestamp = localStorage.getItem('purin_referral_timestamp');
          
          // Check referral code còn hiệu lực (7 ngày)
          if (referralCode && referralTimestamp) {
            const timestamp = parseInt(referralTimestamp);
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            if (timestamp > sevenDaysAgo) {
              // Tìm affiliate theo referral code
              const { data: affiliate } = await supabase
                .from('affiliates')
                .select('id, commission_rate, status')
                .eq('referral_code', referralCode)
                .eq('status', 'approved')
                .single();
              
              if (affiliate) {
                // Tính tổng tiền công (cong) của các sản phẩm trong đơn
                // Lấy trực tiếp từ item trong giỏ hàng vì dữ liệu từ Google Sheet
                let totalCong = 0;
                for (const item of groupItems) {
                  // Lấy cong từ item (được load từ Google Sheet qua CartContext)
                  const itemCong = (item as any).cong || (item as any)['công'] || 0;
                  if (itemCong > 0) {
                    totalCong += (itemCong * item.quantity);
                  }
                }
                
                console.log('Affiliate order debug:', {
                  referralCode,
                  affiliateId: affiliate.id,
                  totalCong,
                  commissionRate: affiliate.commission_rate
                });
                
                // Tính hoa hồng dựa trên tiền công, không phải giá bán
                // Nếu không có tiền công thì không tính hoa hồng (commission = 0)
                const commissionAmount = totalCong > 0 
                  ? Math.floor(totalCong * (affiliate.commission_rate / 100))
                  : 0;
                
                // Lấy order id vừa tạo
                const { data: orderData } = await supabase
                  .from('orders')
                  .select('id')
                  .eq('order_number', orderNumber)
                  .single();
                
                // Luôn tạo affiliate_order để theo dõi, kể cả khi commission = 0
                if (orderData) {
                  console.log('Creating affiliate order:', {
                    affiliateId: affiliate.id,
                    orderId: orderData.id,
                    orderNumber,
                    orderTotal: groupTotal,
                    commissionAmount
                  });
                  
                  // Tạo affiliate_order
                  const { error: affiliateOrderError } = await (supabase as any)
                    .from('affiliate_orders')
                    .insert({
                      affiliate_id: affiliate.id,
                      order_id: orderData.id,
                      order_number: orderNumber,
                      order_total: groupTotal,
                      commission_amount: commissionAmount,
                      status: 'pending'
                    });
                  
                  if (affiliateOrderError) {
                    console.error('Error creating affiliate order:', affiliateOrderError);
                  } else {
                    // Cập nhật pending_earnings và total_orders của affiliate
                    const { data: currentAffiliate } = await (supabase as any)
                      .from('affiliates')
                      .select('pending_earnings, total_orders')
                      .eq('id', affiliate.id)
                      .single();
                    
                    if (currentAffiliate) {
                      await (supabase as any)
                        .from('affiliates')
                        .update({
                          pending_earnings: (currentAffiliate.pending_earnings || 0) + commissionAmount,
                          total_orders: (currentAffiliate.total_orders || 0) + 1
                        })
                        .eq('id', affiliate.id);
                    }
                  }
                }
              }
            }
          }
        } catch (affiliateError) {
          console.warn('Không thể tạo affiliate order:', affiliateError);
        }

        // Sync đơn này to Google Sheets
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
                items: groupItems,
                total_price: groupTotal,
                payment_method: selectedMethod,
                payment_type: paymentType,
                payment_proof_url: paymentProofUrl,
                payment_status: paymentType === 'deposit' ? 'Đang xác nhận cọc' : 'Đang xác nhận thanh toán',
                order_progress: 'Đang xử lý'
              }
            })
          }).catch(err => {
            console.warn('Failed to sync to Google Sheets:', err);
          });
        } catch (syncError) {
          console.warn('Google Sheets sync error:', syncError);
        }

        // Send email cho đơn này
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
              status: paymentType === 'deposit' ? 'Đang xác nhận cọc' : 'Đang xác nhận thanh toán',
              paymentStatus: paymentType === 'deposit' ? 'Đang xác nhận cọc' : 'Đang xác nhận thanh toán',
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
        toast({
          title: "Đặt hàng thành công!",
          description: "Chúng tôi sẽ liên hệ với bạn sớm nhất.",
        });
        navigate(`/order-success?orderNumber=${orderNumbers[0]}`);
      } else {
        toast({
          title: `Đặt hàng thành công ${orderNumbers.length} đơn!`,
          description: `Đơn hàng đã được tách theo master: ${orderNumbers.join(', ')}`,
        });
        navigate(`/order-success?orderNumber=${orderNumbers[0]}`);
      }

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
      case 'VPBank':
        return { label: "VPBank", number: PAYMENT_INFO.vpbank };
      case 'Momo':
        return { label: "Momo", number: PAYMENT_INFO.momo };
      case 'Zalopay':
        return { label: "Zalopay", number: PAYMENT_INFO.zalopay };
      default:
        return { label: "VPBank", number: PAYMENT_INFO.vpbank };
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

          {/* MÃ GIẢM GIÁ */}
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Mã giảm giá
            </h2>
            {appliedDiscount ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{appliedDiscount.code}</span>
                  <Badge variant="secondary">-{discountAmount.toLocaleString('vi-VN')}đ</Badge>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={removeDiscount}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={validateDiscountCode}
                  disabled={isValidatingCode || !discountCode.trim()}
                >
                  {isValidatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span>Tạm tính:</span>
              <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Giảm giá:</span>
                <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg font-medium">
              <span>Tổng cộng:</span>
              <span className="text-2xl font-bold text-primary">
                {finalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đặt hàng ngay"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
