import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Upload, Truck, Save, Edit2, ExternalLink, Search, ArrowUpDown, Copy, Filter, CheckCircle, History, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findProviderByName, getTrackingUrlFromProvider } from "@/data/shippingProviders";
interface StatusHistory {
  id: string;
  order_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string;
  changed_at: string;
  changed_by: string;
}

const ORDER_PROGRESS_OPTIONS = [
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

const getStatusColor = (status: string) => {
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
    case "Đang xử lý":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Sử dụng hàm từ shippingProviders.ts
const getTrackingUrl = (provider: string, code: string): string | null => {
  return getTrackingUrlFromProvider(provider, code);
};

export default function TrackOrder() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tempDeliveryData, setTempDeliveryData] = useState<Partial<Order>>({});
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [statusHistoryMap, setStatusHistoryMap] = useState<Record<string, StatusHistory[]>>({});
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã copy",
      description: `Mã đơn: ${text}`,
    });
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    // Filter by product name
    if (productSearch.trim()) {
      result = result.filter(order => 
        order.items.some((item: any) => 
          item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (item.selectedVariant && item.selectedVariant.toLowerCase().includes(productSearch.toLowerCase()))
        )
      );
    }
    
    // Filter by progress
    if (progressFilter !== "all") {
      result = result.filter(order => order.order_progress === progressFilter);
    }
    
    // Sort by latest status change time (fall back to created_at)
    result.sort((a, b) => {
      const historyA = statusHistoryMap[a.id];
      const historyB = statusHistoryMap[b.id];
      const latestA = historyA && historyA.length > 0 
        ? new Date(historyA[0].changed_at).getTime() 
        : new Date(a.created_at).getTime();
      const latestB = historyB && historyB.length > 0 
        ? new Date(historyB[0].changed_at).getTime() 
        : new Date(b.created_at).getTime();
      return sortOrder === "newest" ? latestB - latestA : latestA - latestB;
    });
    
    return result;
  }, [orders, productSearch, sortOrder, progressFilter, statusHistoryMap]);

  // Fetch status history for all orders when orders are loaded
  useEffect(() => {
    const fetchStatusHistory = async () => {
      if (orders.length === 0) return;
      
      const orderIds = orders.map(o => o.id);
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .in('order_id', orderIds)
        .order('changed_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching status history:', error);
        return;
      }
      
      // Group by order_id
      const historyMap: Record<string, StatusHistory[]> = {};
      (data as StatusHistory[]).forEach(item => {
        if (!historyMap[item.order_id]) {
          historyMap[item.order_id] = [];
        }
        historyMap[item.order_id].push(item);
      });
      
      setStatusHistoryMap(historyMap);
    };
    
    fetchStatusHistory();
  }, [orders]);

  const toggleHistoryExpand = (orderId: string) => {
    setExpandedHistoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatHistoryDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      const order = orders.find(o => o.id === orderId);
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

      // Gửi thông báo cho admin
      if (order) {
        await supabase.from('admin_notifications').insert({
          type: 'payment_proof',
          order_id: orderId,
          order_number: order.order_number || orderId.slice(0, 8),
          message: `Khách hàng đã upload bill bổ sung cho đơn #${order.order_number || orderId.slice(0, 8)}`
        });
      }

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, second_payment_proof_url: publicUrl } 
          : o
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

  const handleUpdateDeliveryInfo = async (order: Order) => {
    setIsUpdatingDelivery(true);
    const orderId = order.id;

    const newDeliveryData = {
      delivery_name: tempDeliveryData.delivery_name || order.delivery_name,
      delivery_phone: tempDeliveryData.delivery_phone || order.delivery_phone,
      delivery_address: tempDeliveryData.delivery_address || order.delivery_address,
      delivery_note: tempDeliveryData.delivery_note || order.delivery_note,
    };

    try {
      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update(newDeliveryData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, ...newDeliveryData } 
          : o
      ));

      // Gửi thông báo cho admin về cập nhật thông tin giao hàng
      await supabase.from('admin_notifications').insert({
        type: 'delivery_update',
        order_id: orderId,
        order_number: order.order_number || orderId.slice(0, 8),
        message: `Khách hàng đã cập nhật thông tin giao hàng cho đơn #${order.order_number || orderId.slice(0, 8)}`
      });

      setEditingOrderId(null);
      setTempDeliveryData({}); 

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin giao hàng.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin giao hàng. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  const handleConfirmComplete = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_progress: 'Đã hoàn thành' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, order_progress: 'Đã hoàn thành' } : o
      ));

      toast({
        title: "Thành công",
        description: "Đơn hàng đã được xác nhận hoàn thành!",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể xác nhận đơn hàng. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const startEditing = (order: Order) => {
    setEditingOrderId(order.id);
    setTempDeliveryData({
      delivery_name: order.delivery_name,
      delivery_phone: order.delivery_phone,
      delivery_address: order.delivery_address,
      delivery_note: order.delivery_note,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Tra cứu đơn hàng</h1>
          <p className="text-muted-foreground">Nhập số điện thoại để tra cứu đơn hàng của bạn</p>
        </div>

        <Card className="mb-8 max-w-xl mx-auto">
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-2xl font-semibold">Đơn hàng của bạn ({filteredOrders.length})</h2>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tiến độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tiến độ</SelectItem>
                    {ORDER_PROGRESS_OPTIONS.map(progress => (
                      <SelectItem key={progress} value={progress}>{progress}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                  <SelectTrigger className="w-full sm:w-32">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Vertical list of order cards */}
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderIds.has(order.id);
                const firstItem = order.items?.[0] as any;
                const itemCount = order.items?.length || 0;
                
                return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Summary row - always visible, clickable */}
                  <button
                    onClick={() => toggleOrderExpand(order.id)}
                    className="w-full text-left"
                  >
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CardTitle className="text-sm font-semibold shrink-0">#{order.order_number || order.id.slice(0, 8)}</CardTitle>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`${getStatusColor(order.order_progress)} border font-medium text-[10px] px-1.5 py-0`}>
                            {order.order_progress}
                          </Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0 px-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">
                          {firstItem ? `${firstItem.name}${itemCount > 1 ? ` (+${itemCount - 1})` : ''}` : 'Không có sản phẩm'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`${getStatusColor(order.payment_status)} border text-[10px] px-1.5 py-0`}>
                            {order.payment_status}
                          </Badge>
                          <span className="font-bold text-primary text-sm">{order.total_price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <CardContent className="pt-0 px-4 pb-4 space-y-3 text-sm border-t">
                      <div className="pt-3 flex items-center justify-between">
                        <span className="text-muted-foreground">Mã đơn:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{order.order_number || order.id.slice(0, 8)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(order.order_number || order.id.slice(0, 8)); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {order.surcharge > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Phụ thu:</span>
                          <span className="font-bold">+{order.surcharge.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      
                      {/* Deposit info */}
                      {order.payment_type === 'deposit' && order.payment_status === 'Đã cọc' && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-amber-800 dark:text-amber-200 font-medium">💰 Còn thiếu:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">
                              {Math.round(order.total_price / 2).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-300">
                            <span className="font-medium">⏰ Deadline hoàn cọc: </span>
                            {(() => {
                              const orderDate = new Date(order.created_at);
                              const deadline = new Date(orderDate);
                              deadline.setMonth(deadline.getMonth() + 1);
                              const now = new Date();
                              const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              if (daysLeft < 0) return <span className="text-red-500 font-bold">Đã quá hạn!</span>;
                              if (daysLeft === 0) return <span className="text-red-500 font-bold">Hôm nay!</span>;
                              if (daysLeft <= 3) return <span className="text-orange-500 font-bold">{deadline.toLocaleDateString('vi-VN')} (còn {daysLeft} ngày)</span>;
                              return <span>{deadline.toLocaleDateString('vi-VN')} (còn {daysLeft} ngày)</span>;
                            })()}
                          </div>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Vui lòng thanh toán 50% còn lại trước deadline để hoàn tất đơn hàng.
                          </p>
                        </div>
                      )}
                      
                      {/* Status History */}
                      {statusHistoryMap[order.id] && statusHistoryMap[order.id].length > 0 && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleHistoryExpand(order.id); }}
                            className="flex items-center justify-between w-full text-sm font-medium"
                          >
                            <span className="flex items-center gap-2">
                              <History className="h-4 w-4" />
                              Lịch sử trạng thái ({statusHistoryMap[order.id].length})
                            </span>
                            {expandedHistoryIds.has(order.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {expandedHistoryIds.has(order.id) && (
                            <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                              {statusHistoryMap[order.id].map((history) => (
                                <div key={history.id} className="text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{history.field_changed === 'payment_status' ? 'Thanh toán' : 'Tiến độ'}:</span>
                                    <span className="text-muted-foreground">{history.old_value || 'N/A'}</span>
                                    <span>→</span>
                                    <Badge variant="outline" className={`${getStatusColor(history.new_value)} text-[10px] px-1 py-0`}>
                                      {history.new_value}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground mt-0.5">{formatHistoryDate(history.changed_at)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />
                      
                      {/* Products list */}
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Sản phẩm:</p>
                        <div className="space-y-1">
                          {order.items && order.items.map((item: any, index: number) => (
                            <div key={index} className="text-sm">
                              x{item.quantity} {item.name}{item.selectedVariant && ` (${item.selectedVariant})`}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Info */}
                      {editingOrderId !== order.id ? (
                        <div className="bg-muted/50 rounded p-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">📍 Thông tin nhận:</span>
                            {order.order_progress !== 'Đã hoàn thành' && order.order_progress !== 'Đã huỷ' && (
                              <Button variant="ghost" size="sm" className="h-7" onClick={(e) => { e.stopPropagation(); startEditing(order); }}>
                                <Edit2 className="h-3 w-3 mr-1" /> Sửa
                              </Button>
                            )}
                          </div>
                          <p>{order.delivery_name} - {order.delivery_phone}</p>
                          <p className="text-muted-foreground">{order.delivery_address}</p>
                          {order.delivery_note && <p className="italic text-orange-600">{order.delivery_note}</p>}
                        </div>
                      ) : (
                        <div className="space-y-2 bg-muted/50 rounded p-3" onClick={(e) => e.stopPropagation()}>
                          <Input placeholder="Tên người nhận" defaultValue={order.delivery_name} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_name: e.target.value})} />
                          <Input placeholder="SĐT nhận hàng" defaultValue={order.delivery_phone} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_phone: e.target.value})} />
                          <Textarea placeholder="Địa chỉ" defaultValue={order.delivery_address} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_address: e.target.value})} />
                          <Textarea placeholder="Ghi chú" defaultValue={order.delivery_note} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_note: e.target.value})} />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingOrderId(null)}>Hủy</Button>
                            <Button size="sm" className="flex-1" onClick={() => handleUpdateDeliveryInfo(order)} disabled={isUpdatingDelivery}>
                              {isUpdatingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Lưu
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Shipping Info */}
                      {order.shipping_provider && order.tracking_code && (() => {
                        const provider = findProviderByName(order.shipping_provider);
                        const trackingUrl = getTrackingUrl(order.shipping_provider, order.tracking_code);
                        return (
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-2">
                            <p className="font-medium flex items-center gap-1 text-sm"><Truck className="h-4 w-4" /> Vận chuyển</p>
                            <div className="flex items-center gap-3">
                              {provider && <img src={provider.logo} alt={provider.name} className="h-6 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{order.shipping_provider}</p>
                                <p className="font-mono text-blue-600 dark:text-blue-400 text-sm">{order.tracking_code}</p>
                              </div>
                              {trackingUrl && (
                                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full">
                                  <ExternalLink className="h-4 w-4" /> Tra cứu
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Confirm Complete */}
                      {order.order_progress === 'Đang giao' && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">✨ Bạn đã nhận được hàng? Xác nhận hoàn thành nhé!</p>
                          <p className="text-xs text-muted-foreground mb-3">💡 Sau 7 ngày đơn sẽ tự động hoàn thành.</p>
                          <Button onClick={(e) => { e.stopPropagation(); handleConfirmComplete(order.id); }} disabled={confirmingOrderId === order.id} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            {confirmingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Xác nhận đã nhận hàng
                          </Button>
                        </div>
                      )}

                      <Separator />
                      
                      {/* Upload Bill */}
                      <div className="border border-dashed border-primary/30 rounded p-3 bg-primary/5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium text-sm">
                            {order.payment_type === 'deposit' && order.payment_status === 'Đã cọc' ? 'Thanh toán 50% còn lại' : 'Đăng bill bổ sung'}
                          </Label>
                          <a href="/contact" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Xem thông tin CK <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUploadSecondPayment(order.id, e.target.files[0]); }} disabled={uploadingOrderId === order.id} />
                        {uploadingOrderId === order.id && (
                          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang upload...</div>
                        )}
                        {order.second_payment_proof_url && (
                          <a href={order.second_payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1 mt-2">
                            <Upload className="h-4 w-4" /> Xem bill đã đăng
                          </a>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
