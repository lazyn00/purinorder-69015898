import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Trash2, ShoppingCart, ExternalLink, Search, Copy, FileDown, Bell, Mail, Eye, CalendarIcon, Tag, Merge, Settings, BoxIcon, Layers } from "lucide-react";
import ProductManagement from "@/components/ProductManagement";
import { DiscountCodeManagement } from "@/components/DiscountCodeManagement";
import { OrderMerging } from "@/components/OrderMerging";

import AdminSettings from "@/components/AdminSettings";
import ProductTrackingFiltered from "@/components/ProductTrackingFiltered";
import MasterManagement from "@/components/MasterManagement";
import * as XLSX from 'xlsx';
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { SHIPPING_PROVIDERS, findProviderByName, getTrackingUrlFromProvider } from "@/data/shippingProviders";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const ADMIN_CREDENTIALS = [
  { username: "Admin", password: "Nhuy7890" },
  { username: "tiemnhaca", password: "1" },
];

const PAYMENT_STATUSES = [
  "Chưa thanh toán",
  "Đang xác nhận thanh toán",
  "Đang xác nhận cọc",
  "Đã thanh toán",
  "Đã cọc",
  "Đã hoàn cọc",
  "Đã hoàn tiền"
];

const ORDER_PROGRESS = [
  "Đang xử lý",
  "Đã đặt hàng",
  "Đang sản xuất",
  "Đang vận chuyển T-V",
  "Sẵn sàng giao",
  "Đang giao",
  "Đã hoàn thành",
  "Đã huỷ"
];

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  customer_phone: string;
  customer_email: string;
  customer_fb: string;
  customer_ig: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_note: string;
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
  surcharge: number;
}

interface AdminNotification {
  id: string;
  type: 'new_order' | 'delivery_update' | 'payment_proof' | 'product_expired' | 'product_expiring' | 'new_affiliate' | 'new_listing';
  order_id: string;
  order_number: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const COLORS = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#60a5fa', '#fb923c'];
const ORDERS_PER_PAGE = 20;

interface ProductNotification {
  id: string;
  product_id: number;
  product_name: string;
  email: string | null;
  social_link: string | null;
  notified: boolean;
  created_at: string;
}

interface ProductData {
  id: number;
  name: string;
  price: number;
  owner: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>(() => sessionStorage.getItem('admin_tab') || 'stats');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem('admin_user') || '');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{[key: string]: {provider: string, code: string, editing?: boolean}}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [orderProgressFilter, setOrderProgressFilter] = useState<string>("all");
  const [progressMulti, setProgressMulti] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [surchargeInputs, setSurchargeInputs] = useState<{[key: string]: string}>({});
  const [bulkProgress, setBulkProgress] = useState<string>("");
  const [ownedProductIds, setOwnedProductIds] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const unreadCount = adminNotifications.filter(n => !n.is_read).length;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === "" || 
        order.delivery_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.delivery_phone.includes(searchTerm) ||
        order.customer_phone.includes(searchTerm) ||
        (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.items.some((item: any) => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.selectedVariant && item.selectedVariant.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      
      const matchesPaymentStatus = paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter;
      const matchesOrderProgress =
        progressMulti.length > 0
          ? progressMulti.includes(order.order_progress)
          : (orderProgressFilter === "all" || order.order_progress === orderProgressFilter);
      
      return matchesSearch && matchesPaymentStatus && matchesOrderProgress;
    });
  }, [orders, searchTerm, paymentStatusFilter, orderProgressFilter, progressMulti]);

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const needsPaymentAttention = (o: any) =>
    ['Chưa thanh toán', 'Đang xác nhận thanh toán', 'Đang xác nhận cọc'].includes(o.payment_status) && 
    o.order_progress !== 'Đã hoàn thành' && o.order_progress !== 'Đã huỷ';

  const paginatedOrders = useMemo(() => {
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      const aCompleted = a.order_progress === 'Đã hoàn thành' || a.order_progress === 'Đã huỷ';
      const bCompleted = b.order_progress === 'Đã hoàn thành' || b.order_progress === 'Đã huỷ';
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      const aAttn = !aCompleted && needsPaymentAttention(a);
      const bAttn = !bCompleted && needsPaymentAttention(b);
      if (aAttn && !bAttn) return -1;
      if (!aAttn && bAttn) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return sortedOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const statistics = useMemo(() => {
    const itemTotal = (item: any) => Number(item.priceWithVariant ?? item.price ?? 0) * (item.quantity || 1);
    const orderOwnedRevenue = (order: Order) => ((order.items as any[]) || []).filter((it: any) => ownedProductIds.has(Number(it.id))).reduce((s, it) => s + itemTotal(it), 0);
    const scopedOrders = orders.filter(o => ((o.items as any[]) || []).some((it: any) => ownedProductIds.has(Number(it.id))));

    const totalRevenue = scopedOrders.reduce((sum, order) => order.order_progress !== 'Đã huỷ' ? sum + orderOwnedRevenue(order) : sum, 0);
    const startDate = dateRange.from;
    const endDate = dateRange.to;
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const revenueMap = new Map<string, { revenue: number; orders: number }>();
    const dateList = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    dateList.forEach(date => {
      const key = date.split('-').slice(1).reverse().join('/');
      const dayOrders = scopedOrders.filter(o => o.created_at.startsWith(date) && o.order_progress !== 'Đã huỷ');
      const revenue = dayOrders.reduce((sum, o) => sum + orderOwnedRevenue(o), 0);
      const existing = revenueMap.get(key) || { revenue: 0, orders: 0 };
      revenueMap.set(key, { revenue: existing.revenue + revenue, orders: existing.orders + dayOrders.length });
    });

    return {
      totalRevenue,
      periodRevenue: scopedOrders.filter(o => o.order_progress !== 'Đã huỷ').reduce((sum, o) => sum + orderOwnedRevenue(o), 0),
      periodOrders: scopedOrders.length,
      totalOrders: scopedOrders.length,
      revenueByDay: Array.from(revenueMap.entries()).map(([date, data]) => ({ date, revenue: data.revenue / 1000 })),
      daysCount
    };
  }, [orders, dateRange, ownedProductIds]);

  const fetchProducts = async (user?: string) => {
    const { data } = await supabase.from('products').select('id, name, price, owner');
    const list = (data || []) as ProductData[];
    setProducts(list);
    const owner = user ?? currentUser;
    setOwnedProductIds(new Set(list.filter(p => p.owner === owner).map(p => p.id)));
  };

  const fetchAdminNotifications = async () => {
    const { data } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50);
    setAdminNotifications((data as AdminNotification[]) || []);
  };

  useEffect(() => {
    if (localStorage.getItem('admin_logged_in') === 'true') {
      setIsLoggedIn(true);
      fetchOrders();
      fetchAdminNotifications();
      fetchProducts();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = ADMIN_CREDENTIALS.find(c => c.username === username && c.password === password);
    if (matched) {
      setIsLoggedIn(true);
      setCurrentUser(matched.username);
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.setItem('admin_user', matched.username);
      fetchOrders();
      fetchProducts(matched.username);
      fetchAdminNotifications();
    } else {
      toast({ title: "Lỗi", description: "Sai thông tin đăng nhập", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.clear();
    navigate(0);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('orders').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    setOrders((data as any) || []);
    setIsLoading(false);
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ payment_status: status }).eq('id', id);
    setOrders(orders.map(o => o.id === id ? { ...o, payment_status: status } : o));
  };

  const updateOrderProgress = async (id: string, progress: string) => {
    await supabase.from('orders').update({ order_progress: progress }).eq('id', id);
    setOrders(orders.map(o => o.id === id ? { ...o, order_progress: progress } : o));
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Xác nhận xóa?")) return;
    await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    setOrders(orders.filter(o => o.id !== id));
  };

  const toggleSelectOrder = (id: string) => {
    const newSelected = new Set(selectedOrderIds);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedOrderIds(newSelected);
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="container mx-auto p-4 max-w-sm">
          <Card>
            <CardHeader><CardTitle>Đăng nhập Admin</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input placeholder="User" value={username} onChange={e => setUsername(e.target.value)} />
                <Input type="password" placeholder="Pass" value={password} onChange={e => setPassword(e.target.value)} />
                <Button className="w-full">Đăng nhập</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between mb-8">
          <h1 className="text-2xl font-bold">Quản lý Admin</h1>
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Đăng xuất</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="stats">Thống kê</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="product-mgmt">Sản phẩm</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card><CardContent className="pt-4"><p className="text-sm">Tổng thu</p><p className="text-xl font-bold">{statistics.totalRevenue.toLocaleString()}đ</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-sm">Số đơn</p><p className="text-xl font-bold">{statistics.totalOrders}</p></CardContent></Card>
             </div>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell>{o.order_number}</TableCell>
                      <TableCell>{o.delivery_name}</TableCell>
                      <TableCell>
                        <Select value={o.order_progress} onValueChange={(v) => updateOrderProgress(o.id, v)}>
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ORDER_PROGRESS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteOrder(o.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="product-mgmt">
            <ProductManagement currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
