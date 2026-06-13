import { useState, useEffect, useMemo } from "react";
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
import { tenant } from "@/config/tenant";
import { z } from "zod";

// ... (Các schema và hằng số giữ nguyên)
const checkoutSchema = z.object({
  contactInfo: z.object({
    fb: z.string().trim().min(1, "Vui lòng nhập link Facebook").max(500, "Link quá dài"),
    ig: z.string().trim().max(500, "Link quá dài").optional().or(z.literal("")),
    email: z.string().trim().max(255, "Email quá dài").email("Email không hợp lệ").optional().or(z.literal("")),
    phone: z.string().trim().regex(/^[0-9+\s-]{9,15}$/, "Số điện thoại không hợp lệ"),
  }),
  deliveryInfo: z.object({
    name: z.string().trim().min(2, "Tên quá ngắn").max(100, "Tên quá dài"),
    phone: z.string().trim().max(20, "SĐT quá dài").optional().or(z.literal("")),
    address: z.string().trim().min(5, "Địa chỉ quá ngắn").max(500, "Địa chỉ quá dài"),
    note: z.string().trim().max(1000, "Ghi chú quá dài").optional().or(z.literal("")),
  }),
});

const QR_IMAGES: { [key: string]: string } = { "Ngân hàng": qrVpbank, "Momo": qrMomo, "Zalopay": qrZalopay };
const PAYMENT_METHODS = [
  tenant.paymentInfo.vpbank && { value: "Ngân hàng", label: "VPBank", number: tenant.paymentInfo.vpbank },
  tenant.paymentInfo.mbbank && { value: "MB Bank", label: "MB Bank", number: tenant.paymentInfo.mbbank },
  tenant.paymentInfo.momo && { value: "Momo", label: "Momo", number: tenant.paymentInfo.momo },
  tenant.paymentInfo.zalopay && { value: "Zalopay", label: "Zalopay", number: tenant.paymentInfo.zalopay },
].filter(Boolean) as { value: string; label: string; number: string }[];

const getVariantImage = (item: CartItem) => {
  if (item.selectedVariant && item.variantImageMap) {
    const imageIndex = item.variantImageMap[item.selectedVariant];
    if (imageIndex !== undefined && item.images[imageIndex]) return item.images[imageIndex];
  }
  return item.images[0];
};

export default function Checkout() {
  const { cartItems, totalPrice, clearCart, updateQuantity, removeFromCart, syncCartWithServer } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- MỚI: State và Effect kiểm tra tồn kho ---
  const [invalidItems, setInvalidItems] = useState<{ id: number; variant: string; reason: string }[]>([]);

  useEffect(() => {
    const checkItems = async () => {
      if (cartItems.length === 0) return;
      const ids = [...new Set(cartItems.map(i => i.id))];
      const { data } = await supabase
        .from('products')
        .select('id, variants, stock, order_deadline, name, status')
        .in('id', ids);
      
      if (!data) return;
      const freshById = new Map(data.map(p => [p.id, p]));
      const invalid: { id: number; variant: string; reason: string }[] = [];

      for (const item of cartItems) {
        const p = freshById.get(item.id);
        if (!p) { invalid.push({ id: item.id, variant: item.selectedVariant, reason: "Sản phẩm không còn tồn tại" }); continue; }
        if (p.order_deadline && new Date(p.order_deadline) < new Date()) { invalid.push({ id: item.id, variant: item.selectedVariant, reason: "Đã hết hạn order" }); continue; }
        if (p.status === 'Ẩn') { invalid.push({ id: item.id, variant: item.selectedVariant, reason: "Sản phẩm không còn bán" }); continue; }
        
        let stock = p.stock ?? 0;
        if (item.selectedVariant && item.selectedVariant !== item.name && Array.isArray(p.variants)) {
          const v = (p.variants as any[]).find((v: any) => v.name === item.selectedVariant);
          if (v && v.stock !== null && v.stock !== undefined) stock = v.stock;
        }
        if (stock <= 0) invalid.push({ id: item.id, variant: item.selectedVariant, reason: "Hết hàng" });
      }
      setInvalidItems(invalid);
    };
    checkItems();
  }, [cartItems]);

  const isItemInvalid = (id: number, variant: string) => invalidItems.find(i => i.id === id && i.variant === variant);
  // ---------------------------------------------

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("syncing");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]?.value || "");
  const [contactInfo, setContactInfo] = useState({ fb: "", ig: "", email: "", phone: "" });
  const [deliveryInfo, setDeliveryInfo] = useState({ name: "", phone: "", address: "", note: "" });
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [paymentProofData, setPaymentProofData] = useState<{ buffer: Uint8Array; type: string; name: string } | null>(null);
  const [agreedPolicy, setAgreedPolicy] = useState(false);

  // ... (Giữ nguyên các hàm sync, handleSubmitOrder cũ của bạn)

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = checkoutSchema.safeParse({ contactInfo, deliveryInfo });
    if (!validation.success) {
      toast({ title: "Lỗi", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (!paymentProofData) { toast({ title: "Lỗi", description: "Vui lòng đăng bill.", variant: "destructive" }); return; }

    setIsSubmitting(true);
    
    // --- THAY ĐỔI: Batch Fetch tồn kho trước khi đặt hàng ---
    const ids = [...new Set(cartItems.map(i => i.id))];
    const { data: freshProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, variants, stock, order_deadline, name, status')
      .in('id', ids);

    if (fetchError || !freshProducts) {
      toast({ title: "Lỗi", description: "Không thể kiểm tra tồn kho. Vui lòng thử lại.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const freshById = new Map(freshProducts.map(p => [p.id, p]));
    for (const item of cartItems) {
      const p = freshById.get(item.id);
      if (!p) { toast({ title: "Lỗi", description: `Không tìm thấy sản phẩm "${item.name}".`, variant: "destructive" }); setIsSubmitting(false); return; }
      if (p.order_deadline && new Date(p.order_deadline) < new Date()) { toast({ title: "Hết hạn", description: `"${p.name}" đã đóng order.`, variant: "destructive" }); setIsSubmitting(false); return; }
      
      let stock = p.stock ?? 0;
      if (item.selectedVariant && item.selectedVariant !== item.name && Array.isArray(p.variants)) {
        const v = (p.variants as any[]).find((v: any) => v.name === item.selectedVariant);
        if (v && v.stock !== null && v.stock !== undefined) stock = v.stock;
      }
      if (stock <= 0) { toast({ title: "Hết hàng", description: `"${item.selectedVariant || p.name}" đã hết hàng.`, variant: "destructive" }); setIsSubmitting(false); return; }
      if (item.quantity > stock) { toast({ title: "Không đủ hàng", description: `"${item.selectedVariant || p.name}" chỉ còn ${stock} sản phẩm.`, variant: "destructive" }); setIsSubmitting(false); return; }
    }
    // -------------------------------------------------------

    // ... (Giữ nguyên logic upload và insert order cũ)
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        {/* ... (Phần render UI cũ) ... */}
        
        {/* Render giỏ hàng với cảnh báo */}
        {cartItems.map((item) => {
          const invalid = isItemInvalid(item.id, item.selectedVariant);
          return (
            <div key={`${item.id}-${item.selectedVariant}`} className={`flex gap-3 rounded-lg p-2 transition-opacity ${invalid ? 'opacity-50 bg-red-50 border border-red-200' : ''}`}>
              <img src={getVariantImage(item)} alt={item.name} className="h-16 w-16 shrink-0 rounded object-cover border" />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                {item.selectedVariant && <p className="text-xs text-muted-foreground">Phân loại: {item.selectedVariant}</p>}
                {invalid && <p className="text-xs text-red-600 font-medium">⚠️ {invalid.reason} — vui lòng xóa khỏi giỏ</p>}
                
                <div className={`flex flex-wrap items-center gap-2 pt-1 ${invalid ? 'pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-1 rounded-md border">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) updateQuantity(item.id, item.selectedVariant, v); }} className="h-7 w-12 border-0 p-0 text-center text-sm shadow-none focus-visible:ring-0" />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.id, item.selectedVariant)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Nút đặt hàng với trạng thái disable */}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !agreedPolicy || invalidItems.length > 0}>
           {isSubmitting ? "Đang xử lý..." : invalidItems.length > 0 ? `Có ${invalidItems.length} sản phẩm lỗi` : "Đặt hàng ngay"}
        </Button>
      </div>
    </Layout>
  );
}
