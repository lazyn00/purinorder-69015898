import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Tag, Percent, DollarSign, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_value: number | null;
  max_discount: number | null;
  applicable_product_ids: number[] | null;
  applicable_categories: string[] | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ProductData {
  id: number;
  name: string;
  category: string;
}

const CATEGORIES = ["Outfit & Doll", "Merch", "Khác", "Thời trang"];

export default function DiscountCodeManagementTab() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    max_uses: '' as string | number,
    min_order_value: '' as string | number,
    max_discount: '' as string | number,
    applicable_product_ids: [] as number[],
    applicable_categories: [] as string[],
    start_date: '',
    end_date: '',
    is_active: true
  });

  const fetchDiscountCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscountCodes((data as unknown as DiscountCode[]) || []);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách mã giảm giá",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      max_uses: '',
      min_order_value: '',
      max_discount: '',
      applicable_product_ids: [],
      applicable_categories: [],
      start_date: '',
      end_date: '',
      is_active: true
    });
    setEditingCode(null);
  };

  const openEditDialog = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      max_uses: code.max_uses ?? '',
      min_order_value: code.min_order_value ?? '',
      max_discount: code.max_discount ?? '',
      applicable_product_ids: code.applicable_product_ids || [],
      applicable_categories: code.applicable_categories || [],
      start_date: code.start_date ? code.start_date.split('T')[0] : '',
      end_date: code.end_date ? code.end_date.split('T')[0] : '',
      is_active: code.is_active
    });
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

    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        applicable_product_ids: formData.applicable_product_ids.length > 0 ? formData.applicable_product_ids : null,
        applicable_categories: formData.applicable_categories.length > 0 ? formData.applicable_categories : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active
      };

      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(payload as any)
          .eq('id', editingCode.id);

        if (error) throw error;
        toast({
          title: "Thành công",
          description: "Đã cập nhật mã giảm giá"
        });
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(payload as any);

        if (error) throw error;
        toast({
          title: "Thành công",
          description: "Đã tạo mã giảm giá mới"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDiscountCodes();
    } catch (error: any) {
      console.error("Error saving discount code:", error);
      toast({
        title: "Lỗi",
        description: error.message?.includes('unique') 
          ? "Mã giảm giá đã tồn tại" 
          : "Không thể lưu mã giảm giá",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Thành công",
        description: "Đã xóa mã giảm giá"
      });
      fetchDiscountCodes();
    } catch (error) {
      console.error("Error deleting discount code:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa mã giảm giá",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (code: DiscountCode) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !code.is_active } as any)
        .eq('id', code.id);

      if (error) throw error;
      fetchDiscountCodes();
    } catch (error) {
      console.error("Error toggling discount code:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive"
      });
    }
  };

  const getApplicableLabel = (code: DiscountCode) => {
    if (code.applicable_product_ids && code.applicable_product_ids.length > 0) {
      const productNames = code.applicable_product_ids
        .map(id => products.find(p => p.id === id)?.name)
        .filter(Boolean)
        .slice(0, 2);
      const remaining = code.applicable_product_ids.length - 2;
      return productNames.join(', ') + (remaining > 0 ? ` +${remaining}` : '');
    }
    if (code.applicable_categories && code.applicable_categories.length > 0) {
      return code.applicable_categories.join(', ');
    }
    return 'Tất cả sản phẩm';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Quản lý mã giảm giá
          </CardTitle>
          <CardDescription>
            Tạo và quản lý các mã giảm giá cho đơn hàng
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm mã giảm giá
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin chi tiết cho mã giảm giá
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã giảm giá *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SALE10"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Loại giảm giá</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData({ ...formData, discount_type: value })
                    }
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
                  <Label htmlFor="discount_value">
                    Giá trị giảm {formData.discount_type === 'percentage' ? '(%)' : '(đ)'} *
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value || ''}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    placeholder={formData.discount_type === 'percentage' ? 'VD: 10' : 'VD: 50000'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Số lượng sử dụng tối đa</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Để trống = không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_value">Giá trị đơn hàng tối thiểu (đ)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    placeholder="Để trống = không yêu cầu"
                  />
                </div>
                {formData.discount_type === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount">Giảm tối đa (đ)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      placeholder="Để trống = không giới hạn"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Ngày bắt đầu</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Ngày kết thúc</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Áp dụng cho danh mục</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={formData.applicable_categories.includes(cat) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newCats = formData.applicable_categories.includes(cat)
                          ? formData.applicable_categories.filter(c => c !== cat)
                          : [...formData.applicable_categories, cat];
                        setFormData({ ...formData, applicable_categories: newCats });
                      }}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Để trống = áp dụng tất cả</p>
              </div>

              <div className="space-y-2">
                <Label>Áp dụng cho sản phẩm cụ thể</Label>
                <Select
                  onValueChange={(value) => {
                    const productId = Number(value);
                    if (!formData.applicable_product_ids.includes(productId)) {
                      setFormData({
                        ...formData,
                        applicable_product_ids: [...formData.applicable_product_ids, productId]
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.applicable_product_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.applicable_product_ids.map((productId) => {
                      const product = products.find(p => p.id === productId);
                      return (
                        <Badge
                          key={productId}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              applicable_product_ids: formData.applicable_product_ids.filter(id => id !== productId)
                            });
                          }}
                        >
                          {product?.name || productId} ✕
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Kích hoạt mã giảm giá</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  editingCode ? 'Cập nhật' : 'Tạo mã'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {discountCodes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có mã giảm giá nào</p>
            <p className="text-sm">Nhấn "Thêm mã giảm giá" để tạo mới</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Giảm giá</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead>Áp dụng</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discountCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">
                      {code.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {code.discount_type === 'percentage' ? (
                        <>
                          <Percent className="h-3 w-3" />
                          {code.discount_value}%
                        </>
                      ) : (
                        <>
                          {code.discount_value.toLocaleString('vi-VN')}đ
                        </>
                      )}
                    </div>
                    {code.max_discount && code.discount_type === 'percentage' && (
                      <span className="text-xs text-muted-foreground block">
                        Tối đa: {code.max_discount.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={code.max_uses && code.used_count >= code.max_uses ? 'text-red-500' : ''}>
                      {code.used_count}/{code.max_uses ?? '∞'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getApplicableLabel(code)}</span>
                  </TableCell>
                  <TableCell>
                    {code.start_date || code.end_date ? (
                      <div className="text-xs">
                        {code.start_date && (
                          <div>{format(new Date(code.start_date), 'dd/MM/yyyy')}</div>
                        )}
                        {code.end_date && (
                          <div className={new Date(code.end_date) < new Date() ? 'text-red-500' : ''}>
                            → {format(new Date(code.end_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Không giới hạn</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={() => toggleActive(code)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(code)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(code.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
