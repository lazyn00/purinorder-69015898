import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Upload, Truck, Save, Edit2, ExternalLink, Search, ArrowUpDown, Copy, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    case "Chưa thanh toán": return "bg-red-50 text-red-700 border-red-200";
    case "Đã thanh toán": return "bg-green-50 text-green-700 border-green-200";
    case "Đang xác nhận thanh toán": return "bg-blue-50 text-blue-700 border-blue-200"; // MỚI
    case "Đã cọc": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Đang xác nhận cọc": return "bg-blue-50 text-blue-700 border-blue-200"; // MỚI
    case "Đã hoàn cọc": return "bg-pink-50 text-pink-700 border-pink-200";
    case "Đã đặt hàng": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Đang sản xuất": return "bg-purple-50 text-purple-700 border-purple-200";
    case "Đang vận chuyển T-V": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Sẵn sàng giao": return "bg-lime-50 text-lime-700 border-lime-200";
    case "Đang giao": return "bg-orange-50 text-orange-700 border-orange-200";
    case "Đã hoàn thành": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Đã huỷ": return "bg-gray-50 text-gray-700 border-gray-200";
    default: return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getTrackingUrl = (provider: string, code: string): string | null => {
  const lowerProvider = provider.toLowerCase();
  if (lowerProvider.includes('spx')) return `https://spx.vn/track?${code}`;
  if (lowerProvider.includes('ghn')) return `https://donhang.ghn.vn/?order_code=${code}`;
  if (lowerProvider.includes('ghtk')) return `https://i.ghtk.vn/${code}`;
  if (lowerProvider.includes('j&t')) return `https://jtexpress.vn/vi/tracking?billcodes=${code}`;
  if (lowerProvider.includes('viettel')) return `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?key=${code}`;
  return null;
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
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [orders, productSearch, sortOrder, progressFilter]);

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
        toast({ title: "Không tìm thấy", description: "Không tìm thấy đơn hàng nào.", variant: "destructive" });
        setOrders([]);
      } else {
        setOrders(data as Order[]);
        toast({ title: "Thành công", description: `Tìm thấy ${data.length} đơn hàng.` });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Đã có lỗi xảy ra.", variant: "destructive" });
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

      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);

      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update({ second_payment_proof_url: publicUrl })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders(orders.map(order => order.id === orderId ? { ...order, second_payment_proof_url: publicUrl } : order));
      toast({ title: "Thành công", description: "Đã upload bill bổ sung thành công!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không thể upload bill.", variant: "destructive" });
    } finally {
      setUploadingOrderId(null);
    }
  };

  const handleUpdateDeliveryInfo = async (order: Order) => {
    setIsUpdatingDelivery(true);
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
        .eq('id', order.id);

      if (updateError) throw updateError;

      setOrders(orders.map(o => o.id === order.id ? { ...o, ...newDeliveryData } : o));
      setEditingOrderId(null);
      setTempDeliveryData({}); 
      toast({ title: "Thành công", description: "Đã cập nhật thông tin giao hàng." });
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không thể cập nhật.", variant: "destructive" });
    } finally {
      setIsUpdatingDelivery(false);
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
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-6">
          <Package className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Tra cứu đơn hàng</h1>
          <p className="text-sm text-muted-foreground">Nhập số điện thoại để kiểm tra</p>
        </div>

        <Card className="mb-6 max-w-md mx-auto">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-sm">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="090..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <Button type="submit" className="w-full h-9 text-sm" disabled={isSearching}>
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Tra cứu ngay"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Đơn hàng ({filteredOrders.length})</h2>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                    <Select value={progressFilter} onValueChange={setProgressFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        <SelectValue placeholder="Tiến độ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {ORDER_PROGRESS_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                    <SelectTrigger className="w-[110px] h-9 text-sm">
                        <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="p-4 bg-muted/20 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">#{order.order_number || order.id.slice(0, 8)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.order_number || order.id)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={`${getStatusColor(order.payment_status)} text-[10px] px-2 py-0.5 h-auto`}>{order.payment_status}</Badge>
                        <Badge variant="outline" className={`${getStatusColor(order.order_progress)} text-[10px] px-2 py-0.5 h-auto`}>{order.order_progress}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-4 text-sm">
                    {/* Sản phẩm */}
                    <div>
                      <div className="space-y-2">
                        {order.items && order.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-foreground/90">
                                {item.name} {item.selectedVariant && <span className="text-muted-foreground">({item.selectedVariant})</span>}
                            </span>
                            <span className="font-medium ml-2">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tổng tiền</span>
                        <span className="font-bold text-base text-primary">
                            {order.total_price.toLocaleString('vi-VN')}đ
                            {order.surcharge > 0 && <span className="text-orange-600 text-xs ml-1">(+{order.surcharge.toLocaleString()}đ)</span>}
                        </span>
                      </div>
                    </div>

                    {/* Thông tin nhận hàng */}
                    <div className="bg-muted/30 p-3 rounded-md text-sm">
                        {editingOrderId !== order.id ? (
                            <>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-xs text-muted-foreground uppercase">Giao tới</span>
                                    {['Đang xử lý', 'Đã đặt hàng', 'Đang sản xuất'].includes(order.order_progress) && (
                                        <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80" onClick={() => startEditing(order)}>
                                            <Edit2 className="h-3 w-3 mr-1" /> Sửa
                                        </Button>
                                    )}
                                </div>
                                <p className="font-medium">{order.delivery_name} • {order.delivery_phone}</p>
                                <p className="text-muted-foreground text-xs mt-0.5">{order.delivery_address}</p>
                                {order.delivery_note && <p className="text-orange-600 text-xs italic mt-1">📝 {order.delivery_note}</p>}
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Input placeholder="Tên" value={tempDeliveryData.delivery_name} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_name: e.target.value})} className="h-8 text-sm" />
                                <Input placeholder="SĐT" value={tempDeliveryData.delivery_phone} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_phone: e.target.value})} className="h-8 text-sm" />
                                <Textarea placeholder="Địa chỉ" value={tempDeliveryData.delivery_address} onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_address: e.target.value})} className="text-sm min-h-[60px]" />
                                <div className="flex gap-2 pt-1">
                                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setEditingOrderId(null)}>Hủy</Button>
                                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleUpdateDeliveryInfo(order)} disabled={isUpdatingDelivery}>
                                        {isUpdatingDelivery ? <Loader2 className="h-3 w-3 animate-spin" /> : "Lưu"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vận chuyển */}
                    {order.shipping_provider && order.tracking_code && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm border border-blue-100">
                            <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium">
                                <Truck className="h-4 w-4" />
                                <span>{order.shipping_provider}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-mono bg-white px-2 py-0.5 rounded border text-xs">{order.tracking_code}</span>
                                {getTrackingUrl(order.shipping_provider, order.tracking_code) && (
                                    <a href={getTrackingUrl(order.shipping_provider, order.tracking_code)!} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                        Tra cứu <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upload Bill Bổ sung */}
                    {order.payment_type === 'deposit' && order.payment_status === 'Đã cọc' && (
                        <div className="border border-dashed border-primary/40 bg-primary/5 p-3 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-primary">Thanh toán phần còn lại</span>
                                <a href="/contact" className="text-[10px] underline text-muted-foreground">Thông tin CK</a>
                            </div>
                            <div className="flex gap-2">
                                <Input type="file" accept="image/*" className="h-8 text-xs w-full" onChange={(e) => e.target.files?.[0] && handleUploadSecondPayment(order.id, e.target.files[0])} disabled={uploadingOrderId === order.id} />
                            </div>
                            {order.second_payment_proof_url && (
                                <a href={order.second_payment_proof_url} target="_blank" className="text-xs text-green-600 flex items-center gap-1 mt-2">
                                    <Upload className="h-3 w-3" /> Đã gửi bill bổ sung
                                </a>
                            )}
                        </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
