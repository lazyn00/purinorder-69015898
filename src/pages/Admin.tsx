import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Nhuy7890";

const STATUS_OPTIONS = [
  "chưa thanh toán",
  "đã thanh toán",
  "đang sản xuất",
  "đang vận chuyển",
  "đang giao",
  "hoàn thành",
  "đã huỷ",
  "đang xử lý"
];

interface Order {
  id: string;
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
  payment_proof_url: string;
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const adminSession = sessionStorage.getItem('admin_logged_in');
    if (adminSession === 'true') {
      setIsLoggedIn(true);
      fetchOrders();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_logged_in', 'true');
      fetchOrders();
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng Admin!",
      });
    } else {
      toast({
        title: "Lỗi",
        description: "Sai tên đăng nhập hoặc mật khẩu",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_logged_in');
    setUsername("");
    setPassword("");
    toast({
      title: "Đã đăng xuất",
    });
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải đơn hàng",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: "Cập nhật thành công",
        description: `Đơn hàng đã được chuyển sang trạng thái: ${newStatus}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive"
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== orderId));

      toast({
        title: "Đã xóa",
        description: "Đơn hàng đã được xóa",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đơn hàng",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hoàn thành': return 'bg-green-500';
      case 'đã huỷ': return 'bg-red-500';
      case 'đã thanh toán': return 'bg-blue-500';
      case 'đang giao': return 'bg-purple-500';
      default: return 'bg-amber-500';
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Đăng nhập Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Đăng nhập
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Quản lý đơn hàng</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">Tổng số đơn hàng: {orders.length}</p>
            
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">#{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Khách hàng</p>
                      <p className="font-medium">{order.customer_phone}</p>
                      {order.customer_email && <p className="text-xs">{order.customer_email}</p>}
                      {order.customer_fb && <p className="text-xs truncate">{order.customer_fb}</p>}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Người nhận</p>
                      <p className="font-medium">{order.delivery_name}</p>
                      <p className="text-xs">{order.delivery_phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Địa chỉ</p>
                      <p className="text-sm">{order.delivery_address}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tổng tiền</p>
                      <p className="font-bold text-primary">{order.total_price.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Thanh toán</p>
                      <p className="font-medium">{order.payment_method}</p>
                    </div>
                  </div>

                  {order.payment_proof_url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Bill chuyển khoản:</p>
                      <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        Xem ảnh bill
                      </a>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Sản phẩm:</p>
                    <div className="space-y-1">
                      {order.items && order.items.map((item: any, index: number) => (
                        <div key={index} className="text-sm flex justify-between">
                          <span>{item.name} {item.selectedVariant && `(${item.selectedVariant})`}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <div className="flex-1">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
