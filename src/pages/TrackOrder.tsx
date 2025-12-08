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
    case "Chưa thanh toán":
      return "bg-red-100 text-red-800 border-red-200";
    case "Đang xác nhận thanh toán": 
      return "bg-blue-50 text-blue-700 border-blue-200"; // MỚI
    case "Đang xác nhận cọc": 
      return "bg-blue-50 text-blue-700 border-blue-200"; // MỚI
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

const getTrackingUrl = (provider: string, code: string): string | null => {
  const lowerProvider = provider.toLowerCase();
  if (lowerProvider.includes('spx') || lowerProvider === 'shopee express') {
    return `https://spx.vn/track?${code}`;
  }
  if (lowerProvider.includes('ghn') || lowerProvider === 'giao hàng nhanh') {
    return `https://donhang.ghn.vn/?order_code=${code}`;
  }
  if (lowerProvider.includes('ghtk') || lowerProvider === 'giao hàng tiết kiệm') {
    return `https://i.ghtk.vn/${code}`;
  }
  if (lowerProvider.includes('j&t') || lowerProvider.includes('jnt')) {
    return `https://jtexpress.vn/vi/tracking?billcodes=${code}`;
  }
  if (lowerProvider.includes('viettel') || lowerProvider.includes('vtp')) {
    return `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?key=${code}`;
  }
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
    
    // Sort by date
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

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, second_payment_proof_url: publicUrl } 
          : order
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
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      {/* Order number with copy button - left */}
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">#{order.order_number || order.id.slice(0, 8)}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(order.order_number || order.id.slice(0, 8))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* Status badges - right aligned */}
                      <div className="flex flex-wrap gap-1 justify-end">
                        <Badge variant="outline" className={`${getStatusColor(order.payment_status)} border font-medium text-xs`}>
                          {order.payment_status}
                        </Badge>
                        <Badge variant="outline" className={`${getStatusColor(order.order_progress)} border font-medium text-xs`}>
                          {order.order_progress}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng tiền:</span>
                      <span className="font-bold text-primary">{order.total_price.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {order.surcharge > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Phụ thu:</span>
                        <span className="font-bold">+{order.surcharge.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    
                    <Separator />
                    
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
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => startEditing(order)}>
                              <Edit2 className="h-3 w-3 mr-1" />
                              Sửa
                            </Button>
                          )}
                        </div>
                        <p>{order.delivery_name} - {order.delivery_phone}</p>
                        <p className="text-muted-foreground">{order.delivery_address}</p>
                        {order.delivery_note && (
                          <p className="italic text-orange-600">{order.delivery_note}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 bg-muted/50 rounded p-3">
                        <Input
                          placeholder="Tên người nhận"
                          defaultValue={order.delivery_name}
                          onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_name: e.target.value})}
                        />
                        <Input
                          placeholder="SĐT nhận hàng"
                          defaultValue={order.delivery_phone}
                          onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_phone: e.target.value})}
                        />
                        <Textarea
                          placeholder="Địa chỉ"
                          defaultValue={order.delivery_address}
                          onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_address: e.target.value})}
                        />
                        <Textarea
                          placeholder="Ghi chú"
                          defaultValue={order.delivery_note}
                          onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_note: e.target.value})}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingOrderId(null)}>
                            Hủy
                          </Button>
                          <Button size="sm" className="flex-1" onClick={() => handleUpdateDeliveryInfo(order)} disabled={isUpdatingDelivery}>
                            {isUpdatingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Lưu
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Shipping Info */}
                    {order.shipping_provider && order.tracking_code && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3 space-y-1">
                        <p className="font-medium flex items-center gap-1">
                          <Truck className="h-4 w-4" /> Vận chuyển:
                        </p>
                        <p>{order.shipping_provider}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-600">{order.tracking_code}</span>
                          {getTrackingUrl(order.shipping_provider, order.tracking_code) && (
                            <a
                              href={getTrackingUrl(order.shipping_provider, order.tracking_code)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Tra cứu
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />
                    
                    {/* Upload Bill */}
                    <div className="border border-dashed border-primary/30 rounded p-3 bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium text-sm">
                          {order.payment_type === 'deposit' && order.payment_status === 'Đã cọc' 
                            ? 'Thanh toán 50% còn lại' 
                            : 'Đăng bill bổ sung'}
                        </Label>
                        <a 
                          href="/contact" 
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Xem thông tin CK
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadSecondPayment(order.id, e.target.files[0]);
                          }
                        }}
                        disabled={uploadingOrderId === order.id}
                      />
                      {uploadingOrderId === order.id && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang upload...
                        </div>
                      )}
                      {order.second_payment_proof_url && (
                        <a 
                          href={order.second_payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline flex items-center gap-1 mt-2"
                        >
                          <Upload className="h-4 w-4" />
                          Xem bill đã đăng
                        </a>
                      )}
                    </div>
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
