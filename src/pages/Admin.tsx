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
import { Loader2, LogOut, Trash2, TrendingUp, ShoppingCart, DollarSign, ExternalLink, Package, Search, Copy, FileDown, Bell, Mail, CheckSquare, Square, BarChart3, Save, Scan, AlertTriangle, CheckCircle, ClipboardList, Eye, Check, X, CalendarIcon, Tag, Merge, Users, Image, Settings } from "lucide-react";
import { DiscountCodeManagement } from "@/components/DiscountCodeManagement";
import { OrderMerging } from "@/components/OrderMerging";
import AffiliateManagement from "@/components/AffiliateManagement";
import ImageSyncManager from "@/components/ImageSyncManager";
import AdminSettings from "@/components/AdminSettings";
import * as XLSX from 'xlsx';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { productsData } from "@/data/products";
import { SHIPPING_PROVIDERS, findProviderByName, getTrackingUrlFromProvider } from "@/data/shippingProviders";
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
  
  // ========== STATE CHO AI BILL ANALYSIS ==========
  const [analyzingBillOrderId, setAnalyzingBillOrderId] = useState<string | null>(null);
  const [billAnalysisResults, setBillAnalysisResults] = useState<{[orderId: string]: {
    extracted: {
      amount: number | null;
      date: string | null;
      bank: string | null;
      transactionId: string | null;
      senderName: string | null;
      receiverName: string | null;
      content: string | null;
      confidence: 'high' | 'medium' | 'low';
    };
    verification: {
      extractedAmount: number;
      expectedAmount: number;
      isMatch: boolean;
      difference: number;
      percentDifference: string;
    } | null;
  }}>({});
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
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
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
        return date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
      } else if (daysCount > 31) {
        // Nhóm theo tuần
        const weekNumber = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return `Tuần ${weekNumber + 1}`;
      }
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
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

  // Tính toán tiền công và tiền chênh theo từng sản phẩm/variant
  const costStatistics = useMemo(() => {
    let totalServiceFee = 0;
    let totalProfit = 0;
    let productsWithActualCost = 0;

    const productMap = new Map<number, ProductData>();
    products.forEach(p => productMap.set(p.id, p));

    orders.forEach(order => {
      if (order.order_progress === 'Đã huỷ') return;
      
      const items = order.items as any[];
      items.forEach(item => {
        const product = productMap.get(item.id);
        if (!product) return;

        const quantity = item.quantity || 1;
        
        let variantActualRate = product.actual_rate;
        let variantActualCan = product.actual_can;
        let variantActualPack = product.actual_pack;
        let variantCong = product.cong;
        let variantTe = product.te;
        let itemPrice = item.price || product.price;

        if (item.selectedVariant && (product as any).variants) {
          const variants = (product as any).variants as any[];
          const matchedVariant = variants.find((v: any) => v.name === item.selectedVariant);
          if (matchedVariant) {
            itemPrice = matchedVariant.price || itemPrice;
            if (matchedVariant.actual_rate !== undefined) variantActualRate = matchedVariant.actual_rate;
            if (matchedVariant.actual_can !== undefined) variantActualCan = matchedVariant.actual_can;
            if (matchedVariant.actual_pack !== undefined) variantActualPack = matchedVariant.actual_pack;
            if (matchedVariant.cong !== undefined) variantCong = matchedVariant.cong;
            if (matchedVariant.te !== undefined) variantTe = matchedVariant.te;
          }
        }
        
        if (variantCong) {
          totalServiceFee += (variantCong * quantity);
        }

        if (variantActualRate || variantActualCan || variantActualPack) {
          const te = variantTe || 0;
          const actualRate = variantActualRate || product.rate || 0;
          const actualCan = variantActualCan || 0;
          const actualPack = variantActualPack || 0;
          const cong = variantCong || 0;
          
          const actualCost = (te * actualRate) + actualCan + actualPack + cong;
          const profit = itemPrice - actualCost;
          totalProfit += (profit * quantity);
          productsWithActualCost++;
        }
      });
    });

    return {
      totalServiceFee,
      totalProfit,
      productsWithActualCost
    };
  }, [orders, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, te, rate, actual_rate, actual_can, actual_pack, cong, variants');
      
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
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      const order = orders.find(o => o.id === orderId);
      
      if (order && order.customer_email) {
        try {
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
              status: `${newStatus} - ${order.order_progress}`,
              type: 'status_change'
            }
          });
          
          console.log('Payment status email notification sent');
        } catch (emailError) {
          console.warn('Failed to send payment status email:', emailError);
        }
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

      const order = orders.find(o => o.id === orderId);
      
      if (order && order.customer_email) {
        try {
          const emailType = newProgress === "Đã hoàn cọc" ? 'refund' : 'status_change';
          
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
      'Ngày đặt': new Date(order.created_at).toLocaleDateString('vi-VN'),
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
    
    const fileName = `don-hang-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
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

  // ========== AI BILL ANALYSIS ==========
  const analyzeBill = async (orderId: string, imageUrl: string, orderTotal: number) => {
    setAnalyzingBillOrderId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-payment-proof', {
        body: { imageUrl, orderTotal }
      });

      if (error) throw error;

      if (data.success) {
        setBillAnalysisResults(prev => ({
          ...prev,
          [orderId]: {
            extracted: data.extracted,
            verification: data.verification
          }
        }));

        // Auto-update payment status if amount matches
        if (data.verification?.isMatch) {
          toast({
            title: "✅ Số tiền khớp!",
            description: `Đã xác nhận bill ${data.extracted.amount?.toLocaleString('vi-VN')}đ = ${orderTotal.toLocaleString('vi-VN')}đ`,
          });
        } else if (data.verification && !data.verification.isMatch) {
          toast({
            title: "⚠️ Số tiền không khớp",
            description: `Bill: ${data.extracted.amount?.toLocaleString('vi-VN')}đ | Đơn: ${orderTotal.toLocaleString('vi-VN')}đ (Chênh lệch: ${data.verification.difference.toLocaleString('vi-VN')}đ)`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing bill:', error);
      toast({
        title: "Lỗi",
        description: "Không thể phân tích bill. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingBillOrderId(null);
    }
  };
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
                          onClick={() => markNotificationAsRead(notif.id)}
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
              <TabsTrigger value="stats" className="h-10 w-10 p-0" title="Doanh thu">
                <BarChart3 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="products" className="h-10 w-10 p-0" title="Thống kê sản phẩm">
                <Package className="h-5 w-5" />
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
              <TabsTrigger value="listings" onClick={fetchUserListings} className="h-10 w-10 p-0 relative" title="Duyệt sản phẩm đăng bán">
                <ClipboardList className="h-5 w-5" />
                {userListings.filter(l => l.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    {userListings.filter(l => l.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" onClick={fetchNotifications} className="h-10 w-10 p-0" title="Thông báo sản phẩm">
                <Mail className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="affiliates" className="h-10 w-10 p-0" title="Quản lý CTV">
                <Users className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="image-sync" className="h-10 w-10 p-0" title="Đồng bộ hình ảnh">
                <Image className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="settings" className="h-10 w-10 p-0" title="Cài đặt">
                <Settings className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              {/* Tổng quan */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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
                      {statistics.progressCounts['Đã hoàn thành'] || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((statistics.progressCounts['Đã hoàn thành'] || 0) / statistics.totalOrders * 100).toFixed(1)}% tổng đơn
                    </p>
                  </CardContent>
                </Card>
              </div>

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

            <TabsContent value="products" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng sản phẩm đã bán</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {productStats.reduce((sum, p) => sum + p.count, 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Số loại sản phẩm</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{productStats.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Số danh mục</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categoryStats.length}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Danh sách sản phẩm đã bán</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm sản phẩm..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {productStats
                      .filter(product => 
                        productSearchTerm === '' ||
                        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                        product.productName.toLowerCase().includes(productSearchTerm.toLowerCase())
                      )
                      .map((product) => (
                      <div key={product.name} className="flex items-center justify-between gap-2 p-2 border rounded hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{product.productName}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{product.count}</Badge>
                      </div>
                    ))}
                    {productStats.filter(product => 
                      productSearchTerm === '' ||
                      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                      product.productName.toLowerCase().includes(productSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Không tìm thấy sản phẩm</p>
                    )}
                  </div>
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
                            <div className="text-sm">#{order.order_number || order.id.slice(0, 8)}</div>
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
                              <div className="flex items-center justify-end gap-1">
                                <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                  Bill 1 <ExternalLink className="h-3 w-3" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => analyzeBill(order.id, order.payment_proof_url, order.total_price)}
                                  disabled={analyzingBillOrderId === order.id}
                                  title="Phân tích bill bằng AI"
                                >
                                  {analyzingBillOrderId === order.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Scan className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                            {order.second_payment_proof_url && (
                              <div className="flex items-center justify-end gap-1">
                                <a href={order.second_payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                                  Bill 2 <ExternalLink className="h-3 w-3" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => analyzeBill(order.id, order.second_payment_proof_url, order.total_price / 2)}
                                  disabled={analyzingBillOrderId === order.id}
                                  title="Phân tích bill bằng AI"
                                >
                                  {analyzingBillOrderId === order.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Scan className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                            {/* AI Analysis Results */}
                            {billAnalysisResults[order.id] && (
                              <div className="text-left text-[10px] bg-muted/50 rounded p-1.5 mt-1 space-y-0.5">
                                {billAnalysisResults[order.id].verification && (
                                  <div className={`flex items-center gap-1 font-medium ${billAnalysisResults[order.id].verification?.isMatch ? 'text-green-600' : 'text-red-500'}`}>
                                    {billAnalysisResults[order.id].verification?.isMatch ? (
                                      <><CheckCircle className="h-3 w-3" /> Khớp</>
                                    ) : (
                                      <><AlertTriangle className="h-3 w-3" /> Chênh {billAnalysisResults[order.id].verification?.difference.toLocaleString('vi-VN')}đ</>
                                    )}
                                  </div>
                                )}
                                {billAnalysisResults[order.id].extracted.amount && (
                                  <div>💰 {billAnalysisResults[order.id].extracted.amount?.toLocaleString('vi-VN')}đ</div>
                                )}
                                {billAnalysisResults[order.id].extracted.bank && (
                                  <div>🏦 {billAnalysisResults[order.id].extracted.bank}</div>
                                )}
                                {billAnalysisResults[order.id].extracted.date && (
                                  <div>📅 {billAnalysisResults[order.id].extracted.date}</div>
                                )}
                              </div>
                            )}
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

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Quản lý thông báo sản phẩm có hàng
                  </CardTitle>
                  <CardDescription>
                    Danh sách khách hàng đăng ký nhận thông báo khi sản phẩm có hàng trở lại
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingNotifications ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có đăng ký thông báo nào
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(
                        notifications.reduce((acc, notif) => {
                          if (!acc[notif.product_id]) {
                            acc[notif.product_id] = [];
                          }
                          acc[notif.product_id].push(notif);
                          return acc;
                        }, {} as Record<number, ProductNotification[]>)
                      ).map(([productId, productNotifs]) => {
                        const unnotifiedCount = productNotifs.filter(n => !n.notified).length;
                        return (
                          <Card key={productId}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg">{productNotifs[0].product_name}</CardTitle>
                                  <CardDescription>
                                    {productNotifs.length} đăng ký • {unnotifiedCount} chưa thông báo
                                  </CardDescription>
                                </div>
                                {unnotifiedCount > 0 && (
                                  <Button
                                    onClick={() => sendProductNotification(Number(productId), productNotifs[0].product_name)}
                                    className="gap-2"
                                  >
                                    <Mail className="h-4 w-4" />
                                    Gửi thông báo ({unnotifiedCount})
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {productNotifs.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className="flex items-center justify-between p-2 rounded-lg border bg-card text-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      {notif.social_link ? (
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <div>
                                        <div className="font-medium">
                                          {notif.social_link ? (
                                            <a 
                                              href={notif.social_link.startsWith('http') ? notif.social_link : `https://${notif.social_link}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary hover:underline"
                                            >
                                              {notif.social_link}
                                            </a>
                                          ) : notif.email || "N/A"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Đăng ký: {new Date(notif.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                      </div>
                                    </div>
                                    {notif.notified ? (
                                      <Badge variant="secondary" className="gap-1">
                                        <CheckSquare className="h-3 w-3" />
                                        Đã gửi
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="gap-1">
                                        <Square className="h-3 w-3" />
                                        Chưa gửi
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== TAB DUYỆT SẢN PHẨM ĐĂNG BÁN ========== */}
            <TabsContent value="listings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Quản lý sản phẩm đăng bán
                  </CardTitle>
                  <CardDescription>
                    Duyệt và quản lý các bài đăng bán từ người dùng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên, mã bài, SĐT..."
                        value={listingSearchTerm}
                        onChange={(e) => setListingSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={listingStatusFilter} onValueChange={setListingStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="approved">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                        <SelectItem value="sold">Đã bán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingListings ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredListings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có bài đăng nào
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredListings.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                              {/* Images */}
                              <div className="flex gap-2 flex-shrink-0">
                                {(listing.images as string[]).slice(0, 3).map((img, idx) => (
                                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={img} 
                                      alt={`${listing.name} ${idx + 1}`}
                                      className="w-16 h-16 object-cover rounded border hover:opacity-80 transition"
                                    />
                                  </a>
                                ))}
                                {(listing.images as string[]).length > 3 && (
                                  <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                                    +{(listing.images as string[]).length - 3}
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold text-lg">{listing.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <span className="font-mono">{listing.listing_code}</span>
                                      <span>•</span>
                                      <span>{listing.category} / {listing.subcategory}</span>
                                      <span>•</span>
                                      <Badge variant="outline">{listing.tag}</Badge>
                                    </div>
                                  </div>
                                  <Badge className={getListingStatusColor(listing.status)}>
                                    {getListingStatusLabel(listing.status)}
                                  </Badge>
                                </div>

                                {listing.description && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {listing.description}
                                  </p>
                                )}

                                {/* Price / Variants */}
                                <div className="mt-2">
                                  {listing.variants && listing.variants.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {(listing.variants as { name: string; price: number }[]).map((v, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {v.name}: {v.price.toLocaleString('vi-VN')}đ
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : listing.price ? (
                                    <span className="font-semibold text-primary">
                                      {listing.price.toLocaleString('vi-VN')}đ
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Liên hệ</span>
                                  )}
                                </div>

                                {/* Seller Info */}
                                <div className="mt-3 pt-3 border-t">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-sm"
                                    onClick={() => setExpandedListingId(
                                      expandedListingId === listing.id ? null : listing.id
                                    )}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {expandedListingId === listing.id ? 'Ẩn' : 'Xem'} thông tin người bán
                                  </Button>

                                  {expandedListingId === listing.id && (
                                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                                      <p><strong>SĐT:</strong> {listing.seller_phone}</p>
                                      <p>
                                        <strong>MXH:</strong>{' '}
                                        <a 
                                          href={listing.seller_social.startsWith('http') ? listing.seller_social : `https://${listing.seller_social}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          {listing.seller_social}
                                        </a>
                                      </p>
                                      <p><strong>Ngân hàng:</strong> {listing.seller_bank_name}</p>
                                      <p><strong>STK:</strong> {listing.seller_bank_account}</p>
                                      <p><strong>Tên TK:</strong> {listing.seller_account_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Đăng lúc: {new Date(listing.created_at).toLocaleString('vi-VN')}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Admin Actions */}
                                <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                                  <Input
                                    placeholder="Ghi chú admin..."
                                    className="flex-1 h-8 text-sm min-w-[150px]"
                                    value={adminNoteInputs[listing.id] ?? (listing.admin_note || "")}
                                    onChange={(e) => setAdminNoteInputs({
                                      ...adminNoteInputs,
                                      [listing.id]: e.target.value
                                    })}
                                  />
                                  
                                  {listing.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="gap-1"
                                        onClick={() => updateListingStatus(listing.id, 'approved')}
                                      >
                                        <Check className="h-4 w-4" />
                                        Duyệt
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="gap-1"
                                        onClick={() => updateListingStatus(listing.id, 'rejected')}
                                      >
                                        <X className="h-4 w-4" />
                                        Từ chối
                                      </Button>
                                    </>
                                  )}

                                  {listing.status === 'approved' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => updateListingStatus(listing.id, 'sold')}
                                    >
                                      Đánh dấu đã bán
                                    </Button>
                                  )}

                                  <Select
                                    value={listing.status}
                                    onValueChange={(value) => updateListingStatus(listing.id, value)}
                                  >
                                    <SelectTrigger className="w-[120px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                                      <SelectItem value="approved">Đã duyệt</SelectItem>
                                      <SelectItem value="rejected">Từ chối</SelectItem>
                                      <SelectItem value="sold">Đã bán</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteListing(listing.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>

                                {listing.admin_note && (
                                  <div className="mt-2 text-sm text-muted-foreground italic">
                                    Ghi chú: {listing.admin_note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* ================================================== */}

            {/* ========== QUẢN LÝ CTV ========== */}
            <TabsContent value="affiliates">
              <AffiliateManagement />
            </TabsContent>

            {/* ========== ĐỒNG BỘ HÌNH ẢNH ========== */}
            <TabsContent value="image-sync">
              <ImageSyncManager />
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
