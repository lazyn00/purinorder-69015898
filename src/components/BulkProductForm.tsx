import { useState, useEffect } from "react";
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

interface BulkVariantItem {
  name: string;
  price: number;
  stock?: number;
  te?: number; // Trường ghi nhận giá tệ ẩn cho từng phân loại
}

interface BulkProductItem {
  _id: string; 
  name: string;
  te: number | null;
  rate: number | null;
  r_v: number | null;
  can_weight: number | null;
  pack: number | null;
  cong: number | null;
  total: number | null;
  price: number;
  price_display: string;
  category: string;
  status: string;
  stock: string;
  order_deadline: string;
  description: string;
  images: string; 
  variants: BulkVariantItem[]; // Mảng object phân loại biến thể chi tiết
  size: string;
  includes: string;
  production_time: string;
  link_order: string;
  deposit_allowed: boolean;
  fees_included: boolean;
  expanded: boolean;
  uploading?: boolean; 
}

const makeEmpty = (): BulkProductItem => ({
  _id: Math.random().toString(36).slice(2),
  name: "",
  te: null,
  rate: null,
  r_v: null,
  can_weight: null,
  pack: null,
  cong: null,
  total: null,
  price: 0,
  price_display: "",
  category: "Merch",
  status: "Order",
  stock: "",
  order_deadline: "",
  description: "",
  images: "",
  variants: [],
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

  // Tính toán chi phí tự động khi các chỉ số tài chính của từng dòng sản phẩm thay đổi
  const recalculateCosts = (item: BulkProductItem): BulkProductItem => {
    const te = item.te || 0;
    const rate = item.rate || 0;
    const can = item.can_weight || 0;
    const pack = item.pack || 0;
    const cong = item.cong || 0;

    const rv = te * rate;
    const total = rv + can + pack + cong;

    return {
      ...item,
      r_v: rv || null,
      total: total || null,
    };
  };

  const update = (id: string, field: keyof BulkProductItem, value: any) => {
    setItems(prev => prev.map(it => {
      if (it._id === id) {
        let updatedItem = { ...it, [field]: value };
        if (["te", "rate", "can_weight", "pack", "cong"].includes(field)) {
          updatedItem = recalculateCosts(updatedItem);
        }
        return updatedItem;
      }
      return it;
    }));
  };

  const addItem = () => setItems(prev => [...prev, makeEmpty()]);

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(it => it._id !== id));
  };

  const duplicateItem = (item: BulkProductItem) => {
    setItems(prev => {
      const idx = prev.findIndex(it => it._id === item._id);
      const copy = { ...item, _id: Math.random().toString(36).slice(2), name: item.name + " (Copy)", variants: [...item.variants] };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setItems(prev => prev.map(it => it._id === id ? { ...it, expanded: !it.expanded } : it));
  };

  const handleBulkImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
        const images = parseImages(item.images);
        const variants = item.variants.filter(v => v.name.trim() !== "");

        const saveData: any = {
          id: nextId,
          name: item.name.trim(),
          te: item.te,
          rate: item.rate,
          r_v: item.r_v,
          can_weight: item.can_weight,
          pack: item.pack,
          cong: item.cong,
          total: item.total,
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
            Thêm nhiều sản phẩm chi tiết
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-3 border-b flex-shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold shrink-0">Master chung:</Label>
            <Input
              value={master}
              onChange={e => setMaster(e.target.value)}
              placeholder="Nhập tên master..."
              className="h-8 max-w-xs text-sm"
            />
            <span className="text-xs text-muted-foreground ml-auto">{validCount} sản phẩm hợp lệ</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3 bg-muted/10">
          {items.map((item, idx) => (
            <div
              key={item._id}
              className={`border bg-background rounded-lg overflow-hidden shadow-sm transition-all ${
                item.name.trim() ? "border-border" : "border-dashed border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border-b">
                <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>

                <Input
                  value={item.name}
                  onChange={e => update(item._id, 'name', e.target.value)}
                  placeholder="Tên sản phẩm *"
                  className="h-8 text-sm flex-1 min-w-0 font-medium"
                />

                <Input
                  type="number"
                  value={item.price || ""}
                  onChange={e => update(item._id, 'price', Number(e.target.value) || 0)}
                  placeholder="Giá bán VNĐ"
                  className="h-8 text-sm w-28"
                />

                <Select value={item.category} onValueChange={v => update(item._id, 'category', v)}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={item.status} onValueChange={v => update(item._id, 'status', v)}>
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                <button onClick={() => toggleExpand(item._id)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground">
                  {item.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button onClick={() => duplicateItem(item)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => removeItem(item._id)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive" disabled={items.length <= 1}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {item.expanded && (
                <div className="px-4 py-4 space-y-4 bg-background">
                  <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">📊 Quản lý cấu trúc chi phí dòng sản phẩm</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      <div>
                        <Label className="text-[10px]">Tệ</Label>
                        <Input type="number" value={item.te ?? ""} onChange={e => update(item._id, 'te', e.target.value === "" ? null : parseFloat(e.target.value))} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Rate</Label>
                        <Input type="number" value={item.rate ?? ""} onChange={e => update(item._id, 'rate', e.target.value === "" ? null : parseFloat(e.target.value))} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">R-V (Tự động)</Label>
                        <Input type="number" value={item.r_v ?? ""} readOnly className="h-7 text-xs bg-muted" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Cân</Label>
                        <Input type="number" value={item.can_weight ?? ""} onChange={e => update(item._id, 'can_weight', e.target.value === "" ? null : parseFloat(e.target.value))} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Pack</Label>
                        <Input type="number" value={item.pack ?? ""} onChange={e => update(item._id, 'pack', e.target.value === "" ? null : parseFloat(e.target.value))} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Công</Label>
                        <Input type="number" value={item.cong ?? ""} onChange={e => update(item._id, 'cong', e.target.value === "" ? null : parseFloat(e.target.value))} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Tổng phí (auto)</Label>
                        <Input type="number" value={item.total ?? ""} readOnly className="h-7 text-xs bg-muted font-bold text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Hiển thị giá</Label>
                      <Input value={item.price_display} onChange={e => update(item._id, 'price_display', e.target.value)} placeholder="VD: 150.000đ" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Tồn kho chung</Label>
                      <Input type="number" value={item.stock} onChange={e => update(item._id, 'stock', e.target.value)} placeholder="Để trống = Kho vô tận" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Hạn order</Label>
                      <Input type="datetime-local" value={item.order_deadline} onChange={e => update(item._id, 'order_deadline', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="flex items-end gap-4 h-8 pb-1">
                      <div className="flex items-center gap-1.5">
                        <Switch checked={item.deposit_allowed} onCheckedChange={v => update(item._id, 'deposit_allowed', v)} id={`dep-${item._id}`} />
                        <Label htmlFor={`dep-${item._id}`} className="text-xs cursor-pointer">Cho cọc</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={item.fees_included} onCheckedChange={v => update(item._id, 'fees_included', v)} id={`fee-${item._id}`} />
                        <Label htmlFor={`fee-${item._id}`} className="text-xs cursor-pointer">Gồm phí</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Kích thước</Label>
                      <Input value={item.size} onChange={e => update(item._id, 'size', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Bao gồm</Label>
                      <Input value={item.includes} onChange={e => update(item._id, 'includes', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Thời gian sản xuất</Label>
                      <Input value={item.production_time} onChange={e => update(item._id, 'production_time', e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="sm:col-span-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Ảnh (ngăn cách bằng dấu phẩy)</Label>
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleBulkImageUpload(item._id, e)} disabled={item.uploading} />
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline bg-primary/5 px-2 py-0.5 rounded">
                            {item.uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload R2
                          </span>
                        </label>
                      </div>
                      <Input value={item.images} onChange={e => update(item._id, 'images', e.target.value)} placeholder="Dán link hoặc bấm nút upload..." className="h-8 text-sm mt-1" disabled={item.uploading} />
                    </div>
                    <div>
                      <Label className="text-xs">Link gốc / Nguồn hàng</Label>
                      <Input value={item.link_order} onChange={e => update(item._id, 'link_order', e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground">🎨 Danh sách Phân loại biến thể chi tiết</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const currentVariants = [...item.variants];
                          currentVariants.push({ name: "", price: item.price || 0, stock: undefined, te: undefined });
                          update(item._id, 'variants', currentVariants);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Thêm phân loại
                      </Button>
                    </div>

                    {item.variants.length > 0 ? (
                      <div className="space-y-1.5">
                        {item.variants.map((v, vIdx) => (
                          <div key={vIdx} className="flex gap-2 items-center bg-background p-1.5 rounded border shadow-none">
                            <Input
                              placeholder="Tên phân loại (VD: Thỏ hồng)"
                              value={v.name}
                              onChange={e => {
                                const newVariants = [...item.variants];
                                newVariants[vIdx].name = e.target.value;
                                update(item._id, 'variants', newVariants);
                              }}
                              className="h-7 text-xs flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Giá bán VNĐ"
                              value={v.price || ""}
                              onChange={e => {
                                const newVariants = [...item.variants];
                                newVariants[vIdx].price = Number(e.target.value) || 0;
                                update(item._id, 'variants', newVariants);
                              }}
                              className="h-7 text-xs w-24"
                            />
                            <Input
                              type="number"
                              placeholder="Tồn kho"
                              value={v.stock ?? ""}
                              onChange={e => {
                                const newVariants = [...item.variants];
                                newVariants[vIdx].stock = e.target.value === "" ? undefined : parseInt(e.target.value);
                                update(item._id, 'variants', newVariants);
                              }}
                              className="h-7 text-xs w-16"
                            />
                            <Input
                              type="number"
                              placeholder="Giá Tệ (Ẩn)"
                              value={v.te ?? ""}
                              onChange={e => {
                                const newVariants = [...item.variants];
                                newVariants[vIdx].te = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                update(item._id, 'variants', newVariants);
                              }}
                              className="h-7 text-xs w-20 bg-orange-50/50 text-orange-700 border-orange-200 focus-visible:ring-orange-400"
                              title="Ghi nhận giá tệ riêng biệt cho phân loại (không hiển thị ra ngoài khách)"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => {
                                const newVariants = item.variants.filter((_, i) => i !== vIdx);
                                update(item._id, 'variants', newVariants);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">Chưa có phân loại riêng (Tính theo giá bán và kho chung bên trên).</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs">Mô tả sản phẩm</Label>
                    <Textarea value={item.description} onChange={e => update(item._id, 'description', e.target.value)} rows={2} className="text-xs mt-1" />
                  </div>
                  
                  {parseImages(item.images).length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1">
                      {parseImages(item.images).map((imgUrl, i) => (
                        <img key={i} src={imgUrl} alt="" className="w-10 h-10 object-cover rounded border bg-muted" onError={e => (e.currentTarget.style.display = 'none')} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <button onClick={addItem} className="w-full border-2 border-dashed border-muted-foreground/20 rounded-lg py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2 bg-background">
            <Plus className="h-4 w-4" /> Thêm dòng sản phẩm mới
          </button>
        </div>

        <div className="px-5 py-3 border-t flex-shrink-0 flex items-center justify-between bg-background">
          <span className="text-xs text-muted-foreground">
            {validCount > 0 ? `Sẵn sàng tạo ${validCount} sản phẩm hàng loạt` : "Cần nhập ít nhất tên sản phẩm để lưu."}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Huỷ</Button>
            <Button size="sm" onClick={handleSaveAll} disabled={saving || validCount === 0} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Lưu {validCount} sản phẩm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
