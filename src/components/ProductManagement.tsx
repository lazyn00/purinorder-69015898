import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, X, Image as ImageIcon, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/integrations/supabase/types";

type DBProduct = Tables<"products">;

export default function ProductManagement() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<DBProduct>>({
    name: "",
    te: 0,
    rate: 0,
    r_v: 0,
    can_weight: 0,
    pack: 0,
    cong: 0,
    total: 0,
    price: 0,
    actual_rate: 0,
    actual_can: 0,
    actual_pack: 0,
    fees_included: true,
    category: "",
    subcategory: "",
    artist: "",
    status: "Sẵn",
    order_deadline: "",
    images: [],
    description: "",
    master: "",
    variants: [],
    option_groups: [],
    variant_image_map: {},
    stock: 0,
    link_order: "",
    proof: ""
  });

  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [variants, setVariants] = useState<{ name: string; price: number }[]>([]);
  const [variantImageMap, setVariantImageMap] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải sản phẩm",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const { te = 0, rate = 0, can_weight = 0, pack = 0, cong = 0 } = formData;
    const total = (te || 0) * (rate || 0) + (can_weight || 0) + (pack || 0) + (cong || 0);
    setFormData(prev => ({ ...prev, total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên và giá sản phẩm",
        variant: "destructive"
      });
      return;
    }

    // Prepare data with images, variants, and variant_image_map
    const filteredImages = imageUrls.filter(url => url.trim() !== "");
    const dataToSave = {
      ...formData,
      images: filteredImages,
      variants: variants.length > 0 ? variants : [],
      variant_image_map: Object.keys(variantImageMap).length > 0 ? variantImageMap : {}
    };

    setIsLoading(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(dataToSave as any)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Cập nhật thành công" });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([dataToSave as any]);

        if (error) throw error;
        toast({ title: "Thêm sản phẩm thành công" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu sản phẩm",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: DBProduct) => {
    setEditingProduct(product);
    setFormData(product);
    
    // Parse existing data
    const productImages = Array.isArray(product.images) 
      ? product.images 
      : typeof product.images === 'string' 
        ? JSON.parse(product.images as string)
        : [];
    setImageUrls(productImages.length > 0 ? productImages : [""]);
    
    const productVariants = Array.isArray(product.variants)
      ? product.variants
      : typeof product.variants === 'string'
        ? JSON.parse(product.variants as string)
        : [];
    setVariants(productVariants.length > 0 ? productVariants : []);
    
    const productVariantImageMap = typeof product.variant_image_map === 'object'
      ? product.variant_image_map
      : typeof product.variant_image_map === 'string'
        ? JSON.parse(product.variant_image_map as string)
        : {};
    setVariantImageMap(productVariantImageMap || {});
    
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
    setFormData({
      name: "",
      te: 0,
      rate: 0,
      r_v: 0,
      can_weight: 0,
      pack: 0,
      cong: 0,
      total: 0,
      price: 0,
      actual_rate: 0,
      actual_can: 0,
      actual_pack: 0,
      fees_included: true,
      category: "",
      subcategory: "",
      artist: "",
      status: "Sẵn",
      order_deadline: "",
      images: [],
      description: "",
      master: "",
      variants: [],
      option_groups: [],
      variant_image_map: {},
      stock: 0,
      link_order: "",
      proof: ""
    });
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
    
    // Remove variant from image map
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

  // Variant image mapping
  const updateVariantImageMap = (variantName: string, imageIndex: number) => {
    setVariantImageMap({
      ...variantImageMap,
      [variantName]: imageIndex
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
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
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Danh mục con</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) => handleInputChange('artist', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="te">Tệ</Label>
                  <Input
                    id="te"
                    type="number"
                    value={formData.te}
                    onChange={(e) => {
                      handleInputChange('te', parseFloat(e.target.value) || 0);
                      setTimeout(calculateTotal, 0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={formData.rate}
                    onChange={(e) => {
                      handleInputChange('rate', parseFloat(e.target.value) || 0);
                      setTimeout(calculateTotal, 0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="r_v">R-V</Label>
                  <Input
                    id="r_v"
                    type="number"
                    value={formData.r_v}
                    onChange={(e) => handleInputChange('r_v', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="can_weight">Cân</Label>
                  <Input
                    id="can_weight"
                    type="number"
                    value={formData.can_weight}
                    onChange={(e) => {
                      handleInputChange('can_weight', parseFloat(e.target.value) || 0);
                      setTimeout(calculateTotal, 0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pack">Pack</Label>
                  <Input
                    id="pack"
                    type="number"
                    value={formData.pack}
                    onChange={(e) => {
                      handleInputChange('pack', parseFloat(e.target.value) || 0);
                      setTimeout(calculateTotal, 0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cong">Công</Label>
                  <Input
                    id="cong"
                    type="number"
                    value={formData.cong}
                    onChange={(e) => {
                      handleInputChange('cong', parseFloat(e.target.value) || 0);
                      setTimeout(calculateTotal, 0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total">Tổng</Label>
                  <Input
                    id="total"
                    type="number"
                    value={formData.total}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Giá bán *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_rate">Rate thực</Label>
                  <Input
                    id="actual_rate"
                    type="number"
                    value={formData.actual_rate}
                    onChange={(e) => handleInputChange('actual_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_can">Cân thực</Label>
                  <Input
                    id="actual_can"
                    type="number"
                    value={formData.actual_can}
                    onChange={(e) => handleInputChange('actual_can', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_pack">Pack thực</Label>
                  <Input
                    id="actual_pack"
                    type="number"
                    value={formData.actual_pack}
                    onChange={(e) => handleInputChange('actual_pack', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Tồn kho</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sẵn">Sẵn</SelectItem>
                      <SelectItem value="Order">Order</SelectItem>
                      <SelectItem value="Pre-order">Pre-order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_deadline">Hạn đặt hàng</Label>
                  <Input
                    id="order_deadline"
                    type="datetime-local"
                    value={formData.order_deadline}
                    onChange={(e) => handleInputChange('order_deadline', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
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
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={url}
                        onChange={(e) => updateImageUrl(index, e.target.value)}
                      />
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
                {variants.length > 0 && (
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid grid-cols-2 gap-2">
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
                        {variant.name && imageUrls.filter(url => url).length > 1 && (
                          <div className="pt-2 border-t">
                            <Label className="text-xs">Chọn ảnh cho phân loại này</Label>
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
                )}
                {variants.length === 0 && (
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
                    value={formData.link_order}
                    onChange={(e) => handleInputChange('link_order', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">Proof</Label>
                  <Input
                    id="proof"
                    value={formData.proof}
                    onChange={(e) => handleInputChange('proof', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="master">Master</Label>
                  <Input
                    id="master"
                    value={formData.master}
                    onChange={(e) => handleInputChange('master', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fees_included"
                  checked={formData.fees_included}
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

      {isLoading && !isDialogOpen ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.artist && <p className="text-sm text-muted-foreground">{product.artist}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Giá:</span> {product.price.toLocaleString()}₫</div>
                  <div><span className="text-muted-foreground">Tệ:</span> {product.te || 0}</div>
                  <div><span className="text-muted-foreground">Rate:</span> {product.rate || 0}</div>
                  <div><span className="text-muted-foreground">Tổng:</span> {product.total || 0}</div>
                  <div><span className="text-muted-foreground">Danh mục:</span> {product.category || "-"}</div>
                  <div><span className="text-muted-foreground">Trạng thái:</span> {product.status}</div>
                  <div><span className="text-muted-foreground">Tồn kho:</span> {product.stock || 0}</div>
                  {product.order_deadline && (
                    <div><span className="text-muted-foreground">Hạn:</span> {new Date(product.order_deadline).toLocaleDateString('vi-VN')}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
