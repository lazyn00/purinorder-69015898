import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Upload, Truck, Save, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

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
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Chưa thanh toán":
      return "bg-red-100 text-red-800 border-red-200";
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
    // CẬP NHẬT TÊN VÀ MÀU SẮC CHO TIẾN ĐỘ VẬN CHUYỂN TRUNG - VIỆT
    **case "Đang vận chuyển Trung - Việt":**
      **return "bg-yellow-100 text-yellow-800 border-yellow-200";**     // THÊM TRẠNG THÁI "SẴN SÀNG GIAO" VÀ MÀU SẮC
    **case "Sẵn sàng giao":**
      **return "bg-teal-100 text-teal-800 border-teal-200";**     case "Đang giao":
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

export default function TrackOrder() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tempDeliveryData, setTempDeliveryData] = useState<Partial<Order>>({});
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  
  const { toast } = useToast();

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
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="text-center mb-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Tra cứu đơn hàng</h1>
          <p className="text-muted-foreground">Nhập số điện thoại để tra cứu đơn hàng của bạn</p>
        </div>

        <Card className="mb-8">
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
            <h2 className="text-2xl font-semibold">Đơn hàng của bạn ({orders.length})</h2>
            
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">#{order.order_number || order.id.slice(0, 8)}</CardTitle>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className={`${getStatusColor(order.payment_status)} border font-medium`}>
                        {order.payment_status}
                      </Badge>
                      <Badge variant="outline" className={`${getStatusColor(order.order_progress)} border font-medium`}>
                        {order.order_progress}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tổng tiền</p>
                      <p className="font-bold text-primary">{order.total_price.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-muted-foreground">
                        {order.payment_type === 'deposit' ? 'Đặt cọc 50%' : 'Thanh toán 100%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phương thức</p>
                      <p className="font-medium">{order.payment_method}</p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Sản phẩm</p>
                    <div className="space-y-2">
                      {order.items && order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            x{item.quantity} {item.name}{item.selectedVariant && ` (${item.selectedVariant})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Truck className="h-5 w-5" /> Thông tin nhận hàng
                      </h3>
                      {order.order_progress !== 'Đã hoàn thành' && order.order_progress !== 'Đã huỷ' && editingOrderId !== order.id && (
                        <Button variant="ghost" size="sm" onClick={() => startEditing(order)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </Button>
                      )}
                    </div>
                    
                    {editingOrderId !== order.id ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Người nhận:</span>
                            <span className="font-medium text-right">{order.delivery_name || "Chưa có"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">SĐT nhận hàng:</span>
                            <span className="font-medium text-right">{order.delivery_phone || "Chưa có"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block mb-1">Địa chỉ:</span>
                            <span className="font-medium block text-right break-words">{order.delivery_address || "Chưa có"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block mb-1">Ghi chú:</span>
                            <span className="font-medium block text-right italic text-orange-600 dark:text-orange-400">
                                {order.delivery_note || "Không có ghi chú"}
                            </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor={`name-${order.id}`}>Tên người nhận</Label>
                          <Input
                            id={`name-${order.id}`}
                            defaultValue={order.delivery_name}
                            onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`phone-${order.id}`}>SĐT nhận hàng</Label>
                          <Input
                            id={`phone-${order.id}`}
                            type="tel"
                            defaultValue={order.delivery_phone}
                            onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`address-${order.id}`}>Địa chỉ nhận hàng</Label>
                          <Textarea
                            id={`address-${order.id}`}
                            defaultValue={order.delivery_address}
                            onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_address: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`note-${order.id}`}>Ghi chú (Tùy chọn)</Label>
                          <Textarea
                            id={`note-${order.id}`}
                            defaultValue={order.delivery_note}
                            placeholder="Ví dụ: Giao ngoài giờ hành chính, gọi trước khi giao..."
                            onChange={(e) => setTempDeliveryData({...tempDeliveryData, delivery_note: e.target.value})}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingOrderId(null)}
                            disabled={isUpdatingDelivery}
                          >
                            Hủy
                          </Button>
                          <Button 
                            onClick={() => handleUpdateDeliveryInfo(order)}
                            disabled={isUpdatingDelivery}
                          >
                            {isUpdatingDelivery ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Lưu thay đổi
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {order.shipping_provider && order.tracking_code && (
                    <>
                      <Separator />
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                        <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          📦 Thông tin vận chuyển
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Nhà vận chuyển:</span>
                            <span className="font-medium">{order.shipping_provider}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mã vận đơn:</span>
                            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{order.tracking_code}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 bg-primary/5">
                    <Label className="font-semibold text-lg mb-3 block">
                      {order.payment_type === 'deposit' && order.payment_status === 'Đã cọc' 
                        ? 'Thanh toán 50% còn lại' 
                        : 'Đăng bill bổ sung'}
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      {order.payment_type === 'deposit' && order.payment_status === 'Đã cọc'
                        ? `Vui lòng thanh toán ${(order.total_price * 0.5).toLocaleString('vi-VN')}đ và đăng bill chuyển khoản`
                        : 'Dùng để đăng bill hoàn cọc, phụ thu hoặc thanh toán bổ sung'}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadSecondPayment(order.id, e.target.files[0]);
                        }
                      }}
                      disabled={uploadingOrderId === order.id}
                      className="cursor-pointer"
                    />
                    {uploadingOrderId === order.id && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang upload...
                      </div>
                    )}
                  </div>

                  {order.second_payment_proof_url && (
                    <div className="text-sm mt-3">
                      <a 
                        href={order.second_payment_proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Xem bill thanh toán bổ sung đã đăng
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
