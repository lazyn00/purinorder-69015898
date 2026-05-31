import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Save, HelpCircle } from "lucide-react";

const CATEGORIES = ["Tiệm in Purin", "Outfit & Doll", "Merch", "Linh tinh xinh xinh", "Đồ gói", "Thời trang", "Khác"];
const STATUSES = ["Sẵn", "Order", "Pre-order", "Ẩn", "Tranh slot"];

export default function AdminBulkProductForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = localStorage.getItem('admin_user') || 'Admin';

  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("Merch");
  const [status, setStatus] = useState("Order");
  const [bulkText, setBulkText] = useState("");

  const handleBulkSave = async () => {
    if (!bulkText.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập nội dung sản phẩm", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Tách văn bản thành từng dòng
      const lines = bulkText.split("\n").map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error("Không tìm thấy dữ liệu hợp lệ");

      // Lấy ID lớn nhất hiện tại để cộng dồn tiếp
      const { data: maxData } = await supabase.from('products').select('id').order('id', { ascending: false }).limit(1);
      let currentMaxId = ((maxData?.[0] as any)?.id || 0);

      const newProducts = [];

      for (const line of lines) {
        // Hỗ trợ phân tách bằng dấu gạch đứng | hoặc dấu phẩy ,
        const separator = line.includes("|") ? "|" : ",";
        const parts = line.split(separator).map(p => p.trim());
        
        const productName = parts[0];
        const productPrice = parts[1] ? Number(parts[1].replace(/[^0-9]/g, '')) : 0;
        const productMaster = parts[2] || null;

        if (!productName) continue;

        currentMaxId += 1;
        newProducts.push({
          id: currentMaxId,
          name: productName,
          price: productPrice,
          price_display: `${productPrice.toLocaleString('vi-VN')}đ`,
          category: category,
          status: status,
          master: productMaster,
          owner: currentUser,
          images: [],
          variants: [],
          option_groups: []
        });
      }

      if (newProducts.length === 0) throw new Error("Cấu trúc văn bản nhập vào chưa đúng định dạng");

      const { error } = await supabase.from('products').insert(newProducts);
      if (error) throw error;

      toast({ title: "Thành công", description: `Đã thêm thành công ${newProducts.length} sản phẩm!` });
      navigate('/admin');
    } catch (error: any) {
      toast({ title: "Lỗi hệ thống", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 border-b pb-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/admin')} title="Quay lại danh sách">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl font-semibold">Thêm sản phẩm hàng loạt (Bulk Add)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-medium">Áp dụng danh mục chung</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-medium">Áp dụng trạng thái chung</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Danh sách văn bản sản phẩm</Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                  <HelpCircle className="h-3 w-3" /> Mỗi sản phẩm nằm trên 1 dòng riêng biệt
                </span>
              </div>
              <Textarea 
                value={bulkText} 
                onChange={e => setBulkText(e.target.value)} 
                placeholder="Định dạng: Tên sản phẩm | Giá bán | Tên Master&#13;Ví dụ:&#13;Card bo góc aespa Whiplash | 150000 | Purin&#13;Plush doll Monchhichi size S | 450000 | Vân Anh" 
                className="min-h-[250px] font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 space-y-1">
              <p className="font-semibold">💡 Mẹo nhỏ:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Bạn có thể copy trực tiếp từ file văn bản, tin nhắn hoặc sheet Excel/Notion sang.</li>
                <li>Hệ thống chấp nhận phân cách thông tin bằng dấu gạch đứng (<code className="font-mono bg-orange-100 px-0.5 rounded">|</code>) hoặc dấu phẩy (<code className="font-mono bg-orange-100 px-0.5 rounded">,</code>).</li>
                <li>Nếu không nhập giá hoặc master, hệ thống sẽ mặc định để giá là 0đ và bỏ trống master.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate('/admin')}>Hủy bỏ</Button>
              <Button onClick={handleBulkSave} disabled={loading} className="min-w-[140px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Xác nhận thêm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
