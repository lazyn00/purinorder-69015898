import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Search, ArrowUpDown, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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

const TAB_GROUPS = [
  { label: "Tất cả", value: "all" },
  { label: "Đang xử lý", value: "Đang xử lý" },
  { label: "Đã đặt", value: "Đã đặt hàng" },
  { label: "Sản xuất", value: "Đang sản xuất" },
  { label: "VC T-V", value: "Đang vận chuyển T-V" },
  { label: "Sẵn sàng", value: "Sẵn sàng giao" },
  { label: "Đang giao", value: "Đang giao" },
  { label: "Hoàn thành", value: "Đã hoàn thành" },
  { label: "Đã huỷ", value: "Đã huỷ" },
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
  additional_bills: string[];
  shipping_provider: string;
  tracking_code: string;
  surcharge: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Chưa thanh toán":
      return "bg-red-100 text-red-800 border-red-200";
    case "Đang xác nhận thanh toán":
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


function getItemThumbnail(item: any): string | null {
  const images = item.images || [];
  if (item.selectedVariant && item.variantImageMap) {
    const vi = item.variantImageMap[item.selectedVariant];
    if (vi !== undefined && images[vi]) return images[vi];
  }
  if (images.length > 0) return images[0];
  if (item.image) return item.image;
  return null;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [statusHistoryMap, setStatusHistoryMap] = useState<Record<string, StatusHistory[]>>({});

  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã copy", description: `Mã đơn: ${text}` });
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (productSearch.trim()) {
      result = result.filter(order => 
        order.items.some((item: any) => 
          item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (item.selectedVariant && item.selectedVariant.toLowerCase().includes(productSearch.toLowerCase()))
        )
      );
    }
    if (progressFilter !== "all") {
      result = result.filter(order => order.order_progress === progressFilter);
    }
    result.sort((a, b) => {
      const historyA = statusHistoryMap[a.id];
      const historyB = statusHistoryMap[b.id];
      const latestA = historyA && historyA.length > 0 ? new Date(historyA[0].changed_at).getTime() : new Date(a.created_at).getTime();
      const latestB = historyB && historyB.length > 0 ? new Date(historyB[0].changed_at).getTime() : new Date(b.created_at).getTime();
      return sortOrder === "newest" ? latestB - latestA : latestA - latestB;
    });
    return result;
  }, [orders, productSearch, sortOrder, progressFilter, statusHistoryMap]);

  // Stats
  const stats = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      map[o.order_progress] = (map[o.order_progress] || 0) + 1;
    });
    return map;
  }, [orders]);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      if (orders.length === 0) return;
      const orderIds = orders.map(o => o.id);
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .in('order_id', orderIds)
        .order('changed_at', { ascending: false });
      if (error) { console.error('Error fetching status history:', error); return; }
      const historyMap: Record<string, StatusHistory[]> = {};
      (data as StatusHistory[]).forEach(item => {
        if (!historyMap[item.order_id]) historyMap[item.order_id] = [];
        historyMap[item.order_id].push(item);
      });
      setStatusHistoryMap(historyMap);
    };
    fetchStatusHistory();
  }, [orders]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số điện thoại", variant: "destructive" });
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
        toast({ title: "Không tìm thấy", description: "Không tìm thấy đơn hàng nào với số điện thoại này.", variant: "destructive" });
        setOrders([]);
      } else {
        setOrders(data as Order[]);
        toast({ title: "Thành công", description: `Tìm thấy ${data.length} đơn hàng.` });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Đã có lỗi xảy ra. Vui lòng thử lại.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Tra cứu đơn hàng</h1>
          <p className="text-muted-foreground">Nhập số điện thoại để tra cứu đơn hàng của bạn</p>
        </div>

        {/* Search card */}
        <Card className="mb-8 max-w-xl mx-auto">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" type="tel" placeholder="Nhập số điện thoại đã dùng khi đặt hàng" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tìm kiếm...</>) : "Tra cứu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {orders.length > 0 && (
          <div className="space-y-4">
            {/* Sticky search + stats bar */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4 border-b border-border/50">
              {/* Stats overview */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="bg-primary/10 rounded-full px-3 py-1 text-xs font-medium text-primary">
                  📦 Tổng: {orders.length} đơn
                </div>
                {stats["Đang giao"] > 0 && (
                  <div className="bg-orange-100 rounded-full px-3 py-1 text-xs font-medium text-orange-700">
                    🚚 Đang giao: {stats["Đang giao"]}
                  </div>
                )}
                {stats["Đã hoàn thành"] > 0 && (
                  <div className="bg-emerald-100 rounded-full px-3 py-1 text-xs font-medium text-emerald-700">
                    ✅ Hoàn thành: {stats["Đã hoàn thành"]}
                  </div>
                )}
                {(stats["Đang xử lý"] || 0) + (stats["Đã đặt hàng"] || 0) + (stats["Đang sản xuất"] || 0) > 0 && (
                  <div className="bg-blue-100 rounded-full px-3 py-1 text-xs font-medium text-blue-700">
                    ⏳ Đang xử lý: {(stats["Đang xử lý"] || 0) + (stats["Đã đặt hàng"] || 0) + (stats["Đang sản xuất"] || 0)}
                  </div>
                )}
              </div>

              {/* Search + sort row */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Tìm theo sản phẩm..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                  <SelectTrigger className="w-28 h-9">
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs for filtering */}
              <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {TAB_GROUPS.map(tab => {
                  const count = tab.value === "all" ? orders.length : (stats[tab.value] || 0);
                  if (tab.value !== "all" && count === 0) return null;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setProgressFilter(tab.value)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        progressFilter === tab.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {tab.label} {count > 0 && <span className="ml-0.5 opacity-75">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results header */}
            <h2 className="text-lg font-semibold text-muted-foreground">
              {filteredOrders.length} đơn hàng {progressFilter !== "all" ? `• ${progressFilter}` : ""}
            </h2>
            
            {/* Order cards */}
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const itemCount = order.items?.length || 0;
                
                
                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Summary row with thumbnails */}
                    <button onClick={() => navigate(`/order/${order.id}`)} className="w-full text-left">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CardTitle className="text-sm font-semibold shrink-0">#{order.order_number || order.id.slice(0, 8)}</CardTitle>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(order.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className={`${getStatusColor(order.order_progress)} border font-medium text-[10px] px-1.5 py-0`}>
                              {order.order_progress}
                            </Badge>
                            <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3 pt-0 px-4">
                        <div className="flex items-center gap-3">
                          {/* Product thumbnails on summary */}
                          <div className="flex -space-x-2 shrink-0">
                            {order.items?.slice(0, 3).map((item: any, i: number) => {
                              const src = getItemThumbnail(item);
                              return src ? (
                                <img key={i} src={src} alt={item.name} className="w-9 h-9 rounded-md object-cover border-2 border-card shadow-sm" />
                              ) : (
                                <div key={i} className="w-9 h-9 rounded-md bg-muted border-2 border-card flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              );
                            })}
                            {itemCount > 3 && (
                              <div className="w-9 h-9 rounded-md bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                                +{itemCount - 3}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground truncate">
                              {order.items?.[0]?.name}{itemCount > 1 ? ` (+${itemCount - 1})` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={`${getStatusColor(order.payment_status)} border text-[10px] px-1.5 py-0`}>
                              {order.payment_status}
                            </Badge>
                            <span className="font-bold text-primary text-sm">{order.total_price.toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      </CardContent>
                    </button>

                  </Card>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy đơn hàng phù hợp</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
