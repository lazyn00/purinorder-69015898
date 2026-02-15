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
import { RefreshCw, Plus, Pencil, Search, Loader2, Trash2, X, Copy, Download, EyeOff, Eye, Upload, ImageIcon, GripVertical, Link } from "lucide-react";

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

const CATEGORIES = ["Tiệm in Purin", "Outfit & Doll", "Merch", "Thời trang", "Khác"];
const STATUSES = ["Sẵn", "Order", "Pre-order", "Ẩn"];

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

// Helper: get deadline status
const getDeadlineStatus = (product: SupabaseProduct) => {
  if (!product.order_deadline) return { label: "Không có hạn", color: "bg-gray-100 text-gray-700", priority: 2 };
  const deadline = new Date(product.order_deadline);
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return { label: "Hết hạn", color: "bg-red-100 text-red-700", priority: 4 };
  if (diffHours < 48) return { label: "Sắp đóng order", color: "bg-orange-100 text-orange-700", priority: 0 };
  return { label: "Còn hạn", color: "bg-green-100 text-green-700", priority: 1 };
};

// Helper: check stock status
const getStockStatus = (product: SupabaseProduct) => {
  if (product.stock === null || product.stock === undefined) return null;
  if (product.stock <= 0) return { label: "Hết hàng", color: "bg-red-100 text-red-700" };
  if (product.stock <= 5) return { label: `Còn ${product.stock}`, color: "bg-orange-100 text-orange-700" };
  return { label: `Còn ${product.stock}`, color: "bg-green-100 text-green-700" };
};

export default function ProductManagement() {
  const { refetchProducts } = useCart();
  const { toast } = useToast();
  
  const [dbProducts, setDbProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>({ ...emptyForm });
  
  // Variant editing
  const [variantInputs, setVariantInputs] = useState<{ name: string; price: number; stock?: number }[]>([]);
  // Option groups editing
  const [optionGroupInputs, setOptionGroupInputs] = useState<{ name: string; options: string }[]>([]);
  // Images editing
  const [imageInputs, setImageInputs] = useState<string[]>([]);
  
  // Sync from sheet
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  // Sync images to storage
  const [syncingImages, setSyncingImages] = useState(false);

  const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzRmnozhdbiATR3APhnQvMQi4fIdDs6Fvr15gsfQO6sd7UoF8cs9yAOpMO2j1Re7P9V8A/exec";

  const fetchDbProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });
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
        
        // Parse fields
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
          production_time: p.productionTime || p.production_time || null,
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

  // Auto-calculate r_v and total
  useEffect(() => {
    const te = form.te || 0;
    const rate = form.rate || 0;
    const can = form.can_weight || 0;
    const pack = form.pack || 0;
    const cong = form.cong || 0;
    
    const rv = te * rate;
    const total = rv + can + pack + cong;
    
    setForm(prev => ({
      ...prev,
      r_v: rv || null,
      total: total || null,
    }));
  }, [form.te, form.rate, form.can_weight, form.pack, form.cong]);

  // Auto-calculate chênh
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
      return matchSearch && matchCategory && matchStatus;
    });

    return filtered.sort((a, b) => {
      // Out of stock items go to bottom (before expired)
      const aOutOfStock = (a.stock !== null && a.stock !== undefined && a.stock <= 0);
      const bOutOfStock = (b.stock !== null && b.stock !== undefined && b.stock <= 0);
      const aPriority = aOutOfStock ? 3 : getDeadlineStatus(a).priority;
      const bPriority = bOutOfStock ? 3 : getDeadlineStatus(b).priority;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.id - a.id;
    });
  }, [dbProducts, searchTerm, categoryFilter, statusFilter]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setVariantInputs([]);
    setOptionGroupInputs([]);
    setImageInputs([""]);
    setShowForm(true);
  };

  const openEditForm = (product: SupabaseProduct) => {
    setEditingId(product.id);
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
    setVariantInputs(variants.map((v: any) => ({ name: v.name || "", price: v.price || 0, stock: v.stock })));
    
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
        const { error } = await supabase
          .from('products')
          .update(saveData)
          .eq('id', editingId);
        if (error) throw error;
        toast({ title: "Đã cập nhật", description: `Sản phẩm #${editingId} đã được lưu` });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(saveData);
        if (error) throw error;
        toast({ title: "Đã thêm", description: "Sản phẩm mới đã được tạo" });
      }

      setShowForm(false);
      fetchDbProducts();
      refetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ title: "Lỗi", description: error.message || "Không thể lưu sản phẩm", variant: "destructive" });
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
      toast({ title: "Đã xóa", description: `Sản phẩm #${id} đã bị xóa` });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa sản phẩm", variant: "destructive" });
    }
  };

  const applyUniformPrice = () => {
    if (variantInputs.length === 0) return;
    const price = variantInputs[0].price;
    setVariantInputs(prev => prev.map(v => ({ ...v, price })));
  };

  // Copy / Duplicate product
  const duplicateProduct = (product: SupabaseProduct) => {
    setEditingId(null);
    setForm({
      name: `${product.name} (Copy)`,
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
    setVariantInputs(variants.map((v: any) => ({ name: v.name || "", price: v.price || 0, stock: v.stock })));
    const optGroups = Array.isArray(product.option_groups) ? product.option_groups : [];
    setOptionGroupInputs(optGroups.map((g: any) => ({ name: g.name || "", options: (g.options || []).join(", ") })));
    setShowForm(true);
    toast({ title: "Đã sao chép", description: `Đang tạo bản sao của "${product.name}"` });
  };

  // Toggle hide/show product
  const toggleHideProduct = async (product: SupabaseProduct) => {
    const newStatus = product.status === "Ẩn" ? "Sẵn" : "Ẩn";
    try {
      const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
      if (error) throw error;
      setDbProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
      refetchProducts();
      toast({ title: newStatus === "Ẩn" ? "Đã ẩn" : "Đã hiện", description: `Sản phẩm #${product.id} ${newStatus === "Ẩn" ? "đã bị ẩn" : "đã hiện lại"}` });
    } catch {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
    }
  };

  // Upload image file to storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const timestamp = Date.now();
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `upload-${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { contentType: file.type, upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
      setImageInputs(prev => {
        const cleaned = prev.filter(u => u.trim() !== "");
        return [...cleaned, ...newUrls, ""];
      });
      toast({ title: "Đã tải lên", description: `${newUrls.length} ảnh đã được upload` });
    } catch (error: any) {
      toast({ title: "Lỗi upload", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Sync all external images to storage
  const syncAllImagesToStorage = async () => {
    setSyncingImages(true);
    try {
      const productsWithExternal = dbProducts.filter(p => {
        const imgs = Array.isArray(p.images) ? p.images as string[] : [];
        return imgs.some(url => !url.includes('supabase.co/storage'));
      });
      if (productsWithExternal.length === 0) {
        toast({ title: "Hoàn tất", description: "Tất cả ảnh đã nằm trên storage" });
        setSyncingImages(false);
        return;
      }
      let synced = 0;
      for (const product of productsWithExternal) {
        const { error } = await supabase.functions.invoke('sync-images-to-storage', {
          body: { imageUrls: product.images, productId: product.id, productName: product.name }
        });
        if (!error) synced++;
      }
      toast({ title: "Đồng bộ ảnh hoàn tất", description: `${synced}/${productsWithExternal.length} sản phẩm đã được sync` });
      fetchDbProducts();
      refetchProducts();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setSyncingImages(false);
    }
  };

  const updateNum = (field: keyof ProductFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm ID, tên, artist..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-9 w-48"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả DM</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả TT</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={syncFromSheet} disabled={syncing} className="gap-1">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {syncing ? "Đang đồng bộ..." : "Sync từ Sheet"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDbProducts} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Tải lại
          </Button>
          <Button variant="outline" size="sm" onClick={syncAllImagesToStorage} disabled={syncingImages} className="gap-1">
            {syncingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            {syncingImages ? "Đang sync ảnh..." : "Sync ảnh"}
          </Button>
          <Button size="sm" onClick={openAddForm} className="gap-1">
            <Plus className="h-4 w-4" /> Thêm SP
          </Button>
        </div>
      </div>

      {syncing && (
        <div className="space-y-1">
          <Progress value={syncProgress} />
          <p className="text-xs text-muted-foreground text-center">{syncProgress}%</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Hiển thị {sortedProducts.length} / {dbProducts.length} sản phẩm
      </p>

      {/* Products Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead className="min-w-[200px]">Tên</TableHead>
              <TableHead className="text-right w-24">Giá</TableHead>
              <TableHead className="w-20">Tồn kho</TableHead>
              <TableHead className="w-28">Hạn order</TableHead>
              <TableHead className="w-20">Loại</TableHead>
              <TableHead className="w-20 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map(product => {
              const deadlineStatus = getDeadlineStatus(product);
              const stockStatus = getStockStatus(product);
              const coverImage = Array.isArray(product.images) && product.images.length > 0 
                ? product.images[0] as string : null;
              
              return (
                <TableRow key={product.id} className={deadlineStatus.priority === 4 ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs">{product.id}</TableCell>
                  <TableCell>
                    {coverImage ? (
                      <img src={coverImage} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                      <div className="flex gap-1 flex-wrap">
                        {product.category && <Badge variant="outline" className="text-[10px] px-1 py-0">{product.category}</Badge>}
                        {product.artist && <span className="text-[10px] text-muted-foreground">{product.artist}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {product.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>
                    {stockStatus ? (
                      <Badge variant="secondary" className={`text-[10px] ${stockStatus.color}`}>{stockStatus.label}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${deadlineStatus.color}`}>
                      {deadlineStatus.label}
                    </Badge>
                    {product.order_deadline && deadlineStatus.priority < 4 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(product.order_deadline).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{product.status || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProduct(product)} title="Sao chép">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleHideProduct(product)} title={product.status === "Ẩn" ? "Hiện lại" : "Ẩn"}>
                        {product.status === "Ẩn" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Chỉnh sửa sản phẩm #${editingId}` : "Thêm sản phẩm mới"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Tên sản phẩm *</Label>
                <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category || ""} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Danh mục phụ</Label>
                <Input value={form.subcategory || ""} onChange={e => setForm(prev => ({ ...prev, subcategory: e.target.value }))} />
              </div>
              <div>
                <Label>Artist</Label>
                <Input value={form.artist || ""} onChange={e => setForm(prev => ({ ...prev, artist: e.target.value }))} />
              </div>
              <div>
                <Label>Master</Label>
                <Input value={form.master || ""} onChange={e => setForm(prev => ({ ...prev, master: e.target.value }))} />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status || "Order"} onValueChange={v => setForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hạn order</Label>
                <Input 
                  type="datetime-local" 
                  value={form.order_deadline ? new Date(form.order_deadline).toISOString().slice(0, 16) : ""} 
                  onChange={e => setForm(prev => ({ ...prev, order_deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))} 
                />
              </div>
            </div>

            {/* Cost Calculation */}
            <div>
              <h3 className="font-medium mb-2">Chi phí</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div>
                  <Label className="text-xs">Tệ</Label>
                  <Input type="number" value={form.te ?? ""} onChange={e => updateNum('te', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Rate</Label>
                  <Input type="number" value={form.rate ?? ""} onChange={e => updateNum('rate', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">R-V (auto)</Label>
                  <Input type="number" value={form.r_v ?? ""} readOnly className="h-8 text-sm bg-muted" />
                </div>
                <div>
                  <Label className="text-xs">Cân</Label>
                  <Input type="number" value={form.can_weight ?? ""} onChange={e => updateNum('can_weight', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Pack</Label>
                  <Input type="number" value={form.pack ?? ""} onChange={e => updateNum('pack', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Công</Label>
                  <Input type="number" value={form.cong ?? ""} onChange={e => updateNum('cong', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Tổng (auto)</Label>
                  <Input type="number" value={form.total ?? ""} readOnly className="h-8 text-sm bg-muted" />
                </div>
              </div>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Giá bán *</Label>
                <Input type="number" value={form.price || ""} onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Hiển thị giá</Label>
                <Input value={form.price_display || ""} onChange={e => setForm(prev => ({ ...prev, price_display: e.target.value }))} placeholder="VD: 150.000đ" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tồn kho</Label>
                <Input type="number" value={form.stock ?? ""} onChange={e => updateNum('stock', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.deposit_allowed ?? true} onCheckedChange={v => setForm(prev => ({ ...prev, deposit_allowed: v }))} />
                  <Label className="text-xs">Cho cọc</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.fees_included ?? true} onCheckedChange={v => setForm(prev => ({ ...prev, fees_included: v }))} />
                  <Label className="text-xs">Đã gồm phí</Label>
                </div>
              </div>
            </div>

            {/* Actual costs */}
            <div>
              <h3 className="font-medium mb-2">Chi phí thực</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Rate thực</Label>
                  <Input type="number" value={form.actual_rate ?? ""} onChange={e => updateNum('actual_rate', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cân thực</Label>
                  <Input type="number" value={form.actual_can ?? ""} onChange={e => updateNum('actual_can', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Pack thực</Label>
                  <Input type="number" value={form.actual_pack ?? ""} onChange={e => updateNum('actual_pack', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Chênh (auto)</Label>
                  <Input type="number" value={form.chenh ?? ""} readOnly className="h-8 text-sm bg-muted" />
                </div>
              </div>
            </div>

            {/* Description & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mô tả (mỗi dòng = 1 bullet point)</Label>
                <Textarea value={form.description || ""} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Kích thước</Label>
                  <Input value={form.size || ""} onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Bao gồm</Label>
                  <Input value={form.includes || ""} onChange={e => setForm(prev => ({ ...prev, includes: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Thời gian sản xuất</Label>
                  <Input value={form.production_time || ""} onChange={e => setForm(prev => ({ ...prev, production_time: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Link order</Label>
                <Input value={form.link_order || ""} onChange={e => setForm(prev => ({ ...prev, link_order: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Proof</Label>
                <Input value={form.proof || ""} onChange={e => setForm(prev => ({ ...prev, proof: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>

            {/* Images - Drag & Drop */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Hình ảnh (kéo thả để sắp xếp)</Label>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    <Button variant="outline" size="sm" asChild disabled={uploadingImage}>
                      <span>
                        {uploadingImage ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                        Tải ảnh lên
                      </span>
                    </Button>
                  </label>
                  <Button variant="outline" size="sm" onClick={() => setImageInputs(prev => [...prev, ""])}>
                    <Plus className="h-3 w-3 mr-1" /> Thêm URL
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {imageInputs.map((url, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(idx));
                      e.currentTarget.classList.add("opacity-50");
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove("opacity-50");
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("bg-accent/50");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("bg-accent/50");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("bg-accent/50");
                      const fromIdx = Number(e.dataTransfer.getData("text/plain"));
                      if (fromIdx === idx) return;
                      setImageInputs(prev => {
                        const newArr = [...prev];
                        const [moved] = newArr.splice(fromIdx, 1);
                        newArr.splice(idx, 0, moved);
                        return newArr;
                      });
                    }}
                    className="flex gap-2 items-center rounded-md p-1 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                    {url && (
                      <img src={url} alt="" className="w-8 h-8 object-cover rounded shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                    <Input
                      value={url}
                      onChange={e => {
                        const newImages = [...imageInputs];
                        newImages[idx] = e.target.value;
                        setImageInputs(newImages);
                      }}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setImageInputs(prev => prev.filter((_, i) => i !== idx))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Phân loại (Variants)</Label>
                <div className="flex gap-2">
                  {variantInputs.length > 1 && (
                    <Button variant="outline" size="sm" onClick={applyUniformPrice}>
                      <Copy className="h-3 w-3 mr-1" /> Đồng giá
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setVariantInputs(prev => [...prev, { name: "", price: form.price || 0 }])}>
                    <Plus className="h-3 w-3 mr-1" /> Thêm
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {variantInputs.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Tên phân loại"
                      value={v.name}
                      onChange={e => {
                        const n = [...variantInputs];
                        n[idx] = { ...n[idx], name: e.target.value };
                        setVariantInputs(n);
                      }}
                      className="h-8 text-sm flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Giá"
                      value={v.price || ""}
                      onChange={e => {
                        const n = [...variantInputs];
                        n[idx] = { ...n[idx], price: Number(e.target.value) || 0 };
                        setVariantInputs(n);
                      }}
                      className="h-8 text-sm w-28"
                    />
                    <Input
                      type="number"
                      placeholder="Tồn kho"
                      value={v.stock ?? ""}
                      onChange={e => {
                        const n = [...variantInputs];
                        n[idx] = { ...n[idx], stock: e.target.value === "" ? undefined : Number(e.target.value) };
                        setVariantInputs(n);
                      }}
                      className="h-8 text-sm w-20"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setVariantInputs(prev => prev.filter((_, i) => i !== idx))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Option Groups */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Nhóm tùy chọn (Option Groups)</Label>
                <Button variant="outline" size="sm" onClick={() => setOptionGroupInputs(prev => [...prev, { name: "", options: "" }])}>
                  <Plus className="h-3 w-3 mr-1" /> Thêm nhóm
                </Button>
              </div>
              <div className="space-y-2">
                {optionGroupInputs.map((g, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Tên nhóm"
                      value={g.name}
                      onChange={e => {
                        const n = [...optionGroupInputs];
                        n[idx] = { ...n[idx], name: e.target.value };
                        setOptionGroupInputs(n);
                      }}
                      className="h-8 text-sm w-32"
                    />
                    <Input
                      placeholder="Tùy chọn (phân cách bằng dấu phẩy)"
                      value={g.options}
                      onChange={e => {
                        const n = [...optionGroupInputs];
                        n[idx] = { ...n[idx], options: e.target.value };
                        setOptionGroupInputs(n);
                      }}
                      className="h-8 text-sm flex-1"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setOptionGroupInputs(prev => prev.filter((_, i) => i !== idx))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Variant Image Map - Visual Selector */}
            {variantInputs.length > 0 && imageInputs.filter(u => u.trim()).length > 0 && (
              <div>
                <Label>Gán ảnh cho phân loại</Label>
                <div className="space-y-2 mt-2">
                  {variantInputs.filter(v => v.name.trim()).map((v, idx) => {
                    const currentMap = form.variant_image_map || {};
                    const selectedIdx = currentMap[v.name];
                    const validImages = imageInputs.map((url, i) => ({ url, i })).filter(x => x.url.trim());
                    
                    return (
                      <div key={idx} className="flex gap-3 items-center">
                        <span className="text-sm min-w-[120px] truncate">{v.name}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {validImages.map(({ url, i }) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  variant_image_map: {
                                    ...(prev.variant_image_map || {}),
                                    [v.name]: i,
                                  }
                                }));
                              }}
                              className={`w-10 h-10 rounded border-2 overflow-hidden transition-all ${
                                selectedIdx === i 
                                  ? 'border-primary ring-2 ring-primary/30' 
                                  : 'border-muted hover:border-foreground/30'
                              }`}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                            </button>
                          ))}
                          {selectedIdx !== undefined && (
                            <button
                              type="button"
                              onClick={() => {
                                const newMap = { ...(form.variant_image_map || {}) };
                                delete newMap[v.name];
                                setForm(prev => ({ ...prev, variant_image_map: newMap }));
                              }}
                              className="w-10 h-10 rounded border border-dashed border-destructive/50 flex items-center justify-center text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-1">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Cập nhật" : "Thêm sản phẩm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
