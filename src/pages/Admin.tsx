import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Trash2, TrendingUp, ShoppingCart, DollarSign, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Nhuy7890";

const PAYMENT_STATUSES = [
  "chưa thanh toán",
  "đã thanh toán",
  "đã cọc",
  "đã hoàn cọc"
];

const ORDER_PROGRESS = [
  "đang xử lý",
  "Purin đã đặt hàng",
  "Đang sản xuất",
  "đang vận chuyển",
  "đang giao",
  "đã hoàn thành",
  "đã huỷ"
];

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "chưa thanh toán":
      return "bg-red-100 text-red-800 border-red-200";
    case "đã thanh toán":
      return "bg-green-100 text-green-800 border-green-200";
    case "đã cọc":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "đã hoàn cọc":
      return "bg-pink-100 text-pink-800 border-pink-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getProgressColor = (progress: string) => {
  switch (progress) {
    case "đang xử lý":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
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
  payment_status: string;
  order_progress: string;
  payment_method: string;
  payment_type: string;
  payment_proof_url: string;
  second_payment_proof_url: string;
  shipping_provider: string;
  tracking_code: string;
}

const COLORS = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#60a5fa', '#fb923c'];

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{[key: string]: {provider: string, code: string}}>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Tính toán thống kê
  const statistics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.order_progress !== 'đã huỷ') {
        return sum + order.total_price;
      }
      return sum;
    }, 0);

    const paymentStatusCounts = PAYMENT_STATUSES.reduce((acc, status) => {
      acc[status] = orders.filter(o => o.payment_status === status).length;
      return acc;
    }, {} as Record<string, number>);

    const progressCounts = ORDER_PROGRESS.reduce((acc, progress) => {
      acc[progress] = orders.filter(o => o.order_progress === progress).length;
      return acc;
    }, {} as Record<string, number>);

    // Doanh thu theo ngày (7 ngày gần nhất)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const revenueByDay = last7Days.map(date => {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        return orderDate === date && order.order_progress !== 'đã huỷ';
      });
      const revenue = dayOrders.reduce((sum, order) => sum + order.total_price, 0);
      return {
        date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: revenue / 1000,
        orders: dayOrders.length
      };
    });

    // Phân bố tiến độ (chỉ các tiến độ có đơn)
    const progressDistribution = Object.entries(progressCounts)
      .filter(([_, count]) => count > 0)
      .map(([progress, count]) => ({
        name: progress,
        value: count
      }));

    return {
      totalRevenue,
      totalOrders: orders.length,
      paymentStatusCounts,
      progressCounts,
      revenueByDay,
      progressDistribution
    };
  }, [orders]);

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

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, payment_status: newStatus } : order
      ));

      toast({
        title: "Cập nhật thành công",
        description: `Trạng thái thanh toán: ${newStatus}`,
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

  const updateOrderProgress = async (orderId: string, newProgress: string) => {
    if (newProgress === "đang giao") {
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
      const updateData: any = { order_progress: newProgress };
      
      if (newProgress === "đang giao" && shippingInfo[orderId]) {
        updateData.shipping_provider = shippingInfo[orderId].provider;
        updateData.tracking_code = shippingInfo[orderId].code;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      const order = orders.find(o => o.id === orderId);
      
      if (order && order.customer_email) {
        try {
          const emailType = newProgress === "đã hoàn cọc" ? 'refund' : 'status_change';
          
          await supabase.functions.invoke('send-order-email', {
            body: {
              email: order.customer_email,
              orderNumber: order.order_number,
              customerName: order.delivery_name,
              items: order.items.map((item: any) => ({
                name: item.name,
                variant: item.selectedVariant,
                quantity: item.quantity,
                price: item.price
              })),
              totalPrice: order.total_price,
              status: newProgress,
              type: emailType,
              trackingCode: updateData.tracking_code || order.tracking_code
            }
          });
          
          console.log('Email notification sent');
        } catch (emailError) {
          console.warn('Failed to send email:', emailError);
        }
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, ...updateData } : order
      ));

      toast({
        title: "Cập nhật thành công",
        description: `Tiến độ đơn hàng: ${newProgress}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tiến độ",
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
          <h1 className="text-4xl font-bold">Quản lý Admin</h1>
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
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
              <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              {/* Tổng quan */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {statistics.totalRevenue.toLocaleString('vi-VN')}đ
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Không tính đơn đã huỷ
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {statistics.totalOrders}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tất cả đơn hàng
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Đơn hoàn thành</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {statistics.progressCounts['đã hoàn thành'] || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((statistics.progressCounts['đã hoàn thành'] || 0) / statistics.totalOrders * 100).toFixed(1)}% tổng đơn
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Biểu đồ */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Doanh thu 7 ngày gần nhất</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistics.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `${(value * 1000).toLocaleString('vi-VN')}đ`}
                          labelFormatter={(label) => `Ngày ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Doanh thu (k)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Phân bố tiến độ đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statistics.progressDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statistics.progressDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Trạng thái */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Trạng thái thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {PAYMENT_STATUSES.map((status) => (
                        <div key={status} className="space-y-1">
                          <Badge className={getPaymentStatusColor(status)} variant="outline">
                            {status}
                          </Badge>
                          <p className="text-2xl font-bold">{statistics.paymentStatusCounts[status] || 0}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tiến độ đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {ORDER_PROGRESS.map((progress) => (
                        <div key={progress} className="space-y-1">
                          <Badge className={getProgressColor(progress)} variant="outline">
                            {progress}
                          </Badge>
                          <p className="text-2xl font-bold">{statistics.progressCounts[progress] || 0}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <p className="text-muted-foreground mb-4">Tổng số đơn hàng: {orders.length}</p>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Thanh toán</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Vận chuyển</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="text-sm">#{order.order_number || order.id.slice(0, 8)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{order.delivery_name}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                            <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {order.delivery_address}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 max-w-[250px]">
                            {order.items && order.items.slice(0, 2).map((item: any, index: number) => (
                              <div key={index} className="text-xs">
                                {item.name} {item.selectedVariant && `(${item.selectedVariant})`} x{item.quantity}
                              </div>
                            ))}
                            {order.items && order.items.length > 2 && (
                              <div className="text-xs text-muted-foreground">+{order.items.length - 2} sản phẩm</div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="font-bold text-primary">{order.total_price.toLocaleString('vi-VN')}đ</div>
                            {order.payment_proof_url && (
                              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
                                Bill <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={order.payment_status}
                            onValueChange={(value) => updatePaymentStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={order.order_progress}
                            onValueChange={(value) => updateOrderProgress(order.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_PROGRESS.map((progress) => (
                                <SelectItem key={progress} value={progress}>
                                  {progress}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          {order.shipping_provider && order.tracking_code ? (
                            <div className="text-xs space-y-1">
                              <div className="font-medium">{order.shipping_provider}</div>
                              <div className="text-muted-foreground">{order.tracking_code}</div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Nhà vận chuyển"
                                className="h-7 text-xs"
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
                                className="h-7 text-xs"
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
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
