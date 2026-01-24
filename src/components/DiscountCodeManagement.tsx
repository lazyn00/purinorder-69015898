import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Tag, Percent, DollarSign, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  max_uses: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  applicable_categories: string[] | null;
  applicable_product_ids: number[] | null;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  category: string | null;
  status: string | null;
  stock: number | null;
  variants: any[] | null;
}

export function DiscountCodeManagement() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_order_value: "",
    max_discount: "",
    max_uses: "",
    start_date: "",
    end_date: "",
    applicable_product_ids: [] as number[],
    applicable_categories: [] as string[],
  });
  
  // Product search state
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Fetch discount codes
  const fetchDiscountCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscountCodes((data as DiscountCode[]) || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách mã giảm giá",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch products (only in-stock)
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, status, stock, variants')
        .order('name');

      if (error) throw error;
      
      // Filter products that are in stock
      const inStockProducts = (data || []).filter((product: any) => {
        // Check if product has stock or has any variant with stock
        if (product.status === 'Hết hàng') return false;
        if (product.stock !== null && product.stock <= 0) return false;
        
        // If has variants, check if any variant has stock
        if (product.variants && Array.isArray(product.variants)) {
          const hasStockedVariant = product.variants.some((v: any) => 
            v.stock === undefined || v.stock === null || v.stock > 0
          );
          if (!hasStockedVariant) return false;
        }
        
        return true;
      }) as Product[];
      
      setProducts(inStockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_order_value: "",
      max_discount: "",
      max_uses: "",
      start_date: "",
      end_date: "",
      applicable_product_ids: [],
      applicable_categories: [],
    });
    setEditingCode(null);
    setProductSearchQuery("");
  };

  const handleOpenDialog = (code?: DiscountCode) => {
    if (code) {
      setEditingCode(code);
      setFormData({
        code: code.code,
        discount_type: code.discount_type,
        discount_value: code.discount_value,
        min_order_value: code.min_order_value?.toString() || "",
        max_discount: code.max_discount?.toString() || "",
        max_uses: code.max_uses?.toString() || "",
        start_date: code.start_date ? new Date(code.start_date).toISOString().slice(0, 16) : "",
        end_date: code.end_date ? new Date(code.end_date).toISOString().slice(0, 16) : "",
        applicable_product_ids: code.applicable_product_ids || [],
        applicable_categories: code.applicable_categories || [],
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã giảm giá",
        variant: "destructive"
      });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({
        title: "Lỗi",
        description: "Giá trị giảm phải lớn hơn 0",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        applicable_product_ids: formData.applicable_product_ids.length > 0 ? formData.applicable_product_ids : null,
        applicable_categories: formData.applicable_categories.length > 0 ? formData.applicable_categories : null,
        is_active: true,
      };

      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(payload)
          .eq('id', editingCode.id);

        if (error) throw error;
        toast({ title: "Đã cập nhật mã giảm giá" });
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(payload);

        if (error) throw error;
        toast({ title: "Đã tạo mã giảm giá mới" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDiscountCodes();
    } catch (error: any) {
      console.error('Error saving discount code:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu mã giảm giá",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (code: DiscountCode) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id);

      if (error) throw error;
      
      setDiscountCodes(prev => 
        prev.map(c => c.id === code.id ? { ...c, is_active: !c.is_active } : c)
      );
      
      toast({
        title: code.is_active ? "Đã tắt mã giảm giá" : "Đã kích hoạt mã giảm giá"
      });
    } catch (error) {
      console.error('Error toggling discount code:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive"
      });
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDiscountCodes(prev => prev.filter(c => c.id !== id));
      toast({ title: "Đã xóa mã giảm giá" });
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa mã giảm giá",
        variant: "destructive"
      });
    }
  };

  // Get unique categories from products
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  const toggleProductSelection = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      applicable_product_ids: prev.applicable_product_ids.includes(productId)
        ? prev.applicable_product_ids.filter(id => id !== productId)
        : [...prev.applicable_product_ids, productId]
    }));
  };

  const toggleCategorySelection = (category: string) => {
    setFormData(prev => ({
      ...prev,
      applicable_categories: prev.applicable_categories.includes(category)
        ? prev.applicable_categories.filter(c => c !== category)
        : [...prev.applicable_categories, category]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Quản lý mã giảm giá
            </CardTitle>
            <CardDescription>
              Tạo và quản lý các mã giảm giá cho đơn hàng
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm mã
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCode ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết cho mã giảm giá
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mã giảm giá *</Label>
                    <Input
                      placeholder="VD: SALE10"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loại giảm giá *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                        <SelectItem value="fixed">Số tiền cố định (đ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Giá trị giảm *
                      {formData.discount_type === 'percentage' ? ' (%)' : ' (đ)'}
                    </Label>
                    <Input
                      type="number"
                      placeholder={formData.discount_type === 'percentage' ? "10" : "50000"}
                      value={formData.discount_value || ""}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giảm tối đa (đ)</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Chỉ áp dụng nếu giảm theo %</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Đơn tối thiểu (đ)</Label>
                    <Input
                      type="number"
                      placeholder="200000"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số lần sử dụng tối đa</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngày bắt đầu</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày kết thúc</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Category selection */}
                <div className="space-y-2">
                  <Label>Áp dụng cho danh mục (để trống = tất cả)</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={formData.applicable_categories.includes(category) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCategorySelection(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Product selection */}
                <div className="space-y-2">
                  <Label>Áp dụng cho sản phẩm (để trống = tất cả)</Label>
                  <Input
                    placeholder="Tìm sản phẩm..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-2">
                      {products
                        .filter(product => 
                          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                          product.category?.toLowerCase().includes(productSearchQuery.toLowerCase())
                        )
                        .map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={formData.applicable_product_ids.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                          <label
                            htmlFor={`product-${product.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {product.name}
                            {product.category && (
                              <span className="text-muted-foreground ml-2">({product.category})</span>
                            )}
                          </label>
                        </div>
                      ))}
                      {products.filter(product => 
                        product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        product.category?.toLowerCase().includes(productSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Không tìm thấy sản phẩm
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  {formData.applicable_product_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Đã chọn {formData.applicable_product_ids.length} sản phẩm
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave}>
                  {editingCode ? "Cập nhật" : "Tạo mã"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : discountCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có mã giảm giá nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Giảm</TableHead>
                  <TableHead>Đơn tối thiểu</TableHead>
                  <TableHead>Giảm tối đa</TableHead>
                  <TableHead>Đã dùng</TableHead>
                  <TableHead>Hiệu lực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => {
                  const isExpired = code.end_date && new Date(code.end_date) < new Date();
                  const isNotStarted = code.start_date && new Date(code.start_date) > new Date();
                  
                  return (
                    <TableRow key={code.id} className={!code.is_active || isExpired ? "opacity-50" : ""}>
                      <TableCell className="font-mono font-bold">{code.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {code.discount_type === 'percentage' ? (
                            <>
                              <Percent className="h-3 w-3" />
                              {code.discount_value}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3" />
                              {code.discount_value.toLocaleString('vi-VN')}đ
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.min_order_value 
                          ? `${code.min_order_value.toLocaleString('vi-VN')}đ`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {code.max_discount 
                          ? `${code.max_discount.toLocaleString('vi-VN')}đ`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {code.used_count}
                        {code.max_uses && `/${code.max_uses}`}
                      </TableCell>
                      <TableCell className="text-xs">
                        {code.start_date && (
                          <div>Từ: {new Date(code.start_date).toLocaleDateString('vi-VN')}</div>
                        )}
                        {code.end_date && (
                          <div>Đến: {new Date(code.end_date).toLocaleDateString('vi-VN')}</div>
                        )}
                        {!code.start_date && !code.end_date && "-"}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="secondary">Hết hạn</Badge>
                        ) : isNotStarted ? (
                          <Badge variant="outline">Chưa bắt đầu</Badge>
                        ) : code.is_active ? (
                          <Badge variant="default">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Tắt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(code)}
                          >
                            {code.is_active ? "Tắt" : "Bật"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(code)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCode(code.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </CardContent>
    </Card>
  );
}
