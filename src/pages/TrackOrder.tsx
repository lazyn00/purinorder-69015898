import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  customer_phone: string;
  customer_email: string;
  customer_fb: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  items: any[];
  total_price: number;
  status: string;
  payment_method: string;
  payment_type: string;
  payment_proof_url: string;
  second_payment_proof_url: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "chưa thanh toán":
      return "bg-red-100 text-red-800 border-red-200";
    case "đã thanh toán":
      return "bg-green-100 text-green-800 border-green-200";
    case "đã cọc":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Purin đã đặt hàng":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Đang sản xuất":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "đang vận chuyển":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "đang giao":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "đã hoàn thành":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "đã huỷ":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "đang xử lý":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function TrackOrder() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số điện thoại",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .or(`customer_phone.eq.${phone},delivery_phone.eq.${phone}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Không tìm thấy",
          description: "Không tìm thấy đơn hàng nào với số điện thoại này.",
          variant: "destructive"
        });
        setOrders([]);
      } else {
        setOrders(data as Order[]);
        toast({
          title: "Thành công",
          description: `Tìm thấy ${data.length} đơn hàng.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadSecondPayment = async (orderId: string, file: File) => {
    setUploadingOrderId(orderId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update({ 
          second_payment_proof_url: publicUrl
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, second_payment_proof_url: publicUrl } 
          : order
      ));

      toast({
        title: "Thành công",
        description: "Đã upload bill bổ sung thành công!",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể upload bill. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setUploadingOrderId(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="text-center mb-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Tra cứu đơn hàng</h1>
          <p className="text-muted-foreground">Nhập số điện thoại để tra cứu đơn hàng của bạn</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại đã dùng khi đặt hàng"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tìm kiếm...
                  </>
                ) : (
                  "Tra cứu"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Đơn hàng của bạn ({orders.length})</h2>
            
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">#{order.order_number || order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(order.status)} border font-medium`}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tổng tiền</p>
                      <p className="font-bold text-primary">{order.total_price.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-muted-foreground">
                        {order.payment_type === 'deposit' ? 'Đặt cọc 50%' : 'Thanh toán 100%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phương thức</p>
                      <p className="font-medium">{order.payment_method}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Sản phẩm</p>
                    <div className="space-y-2">
                      {order.items && order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} {item.selectedVariant && `(${item.selectedVariant})`}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload bill box - show for all orders without second payment proof */}
                  {!order.second_payment_proof_url && (
                    <>
                      <Separator />
                      <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 bg-primary/5">
                        <Label className="font-semibold text-lg mb-3 block">
                          {order.payment_type === 'deposit' && order.status === 'đã cọc' 
                            ? 'Thanh toán 50% còn lại' 
                            : 'Đăng bill bổ sung'}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          {order.payment_type === 'deposit' && order.status === 'đã cọc'
                            ? `Vui lòng thanh toán ${(order.total_price * 0.5).toLocaleString('vi-VN')}đ và đăng bill chuyển khoản`
                            : 'Dùng để đăng bill hoàn cọc, phụ thu hoặc thanh toán bổ sung'}
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadSecondPayment(order.id, e.target.files[0]);
                            }
                          }}
                          disabled={uploadingOrderId === order.id}
                          className="cursor-pointer"
                        />
                        {uploadingOrderId === order.id && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang upload...
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {order.second_payment_proof_url && (
                    <div className="text-sm">
                      <a 
                        href={order.second_payment_proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Xem bill thanh toán bổ sung
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
