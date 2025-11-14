import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

interface Order {
  id: string;
  created_at: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  items: any[];
  total_price: number;
  status: string;
  payment_method: string;
}

export default function TrackOrder() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

      setOrders((data as any) || []);

      if (!data || data.length === 0) {
        toast({
          title: "Không tìm thấy",
          description: "Không có đơn hàng nào với số điện thoại này.",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hoàn thành': return 'text-green-600';
      case 'đã huỷ': return 'text-red-600';
      case 'đang giao': return 'text-blue-600';
      default: return 'text-amber-600';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Tra cứu đơn hàng</h1>
          <p className="text-muted-foreground">Nhập số điện thoại để kiểm tra trạng thái đơn hàng</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="phone" className="sr-only">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Đang tìm..." : "Tra cứu"}
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
                  <CardTitle className="flex justify-between items-center">
                    <span>Đơn hàng #{order.id.slice(0, 8)}</span>
                    <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ngày đặt</p>
                      <p className="font-medium">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tổng tiền</p>
                      <p className="font-medium">{order.total_price.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Người nhận</p>
                      <p className="font-medium">{order.delivery_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phương thức</p>
                      <p className="font-medium">{order.payment_method}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Địa chỉ giao hàng</p>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>

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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
