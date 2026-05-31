import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Loader2,
  Copy, X, Save, Layers, Upload, ImageIcon
} from "lucide-react";
import { InAppUploadNotice } from "./InAppBrowserBanner";

// --- IMPORT AWS SDK CHO CLOUDFLARE R2 ĐỂ UPLOAD TRONG BULK ADD ---
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CATEGORIES = ["Tiệm in Purin", "Outfit & Doll", "Merch", "Linh tinh xinh xinh", "Đồ gói", "Thời trang", "Khác"];
const STATUSES = ["Sẵn", "Order", "Pre-order", "Ẩn", "Tranh slot"];

interface BulkProductItem {
  _id: string; // local unique id
  name: string;
  price: number;
  price_display: string;
  category: string;
  status: string;
  stock: string;
  order_deadline: string;
  description: string;
  images: string; // comma-separated URLs
  variants: string; // "Tên:Giá:Kho, Tên2:Giá2:Kho2"
  size: string;
  includes: string;
  production_time: string;
  link_order: string;
  deposit_allowed: boolean;
  fees_included: boolean;
  expanded: boolean;
  uploading?: boolean; // Tracking loading riêng cho từng sản phẩm khi up ảnh
}

const makeEmpty = (): BulkProductItem => ({
  _id: Math.random().toString(36).slice(2),
  name: "",
  price: 0,
  price_display: "",
  category: "Merch",
  status: "Order",
  stock: "",
  order_deadline: "",
  description: "",
  images: "",
  variants: "",
  size: "",
  includes: "",
  production_time: "",
  link_order: "",
  deposit_allowed: true,
  fees_included: true,
  expanded: false,
});

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: string;
  defaultMaster?: string;
}

export default function BulkProductForm({ open, onClose, currentUser, defaultMaster = "" }: Props) {
  const { toast } = useToast();
  const { refetchProducts } = useCart();

  const [master, setMaster] = useState(defaultMaster);
  const [items, setItems] = useState<BulkProductItem[]>([makeEmpty(), makeEmpty()]);
  const [saving, setSaving] = useState(false);

  const update = (id: string, field: keyof BulkProductItem, value: any) => {
    setItems(prev => prev.map(it => it._id === id ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [...prev, makeEmpty()]);

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(it => it._id !== id));
  };

  const duplicateItem = (item: BulkProductItem) => {
    setItems(prev => {
      const idx = prev.findIndex(it => it._id === item._id);
      const copy = { ...item, _id: Math.random().toString(36).slice(2), name: item.name + " (Copy)" };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setItems(prev => prev.map(it => it._id === id ? { ...it, expanded: !it.expanded } : it));
  };

  // --- LOGIC XỬ LÝ UPLOAD ẢNH LÊN R2 CHO TỪNG DÒNG SẢN PHẨM HÀNG LOẠT ---
  const handleBulkImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Bật hiệu ứng xoay loading riêng cho sản phẩm này
    setItems(prev => prev.map(it => it._id === id ? { ...it, uploading: true } : it));

    try {
      const newUrls: string[] = [];

      const r2Client = new S3Client({
        region: "auto",
        endpoint: import.meta.env.VITE_R2_ENDPOINT,
        credentials: {
          accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
          secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
        },
      });

      for (const file of Array.from(files)) {
        const timestamp = Date.now();
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `upload-${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const fileContent = new Uint8Array(arrayBuffer);

        await r2Client.send(new PutObjectCommand({
          Bucket: "product-images",
          Key: fileName,
          Body: fileContent,
          ContentType: file.type,
        }));

        const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileName}`;
        newUrls.push(publicUrl);
      }

      // Đọc lại giá trị images cũ, nối thêm các link R2 mới vừa up bằng dấu phẩy
      setItems(prev => prev.map(it => {
        if (it._id === id) {
          const oldImages = it.images.trim();
          const addedString = newUrls.join(", ");
          const finalImages = oldImages ? `${oldImages}, ${addedString}` : addedString;
          return { ...it, images: finalImages, uploading: false };
        }
        return it;
      }));

      toast({ title: "Đã tải lên R2", description: `Đã thêm ${newUrls.length} ảnh vào sản phẩm` });
    } catch (error: any) {
      console.error("Bulk R2 Upload Error:", error);
      toast({ title: "Lỗi tải ảnh", description: error.message, variant: "destructive" });
      setItems(prev => prev.map(it => it._id === id ? { ...it, uploading: false } : it));
    } finally {
      e.target.value = "";
    }
  };

  // Parse variants string "Tên:Giá:Kho, Tên2:Giá2" → array
  const parseVariants = (str: string) => {
    if (!str.trim()) return [];
    return str.split(",").map(s => {
      const parts = s.trim().split(":");
      const name = parts[0]?.trim() || "";
      const price = parseFloat(parts[1]?.trim() || "0") || 0;
      const stock = parts[2]?.trim() ? parseInt(parts[2].trim()) : undefined;
      return { name, price, stock };
    }).filter(v => v.name);
  };

  const parseImages = (str: string) => {
    return str.split(",").map(s => s.trim()).filter(Boolean);
  };

  const handleSaveAll = async () => {
    const valid = items.filter(it => it.name.trim());
    if (valid.length === 0) {
      toast({ title: "Lỗi", description: "Cần ít nhất 1 sản phẩm có tên", variant: "destructive" });
      return;
    }

    const maxId = await fetchMaxId();

    setSaving(true);
    try {
      let nextId = maxId + 1;
      let successCount = 0;
      const errors: string[] = [];

      for (const item of valid) {
        const variants = parseVariants(item.variants);
        const images = parseImages(item.images);

        const saveData: any = {
          id: nextId,
          name: item.name.trim(),
          price: item.price || 0,
          price_display: item.price_display || `${(item.price || 0).toLocaleString('vi-VN')}đ`,
          category: item.category,
          status: item.status,
          stock: item.stock !== "" ? parseInt(item.stock) : null,
          order_deadline: item.order_deadline ? new Date(item.order_deadline).toISOString() : null,
          description: item.description || null,
          images,
          variants,
          option_groups: [],
          variant_image_map: {},
          size: item.size || null,
          includes: item.includes || null,
          production_time: item.production_time || null,
          link_order: item.link_order || null,
          deposit_allowed: item.deposit_allowed,
          fees_included: item.fees_included,
          master: master.trim() || null,
          owner: currentUser,
        };

        const { error } = await supabase.from('products').insert(saveData as any);
        if (error) {
          errors.push(`"${item.name}": ${error.message}`);
        } else {
          successCount++;
          nextId++;
        }
      }

      if (successCount > 0) {
        toast({
          title: `Đã tạo ${successCount}/${valid.length} sản phẩm`,
          description: errors.length > 0 ? `Lỗi: ${errors[0]}` : "Tất cả sản phẩm đã được lưu",
        });
        refetchProducts();
        if (errors.length === 0) {
          onClose();
          setItems([makeEmpty(), makeEmpty()]);
          setMaster("");
        }
      } else {
        toast({ title: "Lỗi", description: errors[0] || "Không thể lưu", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const fetchMaxId = async () => {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    return ((existing?.[0] as any)?.id || 0);
  };

  const validCount = items.filter(it => it.name.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[98vw] max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            Thêm nhiều sản phẩm
          </DialogTitle>
        </DialogHeader>

        {/* Master input */}
        <div className="px-5 py-3 border-b flex-shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold shrink-0">Master (áp dụng cho tất cả):</Label>
            <Input
              value={master}
              onChange={e => setMaster(e.target.value)}
              placeholder="Nhập tên master..."
              className="h-8 max-w-xs text-sm"
            />
            <span className="text-xs text-muted-foreground ml-auto">{validCount} sản phẩm hợp lệ</span>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {items.map((item, idx) => (
            <div
              key={item._id}
              className={`border rounded-lg overflow-hidden transition-all ${
                item.name.trim() ? "border-border" : "border-dashed border-muted-foreground/30"
              }`}
            >
              {/* Row header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>

                {/* Name */}
                <Input
                  value={item.name}
                  onChange={e => update(item._id, 'name', e.target.value)}
                  placeholder="Tên sản phẩm *"
                  className="h-8 text-sm flex-1 min-w-0"
                />

                {/* Price */}
                <Input
                  type="number"
                  value={item.price || ""}
                  onChange={e => update(item._id, 'price', Number(e.target.value) || 0)}
                  placeholder="Giá"
                  className="h-8 text-sm w-28"
                />

                {/* Category */}
                <Select value={item.category} onValueChange={v => update(item._id, 'category', v)}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select value={item.status} onValueChange={v => update(item._id, 'status', v)}>
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Actions */}
                <button
                  onClick={() => toggleExpand(item._id)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
                  title="Mở rộng"
                >
                  {item.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => duplicateItem(item)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
                  title="Nhân đôi"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeItem(item._id)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
                  title="Xoá"
                  disabled={items.length <= 1}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Expanded details */}
              {item.expanded && (
                <div className="px-3 py-3 border-t bg-background space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Hiển thị giá</Label>
                      <Input
                        value={item.price_display}
                        onChange={e => update(item._id, 'price_display', e.target.value)}
                        placeholder="VD: 150.000đ"
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tồn kho</Label>
                      <Input
                        type="number"
                        value={item.stock}
                        onChange={e => update(item._id, 'stock', e.target.value)}
                        placeholder="Để trống = hết hàng"
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hạn order</Label>
                      <Input
                        type="datetime-local"
                        value={item.order_deadline}
                        onChange={e => update(item._id, 'order_deadline', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Kích thước</Label>
                      <Input
                        value={item.size}
                        onChange={e => update(item._id, 'size', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Bao gồm</Label>
                      <Input
                        value={item.includes}
                        onChange={e => update(item._id, 'includes', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Thời gian SX</Label>
                      <Input
                        value={item.production_time}
                        onChange={e => update(item._id, 'production_time', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Link order</Label>
                      <Input
                        value={item.link_order}
                        onChange={e => update(item._id, 'link_order', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    
                    {/* --- THIẾT KẾ LẠI Ô INPUT ẢNH: KÈM NÚT BẤM TẢI LÊN R2 TRỰC TIẾP --- */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Ảnh <span className="text-muted-foreground/60">(phân cách bằng dấu phẩy)</span>
                        </Label>
                        
                        <label className="cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden" 
                            onChange={(e) => handleBulkImageUpload(item._id, e)} 
                            disabled={item.uploading} 
                          />
                          <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline bg-primary/5 px-2 py-0.5 rounded cursor-pointer">
                            {item.uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                            {item.uploading ? "Đang tải..." : "Tải nhiều ảnh lên R2"}
                          </span>
                        </label>
                      </div>
                      
                      <Input
                        value={item.images}
                        onChange={e => update(item._id, 'images', e.target.value)}
                        placeholder="Dán link ảnh hoặc bấm nút bên trên để tải từ máy lên..."
                        className="h-8 text-sm mt-1"
                        disabled={item.uploading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Phân loại{" "}
                      <span className="text-muted-foreground/60">
                        (dạng: Tên:Giá:Kho, Tên2:Giá2 — Kho có thể bỏ)
                      </span>
                    </Label>
                    <Input
                      value={item.variants}
                      onChange={e => update(item._id, 'variants', e.target.value)}
                      placeholder="Đỏ:150000:10, Xanh:160000:5"
                      className="h-8 text-sm mt-1"
                    />
                    {item.variants.trim() && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {parseVariants(item.variants).map((v, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {v.name} — {v.price.toLocaleString('vi-VN')}đ{v.stock !== undefined ? ` (${v.stock})` : ''}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Mô tả</Label>
                    <Textarea
                      value={item.description}
                      onChange={e => update(item._id, 'description', e.target.value)}
                      rows={2}
                      className="text-sm mt-1 resize-none"
                    />
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.deposit_allowed}
                        onCheckedChange={v => update(item._id, 'deposit_allowed', v)}
                        id={`dep-${item._id}`}
                      />
                      <Label htmlFor={`dep-${item._id}`} className="text-xs cursor-pointer">Cho cọc</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.fees_included}
                        onCheckedChange={v => update(item._id, 'fees_included', v)}
                        id={`fee-${item._id}`}
                      />
                      <Label htmlFor={`fee-${item._id}`} className="text-xs cursor-pointer">Đã gồm phí</Label>
                    </div>
                  </div>
                  
                  {/* Preview ảnh nhỏ đã tải lên để kiểm tra nhanh */}
                  {parseImages(item.images).length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-hide">
                      {parseImages(item.images).map((imgUrl, i) => (
                        <img 
                          key={i} 
                          src={imgUrl} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded border bg-muted" 
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add row button */}
          <button
            onClick={addItem}
            className="w-full border-2 border-dashed border-muted-foreground/20 rounded-lg py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex-shrink-0 flex items-center justify-between bg-background">
          <span className="text-xs text-muted-foreground">
            {validCount > 0
              ? `Sẵn sàng lưu ${validCount} sản phẩm${master.trim() ? ` — Master: ${master}` : ''}`
              : "Chưa có sản phẩm hợp lệ (cần có tên)"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Huỷ
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={saving || validCount === 0}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Đang lưu..." : `Lưu ${validCount} sản phẩm`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
