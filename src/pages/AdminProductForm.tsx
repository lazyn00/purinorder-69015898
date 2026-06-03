import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Loader2, Plus, X, ArrowLeft, Save, Upload } from "lucide-react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CATEGORIES = ["Tiệm in Purin", "Outfit & Doll", "Merch", "Linh tinh xinh xinh", "Đồ gói", "Thời trang", "Khác"];
const STATUSES = ["Sẵn", "Order", "Pre-order", "Ẩn", "Tranh slot"];
const ARTISTS = ["BTS", "BLACKPINK", "NewJeans", "Stray Kids", "SEVENTEEN", "TWICE", "aespa", "IVE", "LE SSERAFIM", "NCT", "EXO", "Red Velvet", "TXT", "ENHYPEN", "(G)I-DLE", "ITZY", "Kep1er", "NMIXX", "RIIZE", "ZEROBASEONE", "Khác"];

export default function AdminProductForm() {
  const { id: routeId } = useParams(); // Lấy ID từ URL nếu là sửa
  const isEdit = !!routeId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetchProducts } = useCart();
  const currentUser = localStorage.getItem('admin_user') || 'Admin';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Merch");
  const [subcategory, setSubcategory] = useState("");
  const [artist, setArtist] = useState("");
  const [artistCustom, setArtistCustom] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [depositAllowed, setDepositAllowed] = useState(true);
  const [feesIncluded, setFeesIncluded] = useState(true);
  const [master, setMaster] = useState("");
  const [status, setStatus] = useState("Order");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState<number | null>(null);
  const [orderDeadline, setOrderDeadline] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [includes, setIncludes] = useState("");
  const [productionTime, setProductionTime] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  
  // Chi phí
  const [te, setTe] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [canWeight, setCanWeight] = useState<number | null>(null);
  const [pack, setPack] = useState<number | null>(null);
  const [cong, setCong] = useState<number | null>(null);

  const [variantInputs, setVariantInputs] = useState<{ name: string; price: number; stock?: number; te?: number }[]>([]);
  const [imageInputs, setImageInputs] = useState<string[]>([""]);

  // Tự động tính R-V và Tổng phí chung
  const rv = useMemo(() => (te || 0) * (rate || 0), [te, rate]);
  const totalCost = useMemo(() => rv + (canWeight || 0) + (pack || 0) + (cong || 0), [rv, canWeight, pack, cong]);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProductData = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', Number(routeId)).single();
      if (error || !data) {
        toast({ title: "Lỗi", description: "Sản phẩm không tồn tại", variant: "destructive" });
        navigate('/admin');
        return;
      }
      setName(data.name);
      setCategory(data.category || "Merch");
      setSubcategory(data.subcategory || "");
      const dbArtist = data.artist || "";
      if (dbArtist && !ARTISTS.includes(dbArtist)) { setArtist("Khác"); setArtistCustom(dbArtist); }
      else { setArtist(dbArtist); }
      setPriceDisplay(data.price_display || "");
      setDepositAllowed(data.deposit_allowed ?? true);
      setFeesIncluded(data.fees_included ?? true);
      setMaster(data.master || "");
      setStatus(data.status || "Order");
      setPrice(data.price || 0);
      setStock(data.stock);
      setOrderDeadline(data.order_deadline);
      setVideoUrl((data as any).video_url || "");
      setDescription(data.description || "");
      setSize(data.size || "");
      setIncludes(data.includes || "");
      setProductionTime(data.production_time || "");
      setEditId(data.id);
      setTe(data.te);
      setRate(data.rate);
      setCanWeight(data.can_weight);
      setPack(data.pack);
      setCong(data.cong);
      setImageInputs(Array.isArray(data.images) && data.images.length > 0 ? (data.images as any[]).map(String) : [""]);
      setVariantInputs(Array.isArray(data.variants) ? (data.variants as any[]) : []);
      setLoading(false);
    };
    fetchProductData();
  }, [routeId, isEdit]);

  const handleSave = async () => {
    if (!name.trim()) return toast({ title: "Lỗi", description: "Vui lòng nhập tên sản phẩm", variant: "destructive" });
    setSaving(true);
    try {
      const images = imageInputs.filter(u => u.trim());
      const variants = variantInputs.filter(v => v.name.trim());

      const saveData: any = {
        name, te, rate, r_v: rv || null, can_weight: canWeight, pack, cong, total: totalCost || null,
        price, category, status, stock, variants, images, master: master.trim() || null,
        price_display: `${price.toLocaleString('vi-VN')}đ`,
        order_deadline: orderDeadline ? new Date(orderDeadline).toISOString() : null,
        video_url: videoUrl.trim() || null,
        description: description.trim() || null,
        size: size.trim() || null,
        includes: includes.trim() || null,
        production_time: productionTime.trim() || null,
      };

      if (isEdit) {
        const originalId = Number(routeId);
        const newId = editId ?? originalId;
        if (newId !== originalId) {
          // Đổi ID: kiểm tra ID mới chưa tồn tại
          const { data: existsData } = await supabase.from('products').select('id').eq('id', newId).maybeSingle();
          if (existsData) throw new Error(`ID #${newId} đã tồn tại, vui lòng chọn ID khác`);

          const { error: insErr } = await supabase.from('products').insert({ ...saveData, id: newId, owner: currentUser });
          if (insErr) throw insErr;
          const { error: delErr } = await supabase.from('products').delete().eq('id', originalId);
          if (delErr) throw delErr;
          toast({ title: "Thành công", description: `Đã đổi ID #${originalId} → #${newId}` });
        } else {
          const { error } = await supabase.from('products').update(saveData).eq('id', originalId);
          if (error) throw error;
          toast({ title: "Thành công", description: "Đã cập nhật sản phẩm" });
        }
      } else {
        const { data: maxData } = await supabase.from('products').select('id').order('id', { ascending: false }).limit(1);
        const nextId = ((maxData?.[0] as any)?.id || 0) + 1;
        const { error } = await supabase.from('products').insert({ ...saveData, id: nextId, owner: currentUser });
        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm sản phẩm mới" });
      }


      refetchProducts();
      navigate('/admin'); // Lưu xong nhảy về trang quản lý chính
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      const r2Client = new S3Client({
        region: "auto",
        endpoint: import.meta.env.VITE_R2_ENDPOINT,
        credentials: { accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY, secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY },
      });
      for (const file of Array.from(files)) {
        const fileName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop() || 'jpg'}`;
        const arrayBuffer = await file.arrayBuffer();
        await r2Client.send(new PutObjectCommand({ Bucket: "product-images", Key: fileName, Body: new Uint8Array(arrayBuffer), ContentType: file.type }));
        newUrls.push(`${import.meta.env.VITE_R2_PUBLIC_URL}/${fileName}`);
      }
      setImageInputs(prev => [...prev.filter(u => u.trim()), ...newUrls, ""]);
    } catch (error: any) {
      toast({ title: "Lỗi upload", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 border-b pb-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl font-semibold">{isEdit ? `Chỉnh sửa sản phẩm #${routeId}` : "Thêm sản phẩm mới"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Tên sản phẩm *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên..." />
              </div>
              <div>
                <Label>Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Master</Label>
                <Input value={master} onChange={e => setMaster(e.target.value)} placeholder="Tên Master..." />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Chi phí sản phẩm chung</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 bg-muted/30 p-3 rounded-lg border">
                <div><Label className="text-xs">Tệ</Label><Input type="number" value={te ?? ""} onChange={e => setTe(e.target.value === "" ? null : parseFloat(e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Rate</Label><Input type="number" value={rate ?? ""} onChange={e => setRate(e.target.value === "" ? null : parseFloat(e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">R-V</Label><Input type="number" value={rv ?? ""} readOnly className="h-8 text-sm bg-muted font-mono" /></div>
                <div><Label className="text-xs">Cân</Label><Input type="number" value={canWeight ?? ""} onChange={e => setCanWeight(e.target.value === "" ? null : parseFloat(e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Pack</Label><Input type="number" value={pack ?? ""} onChange={e => setPack(e.target.value === "" ? null : parseFloat(e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Công</Label><Input type="number" value={cong ?? ""} onChange={e => setCong(e.target.value === "" ? null : parseFloat(e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Tổng phí</Label><Input type="number" value={totalCost ?? ""} readOnly className="h-8 text-sm bg-muted font-mono" /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><Label>Giá bán VNĐ *</Label><Input type="number" value={price || ""} onChange={e => setPrice(Number(e.target.value) || 0)} /></div>
              <div><Label>Tồn kho chung</Label><Input type="number" value={stock ?? ""} onChange={e => setStock(e.target.value === "" ? null : parseInt(e.target.value))} /></div>
              <div><Label>Hạn order</Label><Input type="datetime-local" value={orderDeadline ? new Date(orderDeadline).toISOString().slice(0, 16) : ""} onChange={e => setOrderDeadline(e.target.value ? new Date(e.target.value).toISOString() : null)} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label>Kích thước</Label><Input value={size} onChange={e => setSize(e.target.value)} placeholder="VD: 10x15cm" /></div>
              <div><Label>Bao gồm</Label><Input value={includes} onChange={e => setIncludes(e.target.value)} placeholder="VD: 1 hộp + 1 thẻ" /></div>
              <div><Label>Thời gian sản xuất</Label><Input value={productionTime} onChange={e => setProductionTime(e.target.value)} placeholder="VD: 30-45 ngày" /></div>
            </div>

            <div>
              <Label>Link Video (Drive/YouTube) — hiển thị trước ảnh trong trang chi tiết</Label>
              <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1" />
            </div>

            <div>
              <Label>Mô tả sản phẩm</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1" placeholder="Mô tả..." />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Phân loại chi tiết sản phẩm (Variants)</Label>
                <Button variant="outline" size="sm" onClick={() => setVariantInputs(prev => [...prev, { name: "", price: price || 0, stock: undefined, te: undefined }])}><Plus className="h-3 w-3 mr-1" /> Thêm phân loại</Button>
              </div>
              <div className="space-y-2 border p-2 rounded-lg bg-slate-50/30 max-h-60 overflow-y-auto">
                {variantInputs.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-1.5 border rounded shadow-sm">
                    <Input placeholder="Tên phân loại" value={v.name} onChange={e => { const n = [...variantInputs]; n[idx].name = e.target.value; setVariantInputs(n); }} className="h-8 text-xs flex-1" />
                    <Input type="number" placeholder="Giá bán VNĐ" value={v.price || ""} onChange={e => { const n = [...variantInputs]; n[idx].price = Number(e.target.value) || 0; setVariantInputs(n); }} className="h-8 text-xs w-24" />
                    <Input type="number" placeholder="Kho" value={v.stock ?? ""} onChange={e => { const n = [...variantInputs]; n[idx].stock = e.target.value === "" ? undefined : Number(e.target.value); setVariantInputs(n); }} className="h-8 text-xs w-16" />
                    <Input type="number" placeholder="Giá Tệ (Ẩn)" value={v.te ?? ""} onChange={e => { const n = [...variantInputs]; n[idx].te = e.target.value === "" ? undefined : parseFloat(e.target.value); setVariantInputs(n); }} className="h-8 text-xs w-16 bg-orange-50 text-orange-800" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setVariantInputs(prev => prev.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Hình ảnh sản phẩm</Label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-bold bg-primary/5 px-2 py-1 rounded hover:underline"><Upload className="h-3.5 w-3.5" /> Tải lên R2</span>
                </label>
              </div>
              <div className="space-y-2 mt-2">
                {imageInputs.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input value={url} onChange={e => { const n = [...imageInputs]; n[idx] = e.target.value; setImageInputs(n); }} placeholder="https://..." className="h-8 text-sm" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setImageInputs(prev => prev.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => setImageInputs(prev => [...prev, ""])} className="p-0 h-6 text-xs text-primary">+ Thêm ô nhập link ảnh</Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate('/admin')}>Hủy bỏ</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Lưu sản phẩm</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
