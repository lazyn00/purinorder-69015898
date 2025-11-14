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

const ORDER_STATUSES = [
  "chưa thanh toán",
  "đã thanh toán",
  "đã cọc",
  "Purin đã đặt hàng",
  "Đang sản xuất",
  "đang vận chuyển",
  "đang giao",
  "đã hoàn thành",
  "đã huỷ",
  "đang xử lý"
];

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
  shipping_provider: string;
  tracking_code: string;
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{[key: string]: {provider: string, code: string}}>({});
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
      const { data, error } = await (supabase as any)
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
    // If changing to "đang giao" and shipping info is missing, show error
    if (newStatus === "đang giao") {
      const shipping = shippingInfo[orderId];
      if (!shipping || !shipping.provider || !shipping.code) {
        toast({
          title: "Thiếu thông tin",
          description: "Vui lòng nhập nhà vận chuyển và mã vận đơn",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const updateData: any = { status: newStatus };
      
      // Add shipping info if status is "đang giao"
      if (newStatus === "đang giao" && shippingInfo[orderId]) {
        updateData.shipping_provider = shippingInfo[orderId].provider;
        updateData.tracking_code = shippingInfo[orderId].code;
      }

      const { error } = await (supabase as any)
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, ...updateData } : order
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
      const { error } = await (supabase as any)
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
                      <CardTitle className="text-lg">#{order.order_number || order.id.slice(0, 8)}</CardTitle>
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
                      <p className="text-xs text-muted-foreground">{order.payment_type === 'deposit' ? 'Đặt cọc 50%' : 'Thanh toán 100%'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Thanh toán</p>
                      <p className="font-medium">{order.payment_method}</p>
                      {order.payment_proof_url && (
                        <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Xem bill 1
                        </a>
                      )}
                      {order.second_payment_proof_url && (
                        <a href={order.second_payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                          Xem bill 2
                        </a>
                      )}
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

                  {order.shipping_provider && order.tracking_code && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Thông tin vận chuyển:</p>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Nhà vận chuyển:</span> {order.shipping_provider}</p>
                        <p><span className="font-medium">Mã vận đơn:</span> {order.tracking_code}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4">
                    {(!order.shipping_provider || !order.tracking_code) && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                        <Label className="text-sm font-medium">Thông tin vận chuyển (bắt buộc khi chuyển sang "đang giao")</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Nhà vận chuyển (VD: Giao hàng nhanh, J&T...)"
                            value={shippingInfo[order.id]?.provider || ""}
                            onChange={(e) => setShippingInfo({
                              ...shippingInfo,
                              [order.id]: {
                                ...shippingInfo[order.id],
                                provider: e.target.value
                              }
                            })}
                          />
                          <Input
                            placeholder="Mã vận đơn"
                            value={shippingInfo[order.id]?.code || ""}
                            onChange={(e) => setShippingInfo({
                              ...shippingInfo,
                              [order.id]: {
                                ...shippingInfo[order.id],
                                code: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
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
