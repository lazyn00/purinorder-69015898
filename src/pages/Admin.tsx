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
import { Loader2, LogOut, Trash2, TrendingUp, ShoppingCart, DollarSign, ExternalLink, Package, Search, Copy, FileDown, Bell, Mail, CheckSquare, Square, BarChart3, Save, AlertTriangle, CheckCircle, Eye, Check, X, CalendarIcon, Tag, Merge, Settings, BoxIcon, Layers } from "lucide-react";
import ProductManagement from "@/components/ProductManagement";
import { DiscountCodeManagement } from "@/components/DiscountCodeManagement";
import { OrderMerging } from "@/components/OrderMerging";

import AdminSettings from "@/components/AdminSettings";
import ProductTrackingFiltered from "@/components/ProductTrackingFiltered";
import MasterManagement from "@/components/MasterManagement";
import * as XLSX from 'xlsx';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { productsData } from "@/data/products";
import { SHIPPING_PROVIDERS, findProviderByName, getTrackingUrlFromProvider } from "@/data/shippingProviders";
import { useNavigate as useNav } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Nhuy7890";

const PAYMENT_STATUSES = [
  "Chưa thanh toán",
  "Đang xác nhận thanh toán",
  "Đang xác nhận cọc",
  "Đã thanh toán",
  "Đã cọc",
  "Đã hoàn cọc"
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

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Chưa thanh toán":
      return "bg-red-100 text-red-800 border-red-200";
    case "Đang xác nhận thanh toán":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Đang xác nhận cọc":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Đã thanh toán":
      return "bg-green-100 text-green-800 border-green-200";
    case "Đã cọc":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Đã hoàn cọc":
      return "bg-pink-100 text-pink-800 border-pink-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getProgressColor = (progress: string) => {
  switch (progress) {
    case "Đang xử lý":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Đã đặt hàng":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Đang sản xuất":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Đang vận chuyển T-V":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Sẵn sàng giao":
      return "bg-lime-100 text-lime-800 border-lime-200";
    case "Đang giao":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Đã hoàn thành":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Đã huỷ":
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

// ========== THÊM INTERFACE CHO THÔNG BÁO ADMIN ==========
interface AdminNotification {
  id: string;
  type: 'new_order' | 'delivery_update' | 'payment_proof' | 'product_expired' | 'product_expiring' | 'new_affiliate' | 'new_listing';
  order_id: string;
  order_number: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
// ========================================================

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
  te?: number;
  rate?: number;
  actual_rate?: number;
  actual_can?: number;
  actual_pack?: number;
  cong?: number;
  pack?: number;
  total?: number;
  chenh?: number;
  r_v?: number;
  can_weight?: number;
  variants?: any[];
}

interface UserListing {
  id: string;
  listing_code: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string;
  tag: string;
  price: number | null;
  images: string[];
  variants: { name: string; price: number }[] | null;
  seller_phone: string;
  seller_social: string;
  seller_bank_name: string;
  seller_bank_account: string;
  seller_account_name: string;
  status: string;
  admin_note: string | null;
  product_id: number | null;
  created_at: string;
  updated_at: string;
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{[key: string]: {provider: string, code: string, editing?: boolean}}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [orderProgressFilter, setOrderProgressFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<ProductNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [surchargeInputs, setSurchargeInputs] = useState<{[key: string]: string}>({});
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [bulkProgress, setBulkProgress] = useState<string>("");
  
  // ========== STATE CHO QUẢN LÝ ĐĂNG BÁN ==========
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingStatusFilter, setListingStatusFilter] = useState<string>("all");
  const [listingSearchTerm, setListingSearchTerm] = useState("");
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
  const [adminNoteInputs, setAdminNoteInputs] = useState<{[key: string]: string}>({});
  // ================================================
  
  // ========== THÊM STATE CHO THÔNG BÁO ADMIN ==========
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // =====================================================
  
  // =================================================
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // ========== TÍNH SỐ THÔNG BÁO CHƯA ĐỌC ==========
  const unreadCount = adminNotifications.filter(n => !n.is_read).length;
  // =================================================

  // Filter orders based on search and filters
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
      const matchesOrderProgress = orderProgressFilter === "all" || order.order_progress === orderProgressFilter;
      
      return matchesSearch && matchesPaymentStatus && matchesOrderProgress;
    });
  }, [orders, searchTerm, paymentStatusFilter, orderProgressFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    // Sort: push completed and cancelled orders to bottom
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      const aCompleted = a.order_progress === 'Đã hoàn thành' || a.order_progress === 'Đã huỷ';
      const bCompleted = b.order_progress === 'Đã hoàn thành' || b.order_progress === 'Đã huỷ';
      
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      // Within same category, sort by created_at desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return sortedOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentStatusFilter, orderProgressFilter]);

  // Product statistics by variant
  const productStats = useMemo(() => {
    const stats: { [key: string]: { count: number; productName: string } } = {};
    
    orders.forEach(order => {
      if (order.order_progress === 'Đã huỷ') return;
      const items = order.items as any[];
      items.forEach(item => {
        const variantKey = item.selectedVariant 
          ? `${item.name} - ${item.selectedVariant}`
          : item.name;
        
        if (!stats[variantKey]) {
          stats[variantKey] = {
            count: 0,
            productName: item.name
          };
        }
        stats[variantKey].count += item.quantity;
      });
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, count: data.count, productName: data.productName }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    
    productStats.forEach(product => {
      if (!stats[product.productName]) {
        stats[product.productName] = 0;
      }
      stats[product.productName] += product.count;
    });

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [productStats]);

  // State cho khoảng thời gian thống kê - date range picker
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  // Tính toán thống kê doanh thu
  const statistics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.order_progress !== 'Đã huỷ') {
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

    // Tính số ngày dựa theo date range
    const startDate = dateRange.from;
    const endDate = dateRange.to;
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const dateList = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    // Nhóm dữ liệu theo ngày hoặc tháng tùy khoảng thời gian
    const getGroupKey = (dateStr: string) => {
      const date = new Date(dateStr);
      if (daysCount > 90) {
        return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', month: '2-digit', year: '2-digit' });
      } else if (daysCount > 31) {
        // Nhóm theo tuần
        const weekNumber = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return `Tuần ${weekNumber + 1}`;
      }
      return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' });
    };

    const revenueMap = new Map<string, { revenue: number; orders: number }>();

    dateList.forEach(date => {
      const key = getGroupKey(date);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        return orderDate === date && order.order_progress !== 'Đã huỷ';
      });
      const revenue = dayOrders.reduce((sum, order) => sum + order.total_price, 0);
      
      const existing = revenueMap.get(key) || { revenue: 0, orders: 0 };
      revenueMap.set(key, {
        revenue: existing.revenue + revenue,
        orders: existing.orders + dayOrders.length
      });
    });

    const revenueByDay = Array.from(revenueMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue / 1000,
      orders: data.orders
    }));

    // Tính doanh thu theo khoảng thời gian được chọn
    const periodRevenue = orders
      .filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate && order.order_progress !== 'Đã huỷ';
      })
      .reduce((sum, order) => sum + order.total_price, 0);

    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    }).length;

    // Phân bố thanh toán
    const paymentDistribution = Object.entries(paymentStatusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count
      }));

    // Phân bố tiến độ
    const progressDistribution = Object.entries(progressCounts)
      .filter(([_, count]) => count > 0)
      .map(([progress, count]) => ({
        name: progress,
        value: count
      }));

    return {
      totalRevenue,
      periodRevenue,
      periodOrders,
      totalOrders: orders.length,
      paymentStatusCounts,
      progressCounts,
      revenueByDay,
      paymentDistribution,
      progressDistribution,
      daysCount: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    };
  }, [orders, dateRange]);


  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, te, rate, actual_rate, actual_can, actual_pack, cong, pack, total, chenh, r_v, can_weight, variants');
      
      if (error) throw error;
      setProducts((data as ProductData[]) || []);
    } catch (error) {
      console.error('Error fetching products for stats:', error);
    }
  };

  // ========== FETCH THÔNG BÁO ADMIN ==========
  const fetchAdminNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setAdminNotifications((data as AdminNotification[]) || []);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  // ĐÁNH DẤU ĐÃ ĐỌC THÔNG BÁO
  const markNotificationAsRead = async (id: string) => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      setAdminNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
  const markAllAsRead = async () => {
    try {
      const unreadIds = adminNotifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      setAdminNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );

      toast({
        title: "Đã đánh dấu tất cả đã đọc",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  // ============================================

  useEffect(() => {
    const adminSession = sessionStorage.getItem('admin_logged_in');
    if (adminSession === 'true') {
      setIsLoggedIn(true);
      fetchOrders();
      fetchProducts();
      fetchAdminNotifications(); // THÊM: Fetch thông báo khi login
    }
  }, []);

  // ========== REALTIME SUBSCRIPTION CHO THÔNG BÁO ==========
  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('New notification received:', payload);
          setAdminNotifications(prev => [payload.new as AdminNotification, ...prev]);
          
          // Hiển thị toast khi có thông báo mới
          toast({
            title: "🔔 Thông báo mới",
            description: (payload.new as AdminNotification).message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, toast]);
  // =========================================================

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_logged_in', 'true');
      fetchOrders();
      fetchProducts();
      fetchAdminNotifications(); // THÊM: Fetch thông báo khi login
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
      const order = orders.find(o => o.id === orderId);
      const oldStatus = order?.payment_status;

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Record status history
      if (oldStatus !== newStatus) {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          field_changed: 'payment_status',
          old_value: oldStatus,
          new_value: newStatus,
          changed_by: 'admin'
        });
      }
      
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
    // Không yêu cầu mã vận đơn khi chuyển sang "Đang giao" nữa

    try {
      const order = orders.find(o => o.id === orderId);
      const oldProgress = order?.order_progress;

      const updateData: any = { order_progress: newProgress };
      
      if (newProgress === "Đang giao" && shippingInfo[orderId]) {
        updateData.shipping_provider = shippingInfo[orderId].provider;
        updateData.tracking_code = shippingInfo[orderId].code;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Record status history
      if (oldProgress !== newProgress) {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          field_changed: 'order_progress',
          old_value: oldProgress,
          new_value: newProgress,
          changed_by: 'admin'
        });
      }
      
      // Email tự động đã được tắt

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

  const bulkUpdateProgress = async (newProgress: string) => {
    if (selectedOrderIds.size === 0) return;
    try {
      const ids = Array.from(selectedOrderIds);
      const { error } = await supabase
        .from('orders')
        .update({ order_progress: newProgress })
        .in('id', ids);
      if (error) throw error;

      const historyInserts = ids.map(id => {
        const order = orders.find(o => o.id === id);
        return {
          order_id: id,
          field_changed: 'order_progress',
          old_value: order?.order_progress || '',
          new_value: newProgress,
          changed_by: 'admin'
        };
      }).filter(h => h.old_value !== newProgress);
      if (historyInserts.length > 0) {
        await supabase.from('order_status_history').insert(historyInserts);
      }

      setOrders(orders.map(order =>
        selectedOrderIds.has(order.id) ? { ...order, order_progress: newProgress } : order
      ));
      setSelectedOrderIds(new Set());
      setBulkProgress("");
      toast({
        title: "Cập nhật thành công",
        description: `Đã cập nhật ${ids.length} đơn hàng → ${newProgress}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tiến độ hàng loạt",
        variant: "destructive"
      });
    }
  };

  const updateSurcharge = async (orderId: string, surcharge: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ surcharge })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, surcharge } : order
      ));

      toast({
        title: "Cập nhật thành công",
        description: `Phụ thu: ${surcharge.toLocaleString('vi-VN')}đ`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phụ thu",
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

  const copyDeliveryInfo = (order: Order) => {
    const info = `Tên: ${order.delivery_name}
SĐT: ${order.delivery_phone}
Địa chỉ: ${order.delivery_address}${order.delivery_note ? `\nGhi chú: ${order.delivery_note}` : ''}`;
    
    navigator.clipboard.writeText(info).then(() => {
      toast({
        title: "Đã sao chép",
        description: "Thông tin giao hàng đã được copy",
      });
    }).catch(() => {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép",
        variant: "destructive"
      });
    });
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === paginatedOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const exportToExcel = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.has(o.id));
    
    if (selectedOrders.length === 0) {
      toast({
        title: "Chưa chọn đơn hàng",
        description: "Vui lòng chọn ít nhất 1 đơn hàng để xuất",
        variant: "destructive"
      });
      return;
    }

    const exportData = selectedOrders.map(order => ({
      'Mã đơn': order.order_number || order.id.slice(0, 8),
      'Ngày đặt': new Date(order.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      'Tên khách': order.delivery_name,
      'SĐT liên lạc': order.customer_phone,
      'Email': order.customer_email || '',
      'SĐT nhận hàng': order.delivery_phone,
      'Địa chỉ': order.delivery_address,
      'Ghi chú': order.delivery_note || '',
      'Sản phẩm': order.items.map((item: any) => 
        item.selectedVariant 
          ? `x${item.quantity} ${item.name} (${item.selectedVariant})`
          : `x${item.quantity} ${item.name}`
      ).join(', '),
      'Tổng tiền': order.total_price,
      'Thanh toán': order.payment_status,
      'Tiến độ': order.order_progress,
      'Hình thức': order.payment_type,
      'Phương thức': order.payment_method,
      'Vận chuyển': order.shipping_provider || '',
      'Mã vận đơn': order.tracking_code || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");
    
    const fileName = `don-hang-${new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Xuất thành công",
      description: `Đã xuất ${selectedOrders.length} đơn hàng`,
    });
  };



  const generateEmailContent = (order: Order) => {
    const itemsList = order.items.map((item: any) => 
      item.selectedVariant
        ? `• ${item.name} (${item.selectedVariant}) x${item.quantity}`
        : `• ${item.name} x${item.quantity}`
    ).join('\n');

    const paymentStatusDisplay = order.payment_status?.toLowerCase() || '';
    const orderProgressDisplay = order.order_progress?.toLowerCase() || '';

    return `Hi bạn iu 🍮

Purin gửi bạn cập nhật tiến độ đơn hàng #${order.order_number} nè:

📦 Sản phẩm
${itemsList}

💰 Trạng thái thanh toán: ${paymentStatusDisplay}
🚀 Tiến độ: ${orderProgressDisplay}${order.tracking_code ? `\n📍 Mã vận đơn: ${order.tracking_code}` : ''}

Cảm ơn bạn đã luôn tin tưởng Purin 🍮💖

Nếu cần hỗ trợ gì, bạn cứ nhắn Purin liền nha!

—
Purin Order`.trim();
  };

  const sendBulkEmails = async () => {
    const selectedOrders = orders.filter(order => selectedOrderIds.has(order.id));
    
    if (selectedOrders.length === 0) {
      toast({
        title: "Chưa chọn đơn hàng",
        description: "Vui lòng chọn ít nhất 1 đơn hàng",
        variant: "destructive"
      });
      return;
    }

    const ordersWithEmail = selectedOrders.filter(order => order.customer_email);
    
    if (ordersWithEmail.length === 0) {
      toast({
        title: "Không có email",
        description: "Các đơn hàng đã chọn không có email khách hàng",
        variant: "destructive"
      });
      return;
    }

    const allEmailsContent = ordersWithEmail.map(order => {
      return `
════════════════════════════════════════
📧 Email cho: ${order.customer_email}
Tiêu đề: Cập nhật đơn hàng #${order.order_number}
════════════════════════════════════════

${generateEmailContent(order)}

`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(allEmailsContent);
      
      toast({
        title: "Đã copy vào clipboard!",
        description: `Nội dung ${ordersWithEmail.length} email đã được copy. Bạn có thể paste vào email client để gửi.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Lỗi",
        description: "Không thể copy vào clipboard. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from('product_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thông báo",
        variant: "destructive"
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const sendProductNotification = async (productId: number, productName: string) => {
    try {
      const productUrl = `${window.location.origin}/product/${productId}`;
      
      const { error } = await supabase.functions.invoke('notify-product-available', {
        body: {
          productId,
          productName,
          productUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Đã gửi thông báo",
        description: `Đã gửi email cho khách hàng đăng ký sản phẩm ${productName}`,
      });

      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi thông báo",
        variant: "destructive"
      });
    }
  };

  // ========== FETCH USER LISTINGS ==========
  const fetchUserListings = async () => {
    setLoadingListings(true);
    try {
      const { data, error } = await supabase
        .from('user_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserListings((data as any) || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đăng bán",
        variant: "destructive"
      });
    } finally {
      setLoadingListings(false);
    }
  };

  // ========== UPDATE LISTING STATUS ==========
  const updateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      const adminNote = adminNoteInputs[listingId];
      if (adminNote) {
        updateData.admin_note = adminNote;
      }

      const { error } = await supabase
        .from('user_listings')
        .update(updateData)
        .eq('id', listingId);

      if (error) throw error;

      setUserListings(listings => 
        listings.map(l => l.id === listingId ? { ...l, ...updateData } : l)
      );

      toast({
        title: "Cập nhật thành công",
        description: `Trạng thái: ${newStatus}`,
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

  // ========== DELETE LISTING ==========
  const deleteListing = async (listingId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài đăng này?")) return;

    try {
      const { error } = await supabase
        .from('user_listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      setUserListings(listings => listings.filter(l => l.id !== listingId));

      toast({
        title: "Đã xóa",
        description: "Bài đăng đã được xóa",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài đăng",
        variant: "destructive"
      });
    }
  };

  // ========== FILTERED LISTINGS ==========
  const filteredListings = useMemo(() => {
    return userListings.filter(listing => {
      const matchesSearch = listingSearchTerm === "" ||
        listing.name.toLowerCase().includes(listingSearchTerm.toLowerCase()) ||
        listing.listing_code.toLowerCase().includes(listingSearchTerm.toLowerCase()) ||
        listing.seller_phone.includes(listingSearchTerm);
      
      const matchesStatus = listingStatusFilter === "all" || listing.status === listingStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [userListings, listingSearchTerm, listingStatusFilter]);

  const getListingStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'sold': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getListingStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'sold': return 'Đã bán';
      default: return status;
    }
  };
  // ==========================================

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'delivery_update':
        return '📦';
      case 'payment_proof':
        return '💳';
      default:
        return '🔔';
    }
  };
  // ==========================================================

  // ======================================

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
        {/* ========== HEADER VỚI CHUÔNG THÔNG BÁO ========== */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Quản lý Admin</h1>
          
          <div className="flex items-center gap-4">
            {/* CHUÔNG THÔNG BÁO */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              
              {/* DROPDOWN THÔNG BÁO */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border rounded-lg shadow-lg z-50 max-h-[70vh] overflow-hidden">
                  <div className="p-3 border-b font-semibold flex items-center justify-between sticky top-0 bg-card">
                    <span className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Thông báo ({unreadCount} chưa đọc)
                    </span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        Đọc tất cả
                      </Button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto max-h-[60vh]">
                    {adminNotifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có thông báo nào</p>
                      </div>
                    ) : (
                      adminNotifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                          }`}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            setShowNotifications(false);
                            navigate(`/admin/order/${notif.order_id}`);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-2">
                                {notif.message}
                                {!notif.is_read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span>#{notif.order_number}</span>
                                <span>•</span>
                                <span>{new Date(notif.created_at).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
        {/* ================================================== */}

        {/* CLICK OUTSIDE TO CLOSE NOTIFICATIONS */}
        {showNotifications && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowNotifications(false)}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="inline-flex h-12 items-center justify-start gap-2 bg-muted p-1">
              <TabsTrigger value="product-mgmt" className="h-10 w-10 p-0" title="Quản lý sản phẩm">
                <BoxIcon className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="stats" className="h-10 w-10 p-0" title="Doanh thu">
                <BarChart3 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="orders" className="h-10 w-10 p-0" title="Đơn hàng">
                <ShoppingCart className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="merge" className="h-10 w-10 p-0" title="Gộp đơn">
                <Merge className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="discounts" className="h-10 w-10 p-0" title="Mã giảm giá">
                <Tag className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="master-mgmt" className="h-10 w-10 p-0" title="Quản lý Master">
                <Layers className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="product-tracking" className="h-10 w-10 p-0" title="Theo dõi tiến độ SP">
                <Eye className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="settings" className="h-10 w-10 p-0" title="Cài đặt">
                <Settings className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="product-mgmt">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {/* Biểu đồ */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base">
                      Doanh thu ({statistics.daysCount} ngày)
                    </CardTitle>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs justify-start">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(dateRange.from, "dd/MM/yy", { locale: vi })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                            disabled={(date) => date > dateRange.to || date > new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-muted-foreground self-center text-xs">→</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs justify-start">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(dateRange.to, "dd/MM/yy", { locale: vi })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                            disabled={(date) => date < dateRange.from || date > new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          const startDate = dateRange.from;
                          const endDate = dateRange.to;
                          const periodOrders = orders.filter(order => {
                            const orderDate = new Date(order.created_at);
                            return orderDate >= startDate && orderDate <= endDate && order.order_progress !== 'Đã huỷ';
                          });
                          
                          const exportData = periodOrders.map(order => ({
                            'Mã đơn': order.order_number || order.id.slice(0, 8),
                            'Ngày đặt': format(new Date(order.created_at), 'dd/MM/yyyy'),
                            'Khách hàng': order.delivery_name,
                            'SĐT': order.customer_phone,
                            'Sản phẩm': (order.items as any[]).map((i: any) => `${i.name}${i.selectedVariant ? ` (${i.selectedVariant})` : ''} x${i.quantity}`).join(', '),
                            'Tổng tiền': order.total_price,
                            'Phụ thu': order.surcharge || 0,
                            'Thanh toán': order.payment_status,
                            'Tiến độ': order.order_progress,
                          }));
                          
                          const ws = XLSX.utils.json_to_sheet(exportData);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'Doanh thu');
                          XLSX.writeFile(wb, `doanh-thu_${format(startDate, 'ddMMyy')}-${format(endDate, 'ddMMyy')}.xlsx`);
                        }}
                      >
                        <FileDown className="mr-1 h-3 w-3" />
                        Xuất Excel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statistics.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: number) => `${(value * 1000).toLocaleString('vi-VN')}đ`}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Doanh thu (k)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">Phân bố trạng thái thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statistics.paymentDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statistics.paymentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Phân bố tiến độ đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ResponsiveContainer width="100%" height={250}>
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

            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, SĐT, mã đơn, hoặc sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Lọc thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thanh toán</SelectItem>
                    {PAYMENT_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={orderProgressFilter} onValueChange={setOrderProgressFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Lọc tiến độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tiến độ</SelectItem>
                    {ORDER_PROGRESS.map(progress => (
                      <SelectItem key={progress} value={progress}>{progress}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn hàng
                {selectedOrderIds.size > 0 && ` • Đã chọn ${selectedOrderIds.size} đơn`}
              </p>

              {selectedOrderIds.size > 0 && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={exportToExcel} className="gap-2 w-full sm:w-auto" variant="outline" size="sm">
                    <FileDown className="h-4 w-4" />
                    <span className="hidden xs:inline">Xuất Excel</span> ({selectedOrderIds.size})
                  </Button>
                  <Button onClick={sendBulkEmails} className="gap-2 w-full sm:w-auto" size="sm">
                    <Mail className="h-4 w-4" />
                    <span className="hidden xs:inline">Gửi email</span> ({selectedOrderIds.size})
                  </Button>
                  <div className="flex items-center gap-2">
                    <Select value={bulkProgress} onValueChange={setBulkProgress}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Đổi tiến độ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_PROGRESS.map((progress) => (
                          <SelectItem key={progress} value={progress}>{progress}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!bulkProgress}
                      onClick={() => {
                        if (bulkProgress && confirm(`Cập nhật ${selectedOrderIds.size} đơn → "${bulkProgress}"?`)) {
                          bulkUpdateProgress(bulkProgress);
                        }
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky left-0 bg-background z-10">
                        <Checkbox
                          checked={selectedOrderIds.size === paginatedOrders.length && paginatedOrders.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[100px] sticky left-[50px] bg-background z-10">Mã đơn</TableHead>
                      <TableHead className="min-w-[200px]">Khách hàng</TableHead>
                      <TableHead className="min-w-[200px]">Sản phẩm</TableHead>
                      <TableHead className="text-right min-w-[100px]">Tổng tiền</TableHead>
                      <TableHead className="min-w-[120px]">Phụ thu</TableHead>
                      <TableHead className="min-w-[120px]">Thanh toán</TableHead>
                      <TableHead className="min-w-[120px]">Tiến độ</TableHead>
                      <TableHead className="min-w-[150px]">Vận chuyển</TableHead>
                      <TableHead className="text-right min-w-[100px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="sticky left-0 bg-background">
                          <Checkbox
                            checked={selectedOrderIds.has(order.id)}
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                          />
                        </TableCell>
                        
                        <TableCell className="font-medium sticky left-[50px] bg-background">
                          <div className="space-y-1">
                            <a 
                              href={`/admin/order/${order.id}`}
                              className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                            >
                              #{order.order_number || order.id.slice(0, 8)}
                              <Eye className="h-3 w-3" />
                            </a>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {order.delivery_name}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyDeliveryInfo(order)}
                                title="Sao chép thông tin giao hàng"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <a 
                              href={`tel:${order.customer_phone}`} 
                              className="text-xs text-primary hover:underline block"
                            >
                              📞 {order.customer_phone}
                            </a>
                            {order.customer_email && (
                              <a 
                                href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(order.customer_email)}&su=${encodeURIComponent(`Cập nhật đơn hàng #${order.order_number}`)}&body=${encodeURIComponent(generateEmailContent(order))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline block"
                              >
                                ✉️ {order.customer_email}
                              </a>
                            )}
                            {order.customer_fb && (
                              <a 
                                href={order.customer_fb} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline block"
                              >
                                👥 {order.customer_fb}
                              </a>
                            )}
                            <div className="text-xs text-muted-foreground max-w-[200px]">
                              {expandedAddresses.has(order.id) ? (
                                <div>
                                  {order.delivery_address}
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedAddresses);
                                      newExpanded.delete(order.id);
                                      setExpandedAddresses(newExpanded);
                                    }}
                                    className="text-primary hover:underline ml-1"
                                  >
                                    Thu gọn
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {order.delivery_address.length > 50 ? (
                                    <>
                                      {order.delivery_address.substring(0, 50)}...
                                      <button
                                        onClick={() => {
                                          const newExpanded = new Set(expandedAddresses);
                                          newExpanded.add(order.id);
                                          setExpandedAddresses(newExpanded);
                                        }}
                                        className="text-primary hover:underline ml-1"
                                      >
                                        Xem thêm
                                      </button>
                                    </>
                                  ) : (
                                    order.delivery_address
                                  )}
                                </div>
                              )}
                            </div>
                            {order.delivery_note && (
                              <div className="text-xs italic text-orange-600 dark:text-orange-400 mt-1">
                                📝 {order.delivery_note}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 max-w-[250px]">
                            {order.items && order.items.slice(0, expandedOrderIds.has(order.id) ? order.items.length : 2).map((item: any, index: number) => (
                              <div key={index} className="text-xs">
                                x{item.quantity} {item.name}{item.selectedVariant && ` (${item.selectedVariant})`}
                              </div>
                            ))}
                            {order.items && order.items.length > 2 && (
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedOrderIds);
                                  if (expandedOrderIds.has(order.id)) {
                                    newExpanded.delete(order.id);
                                  } else {
                                    newExpanded.add(order.id);
                                  }
                                  setExpandedOrderIds(newExpanded);
                                }}
                                className="text-xs text-primary hover:underline cursor-pointer"
                              >
                                {expandedOrderIds.has(order.id) 
                                  ? 'Thu gọn' 
                                  : `+${order.items.length - 2} sản phẩm`
                                }
                              </button>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="font-bold text-primary">{order.total_price.toLocaleString('vi-VN')}đ</div>
                            {order.payment_proof_url && (
                              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
                                Bill 1 <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {order.second_payment_proof_url && (
                              <a href={order.second_payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
                                Bill 2 <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {(() => {
                              const additionalBills = (order as any).additional_bills as string[] | null;
                              if (!additionalBills || additionalBills.length === 0) return null;
                              return additionalBills.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
                                  Bill {i + 3} <ExternalLink className="h-3 w-3" />
                                </a>
                              ));
                            })()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-7 text-xs w-20"
                              value={surchargeInputs[order.id] ?? (order.surcharge || "")}
                              onChange={(e) => setSurchargeInputs({
                                ...surchargeInputs,
                                [order.id]: e.target.value
                              })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                const value = parseInt(surchargeInputs[order.id] || "0") || 0;
                                updateSurcharge(order.id, value);
                              }}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                          {order.surcharge > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              +{order.surcharge.toLocaleString('vi-VN')}đ
                            </div>
                          )}
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
                          {order.shipping_provider && order.tracking_code && !shippingInfo[order.id]?.editing ? (
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const provider = findProviderByName(order.shipping_provider);
                                  return provider ? (
                                    <img 
                                      src={provider.logo} 
                                      alt={provider.name}
                                      className="h-5 w-auto object-contain"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  ) : null;
                                })()}
                                <span className="font-medium">{order.shipping_provider}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground font-mono">{order.tracking_code}</span>
                                {(() => {
                                  const url = getTrackingUrlFromProvider(order.shipping_provider, order.tracking_code);
                                  return url ? (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : null;
                                })()}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setShippingInfo({
                                  ...shippingInfo,
                                  [order.id]: {
                                    provider: order.shipping_provider || "",
                                    code: order.tracking_code || "",
                                    editing: true
                                  }
                                })}
                              >
                                Sửa
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Select
                                value={shippingInfo[order.id]?.provider || order.shipping_provider || ""}
                                onValueChange={(value) => setShippingInfo({
                                  ...shippingInfo,
                                  [order.id]: {
                                    ...shippingInfo[order.id],
                                    provider: value
                                  }
                                })}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue placeholder="Chọn ĐVVC" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SHIPPING_PROVIDERS.map((p) => (
                                    <SelectItem key={p.id} value={p.shortName}>
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={p.logo} 
                                          alt={p.name}
                                          className="h-4 w-auto object-contain"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                        <span>{p.shortName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Mã vận đơn"
                                className="h-7 text-xs"
                                value={shippingInfo[order.id]?.code || order.tracking_code || ""}
                                onChange={(e) => setShippingInfo({
                                  ...shippingInfo,
                                  [order.id]: {
                                    ...shippingInfo[order.id],
                                    code: e.target.value
                                  }
                                })}
                              />
                              {shippingInfo[order.id]?.editing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs w-full"
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('orders')
                                      .update({
                                        shipping_provider: shippingInfo[order.id]?.provider,
                                        tracking_code: shippingInfo[order.id]?.code
                                      })
                                      .eq('id', order.id);
                                    if (!error) {
                                      setOrders(orders.map(o => o.id === order.id ? {
                                        ...o,
                                        shipping_provider: shippingInfo[order.id]?.provider || "",
                                        tracking_code: shippingInfo[order.id]?.code || ""
                                      } : o));
                                      setShippingInfo({
                                        ...shippingInfo,
                                        [order.id]: { ...shippingInfo[order.id], editing: false }
                                      });
                                      toast({ title: "Đã cập nhật mã vận đơn" });
                                    }
                                  }}
                                >
                                  Lưu
                                </Button>
                              )}
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

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>

            <TabsContent value="merge" className="space-y-4">
              <OrderMerging orders={orders} onMergeComplete={fetchOrders} />
            </TabsContent>

            <TabsContent value="discounts" className="space-y-4">
              <DiscountCodeManagement />
            </TabsContent>


            {/* ========== QUẢN LÝ MASTER ========== */}
            <TabsContent value="master-mgmt">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Quản lý Master
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MasterManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== THEO DÕI TIẾN ĐỘ SẢN PHẨM ========== */}
            <TabsContent value="product-tracking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Theo dõi tiến độ sản phẩm
                  </CardTitle>
                  <CardDescription>Tổng hợp sản phẩm đã đặt từ tất cả đơn hàng (trừ đơn huỷ)</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Aggregate all items from non-cancelled orders
                    const itemMap = new Map<string, { 
                      productId: number; 
                      name: string; 
                      variant: string; 
                      image: string; 
                      totalQty: number; 
                      progress: { [key: string]: number };
                      orderRefs: { orderId: string; orderNumber: string; qty: number; progress: string; deliveryName: string; }[];
                    }>();
                    
                    orders.forEach(order => {
                      if (order.order_progress === 'Đã huỷ') return;
                      const items = order.items as any[];
                      items.forEach((item: any) => {
                        const key = `${item.id}-${item.selectedVariant || 'no-variant'}`;
                        const existing = itemMap.get(key);
                        const orderRef = { orderId: order.id, orderNumber: order.order_number || order.id.slice(0, 8), qty: item.quantity || 1, progress: order.order_progress, deliveryName: order.delivery_name };
                        if (existing) {
                          existing.totalQty += (item.quantity || 1);
                          existing.progress[order.order_progress] = (existing.progress[order.order_progress] || 0) + (item.quantity || 1);
                          existing.orderRefs.push(orderRef);
                        } else {
                          itemMap.set(key, {
                            productId: item.id,
                            name: item.name,
                            variant: item.selectedVariant || '',
                            image: item.image || item.images?.[0] || '',
                            totalQty: item.quantity || 1,
                            progress: { [order.order_progress]: item.quantity || 1 },
                            orderRefs: [orderRef]
                          });
                        }
                      });
                    });
                    
                    const aggregated = Array.from(itemMap.values()).sort((a, b) => b.totalQty - a.totalQty);
                    
                    if (aggregated.length === 0) {
                      return <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào</p>;
                    }

                    // Get unique product names and statuses for filters
                    const uniqueNames = Array.from(new Set(aggregated.map(i => i.name))).sort();
                    const allStatuses = Array.from(new Set(aggregated.flatMap(i => Object.keys(i.progress)))).sort();
                    
                    return (
                      <ProductTrackingFiltered aggregated={aggregated} uniqueNames={uniqueNames} allStatuses={allStatuses} products={products} onProductUpdated={fetchProducts} />
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== CÀI ĐẶT ========== */}
            <TabsContent value="settings">
              <AdminSettings />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
