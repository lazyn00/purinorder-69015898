import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, RefreshCw, Pencil, X, Image as ImageIcon, DollarSign, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";

const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzRmnozhdbiATR3APhnQvMQi4fIdDs6Fvr15gsfQO6sd7UoF8cs9yAOpMO2j1Re7P9V8A/exec";

interface ProductVariant {
  name: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string | null;
  subcategory: string | null;
  artist: string | null;
  te: number | null;
  rate: number | null;
  r_v: number | null;
  can_weight: number | null;
  pack: number | null;
  cong: number | null;
  total: number | null;
  actual_rate: number | null;
  actual_can: number | null;
  actual_pack: number | null;
  stock: number | null;
  status: string | null;
  order_deadline: string | null;
  description: string | null;
  images: string[];
  variants: ProductVariant[];
  option_groups: any[];
  variant_image_map: Record<string, number>;
  link_order: string | null;
  proof: string | null;
  master: string | null;
  fees_included: boolean;
}

const PRODUCT_STATUSES = ["Sẵn", "Order", "Pre-order", "Deal"];

type FilterType = "all" | "out_of_stock" | "expired" | "expiring_soon" | "no_deadline";

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "out_of_stock", label: "Hết hàng" },
  { value: "expired", label: "Đã hết hạn" },
  { value: "expiring_soon", label: "Sắp hết hạn (3 ngày)" },
  { value: "no_deadline", label: "Không có hạn order" },
];

const emptyFormData: Partial<Product> = {
  name: "",
  price: 0,
  category: "",
  subcategory: "",
  artist: "",
  te: null,
  rate: null,
  r_v: null,
  can_weight: null,
  pack: null,
  cong: null,
  total: null,
  actual_rate: null,
  actual_can: null,
  actual_pack: null,
  stock: null,
  status: "Sẵn",
  order_deadline: null,
  description: "",
  images: [],
  variants: [],
  option_groups: [],
  variant_image_map: {},
  link_order: "",
  proof: "",
  master: "",
  fees_included: false,
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { toast } = useToast();
  const { refetchProducts: refetchCartProducts } = useCart();

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>(emptyFormData);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantImageMap, setVariantImageMap] = useState<Record<string, number>>({});

  // Auto-calculate R-V when te or rate changes
  useEffect(() => {
    const teNum = formData.te ?? 0;
    const rateNum = formData.rate ?? 0;
    if (teNum > 0 && rateNum > 0) {
      setFormData(prev => ({ ...prev, r_v: teNum * rateNum }));
    } else {
      setFormData(prev => ({ ...prev, r_v: null }));
    }
  }, [formData.te, formData.rate]);

  // Auto-calculate Total
  useEffect(() => {
    const r_v = formData.r_v || 0;
    const can_weight = formData.can_weight || 0;
    const pack = formData.pack || 0;
    const cong = formData.cong || 0;
    const total = r_v + can_weight + pack + cong;
    if (total > 0) {
      setFormData(prev => ({ ...prev, total }));
    }
  }, [formData.r_v, formData.can_weight, formData.pack, formData.cong]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.artist?.toLowerCase().includes(q) ||
        p.id.toString().includes(q)
      );
    }
    
    // Category filter
    const now = new Date();
    result = result.filter(p => {
      switch (activeFilter) {
        case "out_of_stock":
          return p.stock === 0;
        case "expired":
          if (!p.order_deadline) return false;
          return new Date(p.order_deadline) < now;
        case "expiring_soon":
          if (!p.order_deadline) return false;
          const deadline = new Date(p.order_deadline);
          const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          return deadline >= now && deadline <= threeDaysFromNow;
        case "no_deadline":
          return !p.order_deadline;
        default:
          return true;
      }
    });

    // Sort by priority
    return result.sort((a, b) => {
      const getPriority = (p: Product) => {
        const now = new Date();
        const isOutOfStock = p.stock === 0;
        const isExpired = p.order_deadline && new Date(p.order_deadline) < now;
        const isExpiringSoon = p.order_deadline && 
          new Date(p.order_deadline) >= now && 
          new Date(p.order_deadline) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const hasNoDeadline = !p.order_deadline;

        if (isExpired) return 5;
        if (isExpiringSoon) return 1;
        if (hasNoDeadline) return 2;
        if (isOutOfStock) return 3;
        return 4;
      };
      return getPriority(a) - getPriority(b);
    });
  }, [products, searchQuery, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      
      const productsData = (data || []).map(p => ({
        ...p,
        images: (p.images as string[]) || [],
        variants: (Array.isArray(p.variants) ? p.variants : []) as unknown as ProductVariant[],
        option_groups: (Array.isArray(p.option_groups) ? p.option_groups : []) as any[],
        variant_image_map: (p.variant_image_map as Record<string, number>) || {},
      })) as unknown as Product[];
      
      setProducts(productsData);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromSheet = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(GAS_PRODUCTS_URL);
      const data = await response.json();

      if (!data.products || !Array.isArray(data.products)) {
        throw new Error("Dữ liệu không hợp lệ từ Google Sheet");
      }

      for (const sheetProduct of data.products) {
        const productData = {
          id: sheetProduct.id,
          name: sheetProduct.name || "",
          price: sheetProduct.price || 0,
          category: sheetProduct.category || null,
          subcategory: sheetProduct.subCategory || sheetProduct.subcategory || null,
          artist: sheetProduct.artist || null,
          te: sheetProduct.te || null,
          rate: sheetProduct.rate || null,
          r_v: sheetProduct.rv || sheetProduct.r_v || null,
          can_weight: sheetProduct.can || sheetProduct.can_weight || null,
          pack: sheetProduct.pack || null,
          cong: sheetProduct.cong || null,
          total: sheetProduct.tong || sheetProduct.total || null,
          actual_rate: sheetProduct.actualRate || sheetProduct.actual_rate || null,
          actual_can: sheetProduct.actualCan || sheetProduct.actual_can || null,
          actual_pack: sheetProduct.actualPack || sheetProduct.actual_pack || null,
          stock: sheetProduct.stock || null,
          status: sheetProduct.status || "Sẵn",
          order_deadline: sheetProduct.orderDeadline || sheetProduct.order_deadline || null,
          description: Array.isArray(sheetProduct.description) 
            ? sheetProduct.description.join('\n') 
            : sheetProduct.description || null,
          images: sheetProduct.images || [],
          variants: sheetProduct.variants || [],
          option_groups: sheetProduct.optionGroups || sheetProduct.option_groups || [],
          variant_image_map: sheetProduct.variantImageMap || sheetProduct.variant_image_map || {},
          link_order: sheetProduct.linkOrder || sheetProduct.link_order || null,
          proof: sheetProduct.proof || null,
          master: sheetProduct.master || null,
          fees_included: sheetProduct.feesIncluded || sheetProduct.fees_included || false,
        };

        const { error } = await supabase
          .from('products')
          .upsert(productData, { onConflict: 'id' });

        if (error) {
          console.error('Error upserting product:', sheetProduct.id, error);
        }
      }

      await fetchProducts();
      refetchCartProducts();
      
      toast({
        title: "Đồng bộ thành công",
        description: `Đã đồng bộ ${data.products.length} sản phẩm từ Google Sheet`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể đồng bộ từ Google Sheet",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sản phẩm",
        variant: "destructive"
      });
      return;
    }

    const filteredImages = imageUrls.filter(url => url.trim() !== "");
    const productData = {
      name: formData.name,
      price: formData.price || 0,
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      artist: formData.artist || null,
      te: formData.te || null,
      rate: formData.rate || null,
      r_v: formData.r_v || null,
      can_weight: formData.can_weight || null,
      pack: formData.pack || null,
      cong: formData.cong || null,
      total: formData.total || null,
      actual_rate: formData.actual_rate || null,
      actual_can: formData.actual_can || null,
      actual_pack: formData.actual_pack || null,
      stock: formData.stock || null,
      status: formData.status || "Sẵn",
      order_deadline: formData.order_deadline || null,
      description: formData.description || null,
      images: filteredImages,
      variants: JSON.parse(JSON.stringify(variants)),
      option_groups: JSON.parse(JSON.stringify(formData.option_groups || [])),
      variant_image_map: JSON.parse(JSON.stringify(variantImageMap)),
      link_order: formData.link_order || null,
      proof: formData.proof || null,
      master: formData.master || null,
      fees_included: formData.fees_included || false,
    };

    setIsLoading(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData as any)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        toast({ title: "Cập nhật thành công" });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData as any);
        
        if (error) throw error;
        toast({ title: "Thêm sản phẩm thành công" });
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchProducts();
      refetchCartProducts();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lưu sản phẩm",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setImageUrls(product.images?.length > 0 ? product.images : [""]);
    setVariants(product.variants || []);
    setVariantImageMap(product.variant_image_map || {});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Đã xóa sản phẩm" });
      fetchProducts();
      refetchCartProducts();
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData(emptyFormData);
    setImageUrls([""]);
    setVariants([]);
    setVariantImageMap({});
    setEditingProduct(null);
  };

  // Image management
  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  // Variant management
  const addVariant = () => {
    setVariants([...variants, { name: "", price: formData.price || 0 }]);
  };

  const updateVariant = (index: number, field: 'name' | 'price', value: string | number) => {
    const newVariants = [...variants];
    if (field === 'price') {
      newVariants[index][field] = typeof value === 'number' ? value : parseInt(value as string) || 0;
    } else {
      newVariants[index][field] = value as string;
    }
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    const variantName = variants[index].name;
    setVariants(variants.filter((_, i) => i !== index));
    const newMap = { ...variantImageMap };
    delete newMap[variantName];
    setVariantImageMap(newMap);
  };

  const setSamePriceForAll = () => {
    if (variants.length === 0) return;
    const price = formData.price || 0;
    setVariants(variants.map(v => ({ ...v, price })));
    toast({ title: "Đã đồng giá tất cả phân loại" });
  };

  const updateVariantImageMap = (variantName: string, imageIndex: number) => {
    setVariantImageMap({ ...variantImageMap, [variantName]: imageIndex });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getProductBadge = (product: Product) => {
    const now = new Date();
    const isExpired = product.order_deadline && new Date(product.order_deadline) < now;
    const isExpiringSoon = product.order_deadline && 
      new Date(product.order_deadline) >= now && 
      new Date(product.order_deadline) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (isExpired) return <Badge variant="destructive">Hết hạn</Badge>;
    if (isExpiringSoon) return <Badge className="bg-amber-500">Sắp hết hạn</Badge>;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-2xl font-bold">Quản lý sản phẩm ({filteredProducts.length})</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncFromSheet} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Đồng bộ từ Sheet
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên sản phẩm *</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Danh mục</Label>
                      <Input
                        id="category"
                        value={formData.category || ""}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Danh mục con</Label>
                      <Input
                        id="subcategory"
                        value={formData.subcategory || ""}
                        onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artist">Artist</Label>
                      <Input
                        id="artist"
                        value={formData.artist || ""}
                        onChange={(e) => handleInputChange('artist', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="te">Tệ</Label>
                      <Input
                        id="te"
                        type="number"
                        step="0.01"
                        value={formData.te ?? ""}
                        onChange={(e) => handleInputChange('te', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate">Rate</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        value={formData.rate ?? ""}
                        onChange={(e) => handleInputChange('rate', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="r_v">R-V (Tự động: Tệ × Rate)</Label>
                      <Input
                        id="r_v"
                        type="number"
                        value={formData.r_v ?? ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="can_weight">Cân</Label>
                      <Input
                        id="can_weight"
                        type="number"
                        step="0.01"
                        value={formData.can_weight ?? ""}
                        onChange={(e) => handleInputChange('can_weight', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pack">Pack</Label>
                      <Input
                        id="pack"
                        type="number"
                        step="0.01"
                        value={formData.pack ?? ""}
                        onChange={(e) => handleInputChange('pack', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cong">Công</Label>
                      <Input
                        id="cong"
                        type="number"
                        step="0.01"
                        value={formData.cong ?? ""}
                        onChange={(e) => handleInputChange('cong', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total">Tổng</Label>
                      <Input
                        id="total"
                        type="number"
                        value={formData.total ?? ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Giá bán *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price || 0}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actual_rate">Rate thực</Label>
                      <Input
                        id="actual_rate"
                        type="number"
                        step="0.01"
                        value={formData.actual_rate ?? ""}
                        onChange={(e) => handleInputChange('actual_rate', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actual_can">Cân thực</Label>
                      <Input
                        id="actual_can"
                        type="number"
                        step="0.01"
                        value={formData.actual_can ?? ""}
                        onChange={(e) => handleInputChange('actual_can', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actual_pack">Pack thực</Label>
                      <Input
                        id="actual_pack"
                        type="number"
                        step="0.01"
                        value={formData.actual_pack ?? ""}
                        onChange={(e) => handleInputChange('actual_pack', e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Tồn kho</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock ?? ""}
                        onChange={(e) => handleInputChange('stock', e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Trạng thái</Label>
                      <Select
                        value={formData.status || "Sẵn"}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="order_deadline">Hạn đặt hàng</Label>
                      <Input
                        id="order_deadline"
                        type="datetime-local"
                        value={formData.order_deadline || ""}
                        onChange={(e) => handleInputChange('order_deadline', e.target.value || null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả (mỗi dòng sẽ là 1 gạch đầu dòng)</Label>
                    <Textarea
                      id="description"
                      placeholder="Nhập mô tả, mỗi dòng là 1 gạch đầu dòng"
                      value={formData.description || ""}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={5}
                    />
                  </div>

                  {/* Images Section */}
                  <div className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Ảnh sản phẩm (Link URL)
                      </Label>
                      <Button type="button" size="sm" onClick={addImageUrl}>
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm ảnh
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium text-muted-foreground w-8">{index}</span>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              value={url}
                              onChange={(e) => updateImageUrl(index, e.target.value)}
                            />
                          </div>
                          {url && (
                            <div className="w-12 h-12 border rounded overflow-hidden shrink-0">
                              <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = '/placeholder.svg'} />
                            </div>
                          )}
                          {imageUrls.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeImageUrl(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Phân loại sản phẩm</Label>
                      <div className="flex gap-2">
                        {variants.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={setSamePriceForAll}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Đồng giá
                          </Button>
                        )}
                        <Button type="button" size="sm" onClick={addVariant}>
                          <Plus className="h-4 w-4 mr-1" />
                          Thêm phân loại
                        </Button>
                      </div>
                    </div>
                    {variants.length > 0 ? (
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Tên phân loại</Label>
                                  <Input
                                    placeholder="VD: Size M, Màu đỏ"
                                    value={variant.name}
                                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Giá</Label>
                                  <Input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Số ảnh (0,1,2...)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="VD: 0"
                                    value={variant.name && variantImageMap[variant.name] !== undefined ? variantImageMap[variant.name] : ''}
                                    onChange={(e) => {
                                      if (variant.name) {
                                        const value = e.target.value;
                                        if (value === '') {
                                          const newMap = { ...variantImageMap };
                                          delete newMap[variant.name];
                                          setVariantImageMap(newMap);
                                        } else {
                                          updateVariantImageMap(variant.name, parseInt(value) || 0);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-5"
                                onClick={() => removeVariant(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Variant Image Mapping */}
                            {variant.name && imageUrls.filter(url => url).length > 0 && (
                              <div className="pt-2 border-t">
                                <Label className="text-xs">Hoặc chọn ảnh bằng cách click</Label>
                                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                  {imageUrls.map((url, imgIndex) => 
                                    url ? (
                                      <button
                                        key={imgIndex}
                                        type="button"
                                        onClick={() => updateVariantImageMap(variant.name, imgIndex)}
                                        className={`relative w-16 h-16 border-2 rounded overflow-hidden shrink-0 transition-all ${
                                          variantImageMap[variant.name] === imgIndex
                                            ? 'border-primary ring-2 ring-primary'
                                            : 'border-muted hover:border-primary/50'
                                        }`}
                                      >
                                        <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = '/placeholder.svg'} />
                                        <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1.5 py-0.5 font-medium">
                                          {imgIndex}
                                        </div>
                                        {variantImageMap[variant.name] === imgIndex && (
                                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</div>
                                          </div>
                                        )}
                                      </button>
                                    ) : null
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có phân loại. Nhấn "Thêm phân loại" để thêm.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="link_order">Link order</Label>
                      <Input
                        id="link_order"
                        value={formData.link_order || ""}
                        onChange={(e) => handleInputChange('link_order', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proof">Proof</Label>
                      <Input
                        id="proof"
                        value={formData.proof || ""}
                        onChange={(e) => handleInputChange('proof', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="master">Master</Label>
                      <Input
                        id="master"
                        value={formData.master || ""}
                        onChange={(e) => handleInputChange('master', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fees_included"
                      checked={formData.fees_included || false}
                      onCheckedChange={(checked) => handleInputChange('fees_included', checked)}
                    />
                    <Label htmlFor="fees_included">Đã bao gồm phí</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingProduct ? "Cập nhật" : "Thêm"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, danh mục, artist, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Lọc" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilter !== "all" && (
          <div className="flex gap-2">
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setActiveFilter("all")}>
              {FILTER_OPTIONS.find(o => o.value === activeFilter)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          </div>
        )}
      </div>

      {isLoading && !isDialogOpen ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tệ</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hạn order</TableHead>
                <TableHead className="w-24">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const now = new Date();
                const isExpired = product.order_deadline && new Date(product.order_deadline) < now;
                const isExpiringSoon = product.order_deadline && 
                  new Date(product.order_deadline) >= now && 
                  new Date(product.order_deadline) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

                return (
                  <TableRow 
                    key={product.id}
                    className={isExpired ? "bg-red-50 dark:bg-red-950/20" : isExpiringSoon ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                  >
                    <TableCell className="font-mono text-sm">{product.id}</TableCell>
                    <TableCell>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        {getProductBadge(product)}
                      </div>
                      {product.artist && <p className="text-xs text-muted-foreground">{product.artist}</p>}
                    </TableCell>
                    <TableCell>{product.price?.toLocaleString()}₫</TableCell>
                    <TableCell>{product.te || "-"}</TableCell>
                    <TableCell>{product.rate || "-"}</TableCell>
                    <TableCell>{product.stock ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.status || "Sẵn"}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.order_deadline 
                        ? new Date(product.order_deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
