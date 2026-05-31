import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { RefreshCw, Plus, Pencil, Search, Loader2, Trash2, X, Copy, Download, EyeOff, Eye, Upload, ImageIcon, GripVertical, Link, Layers } from "lucide-react";
import { ProductExportButtons } from "./ProductExportButtons";
import { InAppUploadNotice } from "./InAppBrowserBanner";

// --- IMPORT FORM THÊM SẢN PHẨM HÀNG LOẠT ---
import BulkProductForm from "./BulkProductForm";

// --- IMPORT AWS SDK CHO CLOUDFLARE R2 ---
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface SupabaseProduct {
  id: number;
  name: string;
  te: number | null;
  rate: number | null;
  r_v: number | null;
  can_weight: number | null;
  pack: number | null;
  cong: number | null;
  total: number | null;
  price: number;
  price_display: string | null;
  deposit_allowed: boolean | null;
  fees_included: boolean | null;
  category: string | null;
  subcategory: string | null;
  artist: string | null;
  status: string | null;
  order_deadline: string | null;
  images: any;
  description: string | null;
  size: string | null;
  includes: string | null;
  production_time: string | null;
  master: string | null;
  variants: any;
  option_groups: any;
  variant_image_map: any;
  stock: number | null;
  link_order: string | null;
  proof: string | null;
  actual_rate: number | null;
  actual_can: number | null;
  actual_pack: number | null;
  chenh: number | null;
  created_at: string | null;
  updated_at: string | null;
}

type ProductFormData = Omit<SupabaseProduct, 'id' | 'created_at' | 'updated_at'>;

const CATEGORIES = ["Tiệm in Purin", "Outfit & Doll", "Merch", "Linh tinh xinh xinh", "Đồ gói", "Thời trang", "Khác"];
const STATUSES = ["Sẵn", "Order", "Pre-order", "Ẩn", "Tranh slot"];

const emptyForm: ProductFormData = {
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
  deposit_allowed: true,
  fees_included: true,
  category: "Merch",
  subcategory: "",
  artist: "",
  status: "Order",
  order_deadline: null,
  images: [],
  description: "",
  size: null,
  includes: null,
  production_time: null,
  master: null,
  variants: [],
  option_groups: [],
  variant_image_map: {},
  stock: null,
  link_order: null,
  proof: null,
  actual_rate: null,
  actual_can: null,
  actual_pack: null,
  chenh: null,
};

const getDeadlineStatus = (product: SupabaseProduct) => {
  if (!product.order_deadline) return { label: "Không có hạn", color: "bg-gray-100 text-gray-700", priority: 2 };
  const deadline = new Date(product.order_deadline);
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return { label: "Hết hạn", color: "bg-red-100 text-red-700", priority: 4 };
  if (diffHours < 48) return { label: "Sắp đóng order", color: "bg-orange-100 text-orange-700", priority: 0 };
  return { label: "Còn hạn", color: "bg-green-100 text-green-700", priority: 1 };
};

const getAvailableStock = (product: SupabaseProduct): number => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariantStock = variants.some((v: any) => v?.stock !== undefined && v?.stock !== null);

  if (hasVariantStock) {
    return variants
      .filter((v: any) => v?.stock !== undefined && v?.stock !== null)
      .reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);
  }

  if (product.stock === null || product.stock === undefined) return 0;
  return Number(product.stock || 0);
};

const getStockStatus = (product: SupabaseProduct) => {
  const availableStock = getAvailableStock(product);
  if (availableStock <= 0) return { label: "Hết hàng", color: "bg-red-100 text-red-700" };
  if (availableStock <= 5) return { label: `Còn ${availableStock}`, color: "bg-orange-100 text-orange-700" };
  return { label: `Còn ${availableStock}`, color: "bg-green-100 text-green-700" };
};

interface ProductManagementProps {
  currentUser?: string;
}

export default function ProductManagement({ currentUser = "Admin" }: ProductManagementProps) {
  const { refetchProducts } = useCart();
  const { toast } = useToast();
  
  const [dbProducts, setDbProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [masterFilter, setMasterFilter] = useState("all");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [originalId, setOriginalId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>({ ...emptyForm });
  
  const [variantInputs, setVariantInputs] = useState<{ name: string; price: number; stock?: number; te?: number }[]>([]);
  const [optionGroupInputs, setOptionGroupInputs] = useState<{ name: string; options: string }[]>([]);
  const [imageInputs, setImageInputs] = useState<string[]>([]);

  const DRAFT_KEY = `product_draft_${currentUser}`;
  
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);

  const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzRmnozhdbiATR3APhnQvMQi4fIdDs6Fvr15gsfQO6sd7UoF8cs9yAOpMO2j1Re7P9V8A/exec";

  const fetchDbProducts = async () => {
    setLoading(true);
    try {
      let query: any = supabase.from('products').select('*').order('id', { ascending: false });
      if (currentUser) query = query.eq('owner', currentUser);
      const { data, error } = await query;
      if (error) throw error;
      setDbProducts((data as SupabaseProduct[]) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: "Lỗi", description: "Không thể tải sản phẩm", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const syncFromSheet = async () => {
    setSyncing(true);
    setSyncProgress(0);
    try {
      toast({ title: "Đang tải từ Sheet...", description: "Vui lòng chờ" });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(GAS_PRODUCTS_URL, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error("Không có dữ liệu sản phẩm từ Sheet");
      }

      const sheetProducts = data.products;
      let synced = 0;
      
      for (let i = 0; i < sheetProducts.length; i++) {
        const p = sheetProducts[i];
        setSyncProgress(Math.round(((i + 1) / sheetProducts.length) * 100));
        
        let variants = p.variants || [];
        if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
        let images = p.images || [];
        if (typeof images === 'string') try { images = JSON.parse(images); } catch { images = []; }
        let optionGroups = p.optionGroups || p.option_groups || [];
        if (typeof optionGroups === 'string') try { optionGroups = JSON.parse(optionGroups); } catch { optionGroups = []; }
        let variantImageMap = p.variantImageMap || p.variant_image_map || {};
        if (typeof variantImageMap === 'string') try { variantImageMap = JSON.parse(variantImageMap); } catch { variantImageMap = {}; }

        const upsertData: any = {
          id: p.id,
          name: p.name || '',
          price: p.price || 0,
          price_display: p.priceDisplay || p.price_display || `${(p.price || 0).toLocaleString('vi-VN')}đ`,
          description: Array.isArray(p.description) ? p.description.join('\n') : (p.description || null),
          images: images,
          category: p.category || null,
          subcategory: p.subcategory || null,
          artist: p.artist || null,
          variants: variants,
          option_groups: optionGroups,
          variant_image_map: variantImageMap,
          fees_included: p.feesIncluded ?? true,
          master: p.master || null,
          status: p.status || 'Sẵn',
          order_deadline: p.orderDeadline || null,
          stock: p.stock ?? null,
          production_time: p.production_time || null,
          size: p.size || null,
          includes: p.includes || null,
          cong: p.cong ?? null,
        };

        const { error } = await supabase
          .from('products')
          .upsert(upsertData, { onConflict: 'id' });
        
        if (error) {
          console.error(`Error upserting product ${p.id}:`, error);
        } else {
          synced++;
        }
      }

      toast({ 
        title: "Đồng bộ hoàn tất!", 
        description: `${synced}/${sheetProducts.length} sản phẩm đã được đồng bộ vào database` 
      });
      
      fetchDbProducts();
      refetchProducts();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({ title: "Lỗi đồng bộ", description: error.message || "Không thể kết nối Google Sheets", variant: "destructive" });
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  useEffect(() => { fetchDbProducts(); }, []);

  useEffect(() => {
    const te = form.te || 0;
    const rate = form.rate || 0;
    const can = form.can_weight || 0;
    const pack = form.pack || 0;
    const cong = form.cong || 0;
    
    const rv = te * rate;
    const total = rv + can + pack + cong;
    
    setForm(prev => ({ ...prev, r_v: rv || null, total: total || null }));
  }, [form.te, form.rate, form.can_weight, form.pack, form.cong]);

  useEffect(() => {
    const te = form.te || 0;
    const actualRate = form.actual_rate || form.rate || 0;
    const actualCan = form.actual_can || form.can_weight || 0;
    const actualPack = form.actual_pack || form.pack || 0;
    const cong = form.cong || 0;
    
    const actualCost = (te * actualRate) + actualCan + actualPack + cong;
    const chenh = form.price - actualCost;
    
    setForm(prev => ({ ...prev, chenh: chenh || null }));
  }, [form.price, form.te, form.actual_rate, form.actual_can, form.actual_pack, form.rate, form.can_weight, form.pack, form.cong]);

  const sortedProducts = useMemo(() => {
    let filtered = dbProducts.filter(p => {
      const matchSearch = searchTerm === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.id).includes(searchTerm);
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchMaster = masterFilter === "all" || (p.master?.toLowerCase().includes(masterFilter.toLowerCase()) ?? false);
      return matchSearch && matchCategory && matchStatus && matchMaster;
    });

    return filtered.sort((a, b) => {
      const aOutOfStock = getAvailableStock(a) <= 0;
      const bOutOfStock = getAvailableStock(b) <= 0;
      const aHidden = a.status === "Ẩn";
      const bHidden = b.status === "Ẩn";
      const aPriority = aHidden ? 6 : aOutOfStock ? 5 : getDeadlineStatus(a).priority;
      const bPriority = bHidden ? 6 : bOutOfStock ? 5 : getDeadlineStatus(b).priority;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.id - a.id;
    });
  }, [dbProducts, searchTerm, categoryFilter, statusFilter, masterFilter]);

  const openAddForm = () => {
    setEditingId(null);
    setOriginalId(null);
    setForm({ ...emptyForm });
    setVariantInputs([]);
    setOptionGroupInputs([]);
    setImageInputs([""]);
    setShowForm(true);
  };

  const openEditForm = (product: SupabaseProduct) => {
    setEditingId(product.id);
    setOriginalId(product.id);
    
    setForm({
      name: product.name,
      te: product.te,
      rate: product.rate,
      r_v: product.r_v,
      can_weight: product.can_weight,
      pack: product.pack,
      cong: product.cong,
      total: product.total,
      price: product.price,
      price_display: product.price_display,
      deposit_allowed: product.deposit_allowed ?? true,
      fees_included: product.fees_included ?? true,
      category: product.category || "Merch",
      subcategory: product.subcategory || "",
      artist: product.artist || "",
      status: product.status || "Order",
      order_deadline: product.order_deadline,
      images: product.images || [],
      description: product.description || "",
      size: product.size,
      includes: product.includes,
      production_time: product.production_time,
      master: product.master,
      variants: product.variants || [],
      option_groups: product.option_groups || [],
      variant_image_map: product.variant_image_map || {},
      stock: product.stock,
      link_order: product.link_order,
      proof: product.proof,
      actual_rate: product.actual_rate,
      actual_can: product.actual_can,
      actual_pack: product.actual_pack,
      chenh: product.chenh,
    });
    
    const imgs = Array.isArray(product.images) ? product.images as string[] : [];
    setImageInputs(imgs.length > 0 ? imgs : [""]);
    
    const variants = Array.isArray(product.variants) ? product.variants : [];
    setVariantInputs(variants.map((v: any) => ({ name: v.name || "", price: v.price || 0, stock: v.stock, te: v.te })));
    
    const optGroups = Array.isArray(product.option_groups) ? product.option_groups : [];
    setOptionGroupInputs(optGroups.map((g: any) => ({ name: g.name || "", options: (g.options || []).join(", ") })));
    
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Lỗi", description: "Tên sản phẩm không được để trống", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const images = imageInputs.filter(url => url.trim() !== "");
      const variants = variantInputs.filter(v => v.name.trim() !== "");
      const optionGroups = optionGroupInputs
        .filter(g => g.name.trim() !== "")
        .map(g => ({ name: g.name, options: g.options.split(",").map(o => o.trim()).filter(Boolean) }));

      const saveData: any = {
        name: form.name,
        te: form.te,
        rate: form.rate,
        r_v: form.r_v,
        can_weight: form.can_weight,
        pack: form.pack,
        cong: form.cong,
        total: form.total,
        price: form.price || 0,
        price_display: form.price_display || `${(form.price || 0).toLocaleString('vi-VN')}đ`,
        deposit_allowed: form.deposit_allowed,
        fees_included: form.fees_included,
        category: form.category,
        subcategory: form.subcategory || null,
        artist: form.artist || null,
        status: form.status,
        order_deadline: form.order_deadline || null,
        images: images,
        description: form.description || null,
        size: form.size || null,
        includes: form.includes || null,
        production_time: form.production_time || null,
        master: form.master || null,
        variants: variants,
        option_groups: optionGroups,
        variant_image_map: form.variant_image_map || {},
        stock: form.stock,
        link_order: form.link_order || null,
        proof: form.proof || null,
        actual_rate: form.actual_rate,
        actual_can: form.actual_can,
        actual_pack: form.actual_pack,
        chenh: form.chenh,
      };

      if (editingId) {
        const isChangingId = editingId !== originalId;
        if (isChangingId) {
          const { error: insertError } = await supabase.from('products').insert({ ...saveData, id: editingId, owner: currentUser || 'Admin' } as any);
          if (insertError) throw insertError;
          const { error: deleteError } = await supabase.from('products').delete().eq('id', originalId);
          if (deleteError) throw deleteError;
        } else {
          const { error } = await supabase.from('products').update(saveData).eq('id', editingId);
          if (error) throw error;
        }
      } else {
        const maxId = dbProducts.length > 0 ? Math.max(...dbProducts.map(p => p.id)) : 0;
        const { error } = await supabase.from('products').insert({ ...saveData, id: maxId + 1, owner: currentUser || 'Admin' } as any);
        if (error) throw error;
      }

      setShowForm(false);
      fetchDbProducts();
      refetchProducts();
      toast({ title: "Đã lưu thành công" });
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm #${id}?`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setDbProducts(prev => prev.filter(p => p.id !== id));
      refetchProducts();
      toast({ title: "Đã xóa sản phẩm" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể xóa sản phẩm", variant: "destructive" });
    }
  };

  const duplicateProduct = (product: SupabaseProduct) => {
    setEditingId(null);
    setOriginalId(null);
    setForm({ ...product, name: `${product.name} (Copy)` });
    const imgs = Array.isArray(product.images) ? product.images as string[] : [];
    setImageInputs(imgs.length > 0 ? imgs : [""]);
    const variants = Array.isArray(product.variants) ? product.variants : [];
    setVariantInputs(variants.map((v: any) => ({ name: v.name || "", price: v.price || 0, stock: v.stock, te: v.te })));
    const optGroups = Array.isArray(product.option_groups) ? product.option_groups : [];
    setOptionGroupInputs(optGroups.map((g: any) => ({ name: g.name || "", options: (g.options || []).join(", ") })));
    setShowForm(true);
  };

  const toggleHideProduct = async (product: SupabaseProduct) => {
    const newStatus = product.status === "Ẩn" ? "Sẵn" : "Ẩn";
    try {
      const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
      if (error) throw error;
      setDbProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
      refetchProducts();
    } catch {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
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

  const updateNum = (field: keyof ProductFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm ID, tên, artist..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-9 w-48" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Danh mục" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả DM</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả TT</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm master..." value={masterFilter === "all" ? "" : masterFilter} onChange={e => setMasterFilter(e.target.value || "all")} className="pl-8 h-9 w-36" />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowBulkForm(true)} variant="outline" className="gap-1"><Layers className="h-4 w-4" /> Thêm nhiều SP</Button>
          <Button size="sm" onClick={openAddForm} className="gap-1"><Plus className="h-4 w-4" /> Thêm SP</Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead className="text-right w-24">Giá</TableHead>
              <TableHead className="w-20">Tồn kho</TableHead>
              <TableHead className="w-28">Hạn order</TableHead>
              <TableHead className="w-20">Loại</TableHead>
              <TableHead className="w-20 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-xs">{product.id}</TableCell>
                <TableCell>
                  {product.images?.[0] ? <img src={product.images[0]} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">N/A</div>}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                    <div className="flex gap-1 flex-wrap">
                      {product.category && <Badge variant="outline" className="text-[10px] px-1 py-0">{product.category}</Badge>}
                      {product.master && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 px-1 py-0">M: {product.master}</Badge>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-sm">{product.price.toLocaleString('vi-VN')}đ</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{getStockStatus(product).label}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{getDeadlineStatus(product).label}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{product.status || "—"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end items-center">
                    <ProductExportButtons product={product as any} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProduct(product)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleHideProduct(product)}>{product.status === "Ẩn" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(product)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? `Chỉnh sửa sản phẩm #${editingId}` : "Thêm sản phẩm mới"}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Tên sản phẩm *</Label>
                <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category || ""} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Master</Label>
                <Input value={form.master || ""} onChange={e => setForm(prev => ({ ...prev, master: e.target.value }))} />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Chi phí sản phẩm chung</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div><Label className="text-xs">Tệ</Label><Input type="number" value={form.te ?? ""} onChange={e => updateNum('te', e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Rate</Label><Input type="number" value={form.rate ?? ""} onChange={e => updateNum('rate', e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">R-V</Label><Input type="number" value={form.r_v ?? ""} readOnly className="h-8 text-sm bg-muted" /></div>
                <div><Label className="text-xs">Cân</Label><Input type="number" value={form.can_weight ?? ""} onChange={e => updateNum('can_weight', e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Pack</Label><Input type="number" value={form.pack ?? ""} onChange={e => updateNum('pack', e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Công</Label><Input type="number" value={form.cong ?? ""} onChange={e => updateNum('cong', e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Tổng phí</Label><Input type="number" value={form.total ?? ""} readOnly className="h-8 text-sm bg-muted" /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label className="text-xs">Giá bán *</Label><Input type="number" value={form.price || ""} onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Tồn kho</Label><Input type="number" value={form.stock ?? ""} onChange={e => updateNum('stock', e.target.value)} className="h-8 text-sm" /></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Phân loại chi tiết sản phẩm (Variants)</Label>
                <Button variant="outline" size="sm" onClick={() => setVariantInputs(prev => [...prev, { name: "", price: form.price || 0, stock: undefined, te: undefined }])}><Plus className="h-3 w-3 mr-1" /> Thêm phân loại</Button>
              </div>
              <div className="space-y-2">
                {variantInputs.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input placeholder="Tên phân loại" value={v.name} onChange={e => { const n = [...variantInputs]; n[idx].name = e.target.value; setVariantInputs(n); }} className="h-8 text-sm flex-1" />
                    <Input type="number" placeholder="Giá bán VNĐ" value={v.price || ""} onChange={e => { const n = [...variantInputs]; n[idx].price = Number(e.target.value) || 0; setVariantInputs(n); }} className="h-8 text-sm w-28" />
                    <Input type="number" placeholder="Kho" value={v.stock ?? ""} onChange={e => { const n = [...variantInputs]; n[idx].stock = e.target.value === "" ? undefined : Number(e.target.value); setVariantInputs(n); }} className="h-8 text-sm w-16" />
                    <Input type="number" placeholder="Giá Tệ (Ẩn)" value={v.te ?? ""} onChange={e => { const n = [...variantInputs]; n[idx].te = e.target.value === "" ? undefined : parseFloat(e.target.value); setVariantInputs(n); }} className="h-8 text-sm w-20 bg-orange-50 text-orange-800 border-orange-200" title="Ghi nhận giá tệ riêng biệt cho phân loại" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setVariantInputs(prev => prev.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu thay đổi</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BulkProductForm open={showBulkForm} onClose={() => { setShowBulkForm(false); fetchDbProducts(); }} currentUser={currentUser} />
    </div>
  );
}
