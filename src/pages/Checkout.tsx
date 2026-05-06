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
import { Loader2, ArrowLeft, RefreshCw, Minus, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { InAppUploadNotice } from "@/components/InAppBrowserBanner";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import qrMomo from "@/assets/qr-momo.jpg";
import qrZalopay from "@/assets/qr-zalopay.jpg";
import qrVpbank from "@/assets/qr-vpbank.jpg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { tenant } from "@/config/tenant";

const QR_IMAGES: { [key: string]: string } = {
  "Ngân hàng": qrVpbank,
  "Momo": qrMomo,
  "Zalopay": qrZalopay,
};

const PAYMENT_METHODS = [
  tenant.paymentInfo.vpbank && { value: "Ngân hàng", label: "VPBank", number: tenant.paymentInfo.vpbank },
  tenant.paymentInfo.mbbank && { value: "MB Bank", label: "MB Bank", number: tenant.paymentInfo.mbbank },
  tenant.paymentInfo.momo && { value: "Momo", label: "Momo", number: tenant.paymentInfo.momo },
  tenant.paymentInfo.zalopay && { value: "Zalopay", label: "Zalopay", number: tenant.paymentInfo.zalopay },
].filter(Boolean) as { value: string; label: string; number: string }[];

const getVariantImage = (item: CartItem) => {
  if (item.selectedVariant && item.variantImageMap) {
    const imageIndex = item.variantImageMap[item.selectedVariant];
    if (imageIndex !== undefined && item.images[imageIndex]) {
      return item.images[imageIndex];
    }
  }
  return item.images[0];
};

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
  const { cartItems, totalPrice, clearCart, updateQuantity, removeFromCart, syncCartWithServer } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("syncing");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]?.value || "");

  const runSync = async () => {
    setSyncStatus("syncing");
    try {
      const { updated, removed } = await syncCartWithServer();
      setSyncedAt(new Date());
      setSyncStatus("synced");
      if (updated.length > 0) {
        toast({ title: "Đã cập nhật giá/ảnh mới nhất", description: updated.join(", ") });
      }
      if (removed.length > 0) {
        toast({ title: "Sản phẩm không còn", description: removed.join(", "), variant: "destructive" });
      }
    } catch {
      setSyncStatus("error");
    }
  };

  useEffect(() => { runSync(); }, []);

  const [contactInfo, setContactInfo] = useState({ fb: "", ig: "", email: "", phone: "" });
  const [deliveryInfo, setDeliveryInfo] = useState({ name: "", phone: "", address: "", note: "" });
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [agreedPolicy, setAgreedPolicy] = useState(false);

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
        toast({ title: "Mã giảm giá không hợp lệ", variant: "destructive" });
        return;
      }
      setAppliedDiscount(data as DiscountCode);
      setDiscountAmount(
        data.discount_type === 'percentage'
          ? Math.min(totalPrice * (data.discount_value / 100), data.max_discount || Infinity)
          : data.discount_value
      );
    } catch (error) {
      toast({ title: "Lỗi kiểm tra mã", variant: "destructive" });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCode("");
  };

  useEffect(() => {
    if (!appliedDiscount) return;
    const amount = appliedDiscount.discount_type === 'percentage'
      ? Math.min(totalPrice * (appliedDiscount.discount_value / 100), appliedDiscount.max_discount || Infinity)
      : appliedDiscount.discount_value;
    setDiscountAmount(Math.min(amount, totalPrice));
  }, [totalPrice, appliedDiscount]);

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const paymentDetails = PAYMENT_METHODS.find(m => m.value === selectedMethod) || PAYMENT_METHODS[0];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactInfo.fb || !contactInfo.phone || !deliveryInfo.name || !deliveryInfo.address) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin.", variant: "destructive" });
      return;
    }

    if (!paymentProof) {
      toast({ title: "Lỗi", description: "Vui lòng đăng bill chuyển khoản.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let paymentProofUrl = null;

      if (paymentProof) {
        const r2Client = new S3Client({
          region: "auto",
          endpoint: import.meta.env.VITE_R2_ENDPOINT,
          credentials: {
            accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
            secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
          },
        });

        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const arrayBuffer = await paymentProof.arrayBuffer();
        const fileContent = new Uint8Array(arrayBuffer);

        await r2Client.send(new PutObjectCommand({
          Bucket: "product-images",
          Key: fileName,
          Body: fileContent,
          ContentType: paymentProof.type,
        }));

        paymentProofUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileName}`;
      }

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
        const orderNumber = `PO${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        orderNumbers.push(orderNumber);

        const { error: insertError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_fb: contactInfo.fb,
            customer_ig: contactInfo.ig || null,
            customer_email: contactInfo.email,
            customer_phone: contactInfo.phone,
            delivery_name: deliveryInfo.name,
            delivery_phone: deliveryInfo.phone || contactInfo.phone,
            delivery_address: deliveryInfo.address,
            delivery_note: deliveryInfo.note,
            items: groupItems as any,
            total_price: groupTotal,
            payment_method: selectedMethod,
            payment_type: paymentType,
            payment_proof_url: paymentProofUrl,
            payment_status: paymentType === 'deposit' ? 'Đang xác nhận cọc' : 'Đang xác nhận thanh toán',
            order_progress: 'Đang xử lý',
            shop: tenant.shopId,
          } as any);

        if (insertError) throw insertError;

        for (const item of groupItems) {
          if (item.selectedVariant) {
            await supabase.rpc('decrement_variant_stock', { p_product_id: item.id, p_variant_name: item.selectedVariant, p_quantity: item.quantity });
          }
          await supabase.rpc('decrement_product_stock', { p_product_id: item.id, p_quantity: item.quantity });
        }
      }

      clearCart();
      toast({ title: "Đặt hàng thành công!", description: `${tenant.shopName} sẽ sớm liên hệ xác nhận đơn hàng của bạn.` });
      navigate(`/order-success?orderNumber=${orderNumbers[0]}`);

    } catch (error: any) {
      console.error("Error submitting order:", error);
      toast({ title: "Lỗi", description: error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
          <Button onClick={() => navigate("/products")}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại mua sắm</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Tiếp tục mua sắm
        </Button>

        {/* Sync status */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            {syncStatus === "syncing" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Đang cập nhật giá & ảnh từ server…</span>
              </>
            )}
            {syncStatus === "synced" && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">
                  Đã cập nhật{syncedAt && ` lúc ${syncedAt.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`}
                </span>
              </>
            )}
            {syncStatus === "error" && (
              <span className="text-destructive">Không cập nhật được, dùng dữ liệu đã lưu</span>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={runSync} disabled={syncStatus === "syncing"} className="h-7 gap-1 px-2">
            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        <form onSubmit={handleSubmitOrder} className="space-y-8">
          {/* Thông tin liên hệ */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thông tin liên hệ</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-fb">Link Facebook *</Label>
                <Input id="contact-fb" value={contactInfo.fb} onChange={(e) => setContactInfo({...contactInfo, fb: e.target.value})} placeholder="https://facebook.com/..." required />
              </div>
              <div>
                <Label htmlFor="contact-ig">Link Instagram (không bắt buộc)</Label>
                <Input id="contact-ig" value={contactInfo.ig} onChange={(e) => setContactInfo({...contactInfo, ig: e.target.value})} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <Label htmlFor="contact-phone">Số điện thoại *</Label>
                <Input id="contact-phone" type="tel" value={contactInfo.phone} onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} placeholder="090..." required />
              </div>
            </div>
          </div>

          {/* Thông tin nhận hàng */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thông tin nhận hàng</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delivery-name">Họ và tên người nhận *</Label>
                <Input id="delivery-name" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} placeholder="Nguyễn Văn A" required />
              </div>
              <div>
                <Label htmlFor="delivery-phone">Số điện thoại nhận hàng {contactInfo.phone && "(Bỏ trống nếu giống SĐT liên lạc)"}</Label>
                <Input id="delivery-phone" type="tel" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} placeholder={contactInfo.phone || "090..."} />
              </div>
              <div>
                <Label htmlFor="delivery-address">Địa chỉ nhận hàng *</Label>
                <Input id="delivery-address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} placeholder="Số nhà, đường, phường, quận, thành phố" required />
              </div>
              <div>
                <Label htmlFor="delivery-note">Ghi chú (Tùy chọn)</Label>
                <Textarea id="delivery-note" value={deliveryInfo.note} onChange={(e) => setDeliveryInfo({...deliveryInfo, note: e.target.value})} placeholder="Ví dụ: Gọi trước khi giao..." className="resize-none" rows={3} />
              </div>
            </div>
          </div>

          {/* Thanh toán */}
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-6">Thanh toán</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="font-semibold block">Hình thức thanh toán</Label>
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentType" value="full" checked={paymentType === 'full'} onChange={() => setPaymentType("full")} className="mt-1" />
                  <div className="font-medium">Thanh toán đủ 100% ({totalPrice.toLocaleString('vi-VN')}đ)</div>
                </label>
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentType" value="deposit" checked={paymentType === 'deposit'} onChange={() => setPaymentType("deposit")} className="mt-1" />
                  <div>
                    <div className="font-medium">Đặt cọc 50% ({(totalPrice * 0.5).toLocaleString('vi-VN')}đ)</div>
                    <div className="text-xs text-muted-foreground mt-1 italic">(hoàn cọc trong 1 tháng)</div>
                  </div>
                </label>
              </div>

              {PAYMENT_METHODS.length > 1 && (
                <div>
                  <Label htmlFor="paymentMethod" className="font-semibold">Chọn phương thức</Label>
                  <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn phương thức thanh toán" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Thông tin chuyển khoản</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`${tenant.paymentInfo.accountName}\n${paymentDetails?.label}: ${paymentDetails?.number}`);
                    toast({ title: "Đã copy" });
                  }}>Copy</Button>
                </div>
                <p>Chủ TK: <span className="font-bold">{tenant.paymentInfo.accountName}</span></p>
                <p>Số TK: <span className="font-bold">{paymentDetails?.number}</span> ({paymentDetails?.label})</p>
                {QR_IMAGES[selectedMethod] && (
                  <div className="flex justify-center pt-2">
                    <img src={QR_IMAGES[selectedMethod]} alt="QR" className="max-w-[250px] rounded-lg shadow-sm" />
                  </div>
                )}
              </div>

              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 bg-primary/5">
                <Label className="font-semibold text-lg mb-3 block">Đăng bill chuyển khoản *</Label>
                <InAppUploadNotice />
                <Input type="file" accept="image/*" onChange={handleFileChange} required className="cursor-pointer mt-2" />
                {paymentProof && <p className="mt-2 text-sm text-green-600 font-medium">✓ {paymentProof.name}</p>}
                <p className="text-xs text-muted-foreground mt-2 italic">* Vui lòng upload bill trước khi bấm đặt hàng.</p>
              </div>
            </div>
          </div>

          {/* Sản phẩm */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Sản phẩm đã chọn ({cartItems.length})</h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant}`} className="flex gap-3">
                  <img src={getVariantImage(item)} alt={item.name} className="h-16 w-16 shrink-0 rounded object-cover border" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                    {item.selectedVariant && <p className="text-xs text-muted-foreground">Phân loại: {item.selectedVariant}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 rounded-md border">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number" min="1" value={item.quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v) && v >= 1) updateQuantity(item.id, item.selectedVariant, v);
                          }}
                          className="h-7 w-12 border-0 p-0 text-center text-sm shadow-none focus-visible:ring-0"
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.id, item.selectedVariant)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary whitespace-nowrap">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between"><span>Tạm tính:</span><span>{totalPrice.toLocaleString('vi-VN')}đ</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{discountAmount.toLocaleString('vi-VN')}đ</span></div>}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng:</span>
              <span className="text-2xl text-primary">{finalPrice.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="agree-policy" checked={agreedPolicy} onCheckedChange={(checked) => setAgreedPolicy(checked === true)} />
              <label htmlFor="agree-policy" className="text-sm cursor-pointer">
                Tôi đồng ý với <a href="/policy" target="_blank" className="text-primary underline">chính sách đặt hàng</a>
              </label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !agreedPolicy}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đặt hàng ngay"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
