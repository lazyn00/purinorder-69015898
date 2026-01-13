import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Search, Upload, X, Image as ImageIcon, RefreshCw } from "lucide-react";

interface ProductVariant {
  name: string;
  price: number;
  stock?: number;
  imageIndex?: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  images: string[];
  category?: string;
  subcategory?: string;
  artist?: string;
  status?: string;
  order_deadline?: string;
  variants?: ProductVariant[];
  option_groups?: { name: string; options: string[] }[];
  variant_image_map?: { [key: string]: number };
  stock?: number;
  fees_included?: boolean;
  deposit_allowed?: boolean;
  master?: string;
  te?: number;
  rate?: number;
  r_v?: number;
  can_weight?: number;
  pack?: number;
  cong?: number;
  total?: number;
  actual_rate?: number;
  actual_can?: number;
  actual_pack?: number;
  link_order?: string;
  proof?: string;
  production_time?: string;
}

const PRODUCT_STATUSES = ["Pre-order", "Order", "Sẵn", "Deal"];
const CATEGORIES = [
  "Outfit & Doll",
  "Merch",
  "Khác",
  "Thời trang"
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Outfit & Doll": ["Doll", "Outfit"],
  "Merch": ["Album", "Badge", "Binder", "Blind box", "Bookmark", "Card", "Card Holder", "Chăn", "Griptok", "Hộp", "ID photo", "Kẹp", "Keychain", "Khăn choàng", "Lịch", "Lót chuột/ bàn", "Luggage tag", "Polaroid", "Postcard", "Quạt", "Set", "Slogan", "Standee", "Sticker", "Túi", "Túi giấy"],
  "Khác": ["Bảng nỉ", "Văn phòng phẩm", "Phụ kiện điện thoại", "Đồ gia dụng"],
  "Thời trang": ["Áo", "Quần", "Váy", "Giày dép", "Túi xách", "Phụ kiện"]
};

const initialFormState = {
  name: "",
  price: 0,
  description: "",
  category: "",
  subcategory: "",
  customSubcategory: "",
  artist: "",
  status: "Sẵn",
  order_deadline: "",
  stock: undefined as number | undefined,
  fees_included: true,
  deposit_allowed: true,
  master: "",
  te: undefined as number | undefined,
  rate: undefined as number | undefined,
  r_v: undefined as number | undefined,
  can_weight: undefined as number | undefined,
  pack: undefined as number | undefined,
  cong: undefined as number | undefined,
  total: undefined as number | undefined,
  actual_rate: undefined as number | undefined,
  actual_can: undefined as number | undefined,
  actual_pack: undefined as number | undefined,
  link_order: "",
  proof: "",
  production_time: "",
  variants: [] as ProductVariant[],
  images: [] as string[],
  variant_image_map: {} as { [key: string]: number },
};

export default function ProductManagementTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  
  // Variant form
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState<number>(0);
  const [newVariantStock, setNewVariantStock] = useState<number | undefined>();
  const [newVariantImageIndex, setNewVariantImageIndex] = useState<number | undefined>();
  
  const { toast } = useToast();

  // Auto-calculate r_v when te or rate changes
  useEffect(() => {
    if (formData.te !== undefined && formData.rate !== undefined) {
      const calculatedRV = formData.te * formData.rate;
      setFormData(prev => ({ ...prev, r_v: calculatedRV }));
    }
  }, [formData.te, formData.rate]);

  // Auto-calculate total when r_v, can_weight, pack, or cong changes
  useEffect(() => {
    const rv = formData.r_v ?? 0;
    const can = formData.can_weight ?? 0;
    const pack = formData.pack ?? 0;
    const cong = formData.cong ?? 0;
    
    if (rv > 0 || can > 0 || pack > 0 || cong > 0) {
      const calculatedTotal = rv + can + pack + cong;
      setFormData(prev => ({ ...prev, total: calculatedTotal }));
    }
  }, [formData.r_v, formData.can_weight, formData.pack, formData.cong]);

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      
      const formattedProducts = (data || []).map(p => ({
        ...p,
        images: (p.images as unknown as string[]) || [],
        variants: (p.variants as unknown as ProductVariant[]) || [],
        option_groups: (p.option_groups as unknown as any[]) || [],
        variant_image_map: (p.variant_image_map as unknown as Record<string, number>) || {},
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toString().includes(searchTerm);
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Thành công",
        description: `Đã tải lên ${uploadedUrls.length} ảnh`
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải ảnh lên",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => {
      // Update variant_image_map when removing an image
      const newVariantImageMap = { ...prev.variant_image_map };
      Object.keys(newVariantImageMap).forEach(key => {
        if (newVariantImageMap[key] === index) {
          delete newVariantImageMap[key];
        } else if (newVariantImageMap[key] > index) {
          newVariantImageMap[key] = newVariantImageMap[key] - 1;
        }
      });
      
      // Update variants imageIndex
      const newVariants = prev.variants.map(v => {
        if (v.imageIndex === index) {
          return { ...v, imageIndex: undefined };
        } else if (v.imageIndex !== undefined && v.imageIndex > index) {
          return { ...v, imageIndex: v.imageIndex - 1 };
        }
        return v;
      });

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
        variant_image_map: newVariantImageMap,
        variants: newVariants
      };
    });
  };

  // Add variant
  const addVariant = () => {
    if (!newVariantName.trim()) return;
    
    const newVariant: ProductVariant = {
      name: newVariantName,
      price: newVariantPrice,
      stock: newVariantStock,
      imageIndex: newVariantImageIndex
    };
    
    setFormData(prev => {
      const newVariants = [...prev.variants, newVariant];
      const newVariantImageMap = { ...prev.variant_image_map };
      
      if (newVariantImageIndex !== undefined) {
        newVariantImageMap[newVariantName] = newVariantImageIndex;
      }
      
      return {
        ...prev,
        variants: newVariants,
        variant_image_map: newVariantImageMap
      };
    });
    
    setNewVariantName("");
    setNewVariantPrice(0);
    setNewVariantStock(undefined);
    setNewVariantImageIndex(undefined);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    setFormData(prev => {
      const variantToRemove = prev.variants[index];
      const newVariantImageMap = { ...prev.variant_image_map };
      
      if (variantToRemove && newVariantImageMap[variantToRemove.name] !== undefined) {
        delete newVariantImageMap[variantToRemove.name];
      }
      
      return {
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
        variant_image_map: newVariantImageMap
      };
    });
  };

  // Update variant image
  const updateVariantImage = (variantIndex: number, imageIndex: number | undefined) => {
    setFormData(prev => {
      const variant = prev.variants[variantIndex];
      if (!variant) return prev;
      
      const newVariants = [...prev.variants];
      newVariants[variantIndex] = { ...variant, imageIndex };
      
      const newVariantImageMap = { ...prev.variant_image_map };
      if (imageIndex !== undefined) {
        newVariantImageMap[variant.name] = imageIndex;
      } else {
        delete newVariantImageMap[variant.name];
      }
      
      return {
        ...prev,
        variants: newVariants,
        variant_image_map: newVariantImageMap
      };
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setEditingId(null);
    setNewVariantName("");
    setNewVariantPrice(0);
    setNewVariantStock(undefined);
    setNewVariantImageIndex(undefined);
  };

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    // Check if subcategory is in the predefined list
    const availableSubs = product.category ? (SUBCATEGORIES[product.category] || []) : [];
    const subcategoryInList = availableSubs.includes(product.subcategory || "");
    
    setFormData({
      name: product.name || "",
      price: product.price || 0,
      description: product.description || "",
      category: product.category || "",
      subcategory: subcategoryInList ? (product.subcategory || "") : "custom",
      customSubcategory: subcategoryInList ? "" : (product.subcategory || ""),
      artist: product.artist || "",
      status: product.status || "Sẵn",
      order_deadline: product.order_deadline ? product.order_deadline.split('T')[0] : "",
      stock: product.stock,
      fees_included: product.fees_included ?? true,
      deposit_allowed: product.deposit_allowed ?? true,
      master: product.master || "",
      te: product.te,
      rate: product.rate,
      r_v: product.r_v,
      can_weight: product.can_weight,
      pack: product.pack,
      cong: product.cong,
      total: product.total,
      actual_rate: product.actual_rate,
      actual_can: product.actual_can,
      actual_pack: product.actual_pack,
      link_order: product.link_order || "",
      proof: product.proof || "",
      production_time: product.production_time || "",
      variants: product.variants || [],
      images: product.images || [],
      variant_image_map: product.variant_image_map || {},
    });
    setIsEditing(true);
    setEditingId(product.id);
    setIsDialogOpen(true);
  };


  // Save product
  const saveProduct = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sản phẩm",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Determine final subcategory value
      const finalSubcategory = formData.subcategory === "custom" 
        ? formData.customSubcategory 
        : formData.subcategory;
      
      const productData = {
        name: formData.name,
        price: formData.price,
        description: formData.description || null,
        category: formData.category || null,
        subcategory: finalSubcategory || null,
        artist: formData.artist || null,
        status: formData.status,
        order_deadline: formData.order_deadline ? new Date(formData.order_deadline).toISOString() : null,
        stock: formData.stock ?? null,
        fees_included: formData.fees_included,
        deposit_allowed: formData.deposit_allowed,
        master: formData.master || null,
        te: formData.te ?? null,
        rate: formData.rate ?? null,
        r_v: formData.r_v ?? null,
        can_weight: formData.can_weight ?? null,
        pack: formData.pack ?? null,
        cong: formData.cong ?? null,
        total: formData.total ?? null,
        actual_rate: formData.actual_rate ?? null,
        actual_can: formData.actual_can ?? null,
        actual_pack: formData.actual_pack ?? null,
        link_order: formData.link_order || null,
        proof: formData.proof || null,
        production_time: formData.production_time || null,
        variants: formData.variants as unknown as any,
        images: formData.images as unknown as any,
        variant_image_map: formData.variant_image_map as unknown as any,
      };

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã cập nhật sản phẩm"
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã thêm sản phẩm mới"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu sản phẩm",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const deleteProduct = async (productId: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "Đã xóa",
        description: "Sản phẩm đã được xóa"
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Sẵn": return "bg-green-100 text-green-800";
      case "Đặt hàng": return "bg-blue-100 text-blue-800";
      case "Hết hàng": return "bg-red-100 text-red-800";
      case "Ngừng bán": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Quản lý sản phẩm</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchProducts} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm sản phẩm
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên sản phẩm *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Giá (VND) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Danh mục</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(v) => setFormData({ ...formData, category: v, subcategory: "", customSubcategory: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Danh mục phụ</Label>
                      <Select 
                        value={formData.subcategory} 
                        onValueChange={(v) => setFormData({ ...formData, subcategory: v, customSubcategory: v === "custom" ? formData.customSubcategory : "" })}
                        disabled={!formData.category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục phụ" />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.category ? (SUBCATEGORIES[formData.category] || []) : []).map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                          <SelectItem value="custom">Khác (tùy chỉnh)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.subcategory === "custom" && (
                        <Input
                          className="mt-2"
                          placeholder="Nhập danh mục phụ tùy chỉnh"
                          value={formData.customSubcategory}
                          onChange={(e) => setFormData({ ...formData, customSubcategory: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Trạng thái</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(v) => setFormData({ ...formData, status: v })}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artist">Nghệ sĩ / Thuộc tính</Label>
                      <Input
                        id="artist"
                        value={formData.artist}
                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                        placeholder="Tên nghệ sĩ..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="master">Master</Label>
                      <Input
                        id="master"
                        value={formData.master}
                        onChange={(e) => setFormData({ ...formData, master: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Tồn kho</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock ?? ""}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Số lượng"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order_deadline">Hạn order</Label>
                      <Input
                        id="order_deadline"
                        type="date"
                        value={formData.order_deadline}
                        onChange={(e) => setFormData({ ...formData, order_deadline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="production_time">Thời gian sản xuất</Label>
                      <Input
                        id="production_time"
                        value={formData.production_time}
                        onChange={(e) => setFormData({ ...formData, production_time: e.target.value })}
                        placeholder="VD: 2-3 tháng"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="fees_included" 
                        checked={formData.fees_included}
                        onCheckedChange={(checked) => setFormData({ ...formData, fees_included: !!checked })}
                      />
                      <Label htmlFor="fees_included" className="cursor-pointer">Đã bao gồm phí</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="deposit_allowed" 
                        checked={formData.deposit_allowed}
                        onCheckedChange={(checked) => setFormData({ ...formData, deposit_allowed: !!checked })}
                      />
                      <Label htmlFor="deposit_allowed" className="cursor-pointer">Cho phép đặt cọc</Label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả sản phẩm..."
                      rows={3}
                    />
                  </div>

                  {/* Cost Info */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Thông tin giá vốn</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tệ</Label>
                        <Input
                          type="number"
                          value={formData.te ?? ""}
                          onChange={(e) => setFormData({ ...formData, te: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rate</Label>
                        <Input
                          type="number"
                          value={formData.rate ?? ""}
                          onChange={(e) => setFormData({ ...formData, rate: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">R-V (tự động)</Label>
                        <Input
                          type="number"
                          value={formData.r_v ?? ""}
                          readOnly
                          className="h-8 bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cân</Label>
                        <Input
                          type="number"
                          value={formData.can_weight ?? ""}
                          onChange={(e) => setFormData({ ...formData, can_weight: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Pack</Label>
                        <Input
                          type="number"
                          value={formData.pack ?? ""}
                          onChange={(e) => setFormData({ ...formData, pack: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Công</Label>
                        <Input
                          type="number"
                          value={formData.cong ?? ""}
                          onChange={(e) => setFormData({ ...formData, cong: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tổng (tự động)</Label>
                        <Input
                          type="number"
                          value={formData.total ?? ""}
                          readOnly
                          className="h-8 bg-muted"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actual Cost */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Giá thực tế</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Rate thực</Label>
                        <Input
                          type="number"
                          value={formData.actual_rate ?? ""}
                          onChange={(e) => setFormData({ ...formData, actual_rate: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cân thực</Label>
                        <Input
                          type="number"
                          value={formData.actual_can ?? ""}
                          onChange={(e) => setFormData({ ...formData, actual_can: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Pack thực</Label>
                        <Input
                          type="number"
                          value={formData.actual_pack ?? ""}
                          onChange={(e) => setFormData({ ...formData, actual_pack: e.target.value ? Number(e.target.value) : undefined })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="link_order">Link order</Label>
                      <Input
                        id="link_order"
                        value={formData.link_order}
                        onChange={(e) => setFormData({ ...formData, link_order: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proof">Link proof</Label>
                      <Input
                        id="proof"
                        value={formData.proof}
                        onChange={(e) => setFormData({ ...formData, proof: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Hình ảnh</h4>
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center gap-1 text-sm text-primary hover:underline">
                          {uploadingImages ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Tải ảnh lên
                        </div>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImages}
                        />
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Product ${index + 1}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5 rounded-b">
                            #{index}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {formData.images.length === 0 && (
                        <div className="flex items-center justify-center w-20 h-20 border border-dashed rounded text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variants with Image Assignment */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Phân loại</h4>
                    <div className="space-y-3">
                      {formData.variants.map((variant, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <span className="flex-1">{variant.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {variant.price.toLocaleString('vi-VN')}đ
                          </span>
                          {variant.stock !== undefined && (
                            <Badge variant="outline">SL: {variant.stock}</Badge>
                          )}
                          {/* Image selector for variant */}
                          <Select
                            value={variant.imageIndex?.toString() ?? "none"}
                            onValueChange={(v) => updateVariantImage(index, v === "none" ? undefined : parseInt(v))}
                          >
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue placeholder="Ảnh" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Không</SelectItem>
                              {formData.images.map((_, imgIndex) => (
                                <SelectItem key={imgIndex} value={imgIndex.toString()}>
                                  Ảnh #{imgIndex}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeVariant(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2 flex-wrap">
                        <Input
                          placeholder="Tên phân loại"
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          className="flex-1 min-w-[120px]"
                        />
                        <Input
                          type="number"
                          placeholder="Giá"
                          value={newVariantPrice || ""}
                          onChange={(e) => setNewVariantPrice(Number(e.target.value))}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="SL"
                          value={newVariantStock ?? ""}
                          onChange={(e) => setNewVariantStock(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-16"
                        />
                        <Select
                          value={newVariantImageIndex?.toString() ?? "none"}
                          onValueChange={(v) => setNewVariantImageIndex(v === "none" ? undefined : parseInt(v))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Ảnh" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không</SelectItem>
                            {formData.images.map((_, imgIndex) => (
                              <SelectItem key={imgIndex} value={imgIndex.toString()}>
                                Ảnh #{imgIndex}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={addVariant}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={saveProduct} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {isEditing ? "Cập nhật" : "Thêm sản phẩm"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {PRODUCT_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tồn</TableHead>
                  <TableHead className="text-center">Cọc</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                        ? "Không tìm thấy sản phẩm phù hợp"
                        : "Chưa có sản phẩm nào"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">{product.id}</TableCell>
                      <TableCell>
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{product.name}</div>
                        {product.artist && (
                          <div className="text-xs text-muted-foreground">{product.artist}</div>
                        )}
                      </TableCell>
                      <TableCell>{product.price.toLocaleString('vi-VN')}đ</TableCell>
                      <TableCell>
                        <div className="text-sm">{product.category || "-"}</div>
                        {product.subcategory && (
                          <div className="text-xs text-muted-foreground">{product.subcategory}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.stock ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        {product.deposit_allowed === false ? (
                          <Badge variant="destructive" className="text-xs">Không</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Có</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Hiển thị {filteredProducts.length} / {products.length} sản phẩm
        </div>
      </CardContent>
    </Card>
  );
}
