import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, ArrowLeft, Copy, Save, Package, MapPin, History,
  CreditCard, Truck, ExternalLink, Upload, Edit2, CheckCircle,
  ChevronDown, ChevronUp, Facebook
} from "lucide-react";
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
  shipping_fee: number;
  other_fee: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Chưa thanh toán": return "bg-red-100 text-red-800 border-red-200";
    case "Đang xác nhận thanh toán":
    case "Đang xác nhận cọc": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Đã thanh toán": return "bg-green-100 text-green-800 border-green-200";
    case "Đã cọc": return "bg-amber-100 text-amber-800 border-amber-200";
    case "Đã hoàn cọc": return "bg-pink-100 text-pink-800 border-pink-200";
    case "Đã đặt hàng": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Đang sản xuất": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Đang vận chuyển T-V": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Sẵn sàng giao": return "bg-lime-100 text-lime-800 border-lime-200";
    case "Đang giao": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Đã hoàn thành": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Đã huỷ": return "bg-gray-100 text-gray-800 border-gray-200";
    case "Đang xử lý": return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
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

export default function CustomerOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempDelivery, setTempDelivery] = useState<Partial<Order>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      setOrder(data as Order);

      // Fetch status history
      const { data: historyData } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("changed_at", { ascending: false });
      if (historyData) setStatusHistory(historyData as StatusHistory[]);
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không tìm thấy đơn hàng.", variant: "destructive" });
      navigate("/track-order");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã copy", description: `Mã đơn: ${text}` });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const handleUpdateDelivery = async () => {
    if (!order) return;
    setIsUpdating(true);
    const newData = {
      delivery_name: tempDelivery.delivery_name || order.delivery_name,
      delivery_phone: tempDelivery.delivery_phone || order.delivery_phone,
      delivery_address: tempDelivery.delivery_address || order.delivery_address,
      delivery_note: tempDelivery.delivery_note || order.delivery_note,
    };
    try {
      const { error } = await (supabase as any).from("orders").update(newData).eq("id", order.id);
      if (error) throw error;
      setOrder({ ...order, ...newData });
      await supabase.from("admin_notifications").insert({
        type: "delivery_update", order_id: order.id,
        order_number: order.order_number || order.id.slice(0, 8),
        message: `Khách hàng đã cập nhật thông tin giao hàng cho đơn #${order.order_number || order.id.slice(0, 8)}`,
      });
      setEditing(false);
      setTempDelivery({});
      toast({ title: "Thành công", description: "Đã cập nhật thông tin giao hàng." });
    } catch {
      toast({ title: "Lỗi", description: "Không thể cập nhật.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadBill = async (file: File) => {
    if (!order) return;
    setUploadingBill(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);
      const currentBills = order.additional_bills || [];
      const newBills = [...currentBills, publicUrl];
      const { error } = await (supabase as any).from("orders").update({ additional_bills: newBills }).eq("id", order.id);
      if (error) throw error;
      await supabase.from("admin_notifications").insert({
        type: "payment_proof", order_id: order.id,
        order_number: order.order_number || order.id.slice(0, 8),
        message: `Khách hàng đã upload bill bổ sung cho đơn #${order.order_number || order.id.slice(0, 8)}`,
      });
      setOrder({ ...order, additional_bills: newBills });
      toast({ title: "Thành công", description: "Đã upload bill bổ sung!" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể upload bill.", variant: "destructive" });
    } finally {
      setUploadingBill(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!order) return;
    setConfirmingComplete(true);
    try {
      const { error } = await supabase.from("orders").update({ order_progress: "Đã hoàn thành" }).eq("id", order.id);
      if (error) throw error;
      setOrder({ ...order, order_progress: "Đã hoàn thành" });
      toast({ title: "Thành công", description: "Đơn hàng đã được xác nhận hoàn thành!" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể xác nhận.", variant: "destructive" });
    } finally {
      setConfirmingComplete(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  const orderCode = order.order_number || order.id.slice(0, 8);
  const provider = order.shipping_provider ? findProviderByName(order.shipping_provider) : null;
  const trackingUrl = order.shipping_provider && order.tracking_code
    ? getTrackingUrlFromProvider(order.shipping_provider, order.tracking_code)
    : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        {/* Order header */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Đơn #{orderCode}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyToClipboard(orderCode)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className={`${getStatusColor(order.order_progress)} border font-medium`}>
                {order.order_progress}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(order.payment_status)} border font-medium`}>
                {order.payment_status}
              </Badge>
              {order.payment_type === "deposit" && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Cọc 50%</Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Confirm complete */}
        {order.order_progress === "Đang giao" && (
          <Card className="mb-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">✨ Bạn đã nhận được hàng? Xác nhận hoàn thành nhé!</p>
              <p className="text-xs text-muted-foreground mb-3">💡 Sau 7 ngày đơn sẽ tự động hoàn thành.</p>
              <Button onClick={handleConfirmComplete} disabled={confirmingComplete} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {confirmingComplete ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Xác nhận đã nhận hàng
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Deposit reminder */}
        {order.payment_type === "deposit" && order.payment_status === "Đã cọc" && (
          <Card className="mb-4 border-amber-200">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-amber-800 font-medium">💰 Còn thiếu:</span>
                <span className="font-bold text-amber-600 text-lg">{Math.round(order.total_price / 2).toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="text-xs text-amber-700">
                <span className="font-medium">⏰ Deadline hoàn cọc: </span>
                {(() => {
                  const deadline = new Date(order.created_at);
                  deadline.setMonth(deadline.getMonth() + 1);
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (daysLeft < 0) return <span className="text-red-500 font-bold">Đã quá hạn!</span>;
                  if (daysLeft === 0) return <span className="text-red-500 font-bold">Hôm nay!</span>;
                  if (daysLeft <= 3) return <span className="text-orange-500 font-bold">{deadline.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} (còn {daysLeft} ngày)</span>;
                  return <span>{deadline.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} (còn {daysLeft} ngày)</span>;
                })()}
              </div>
              <p className="text-xs text-amber-600">Vui lòng thanh toán 50% còn lại trước deadline.</p>
            </CardContent>
          </Card>
        )}

        {/* Shipping info */}
        {order.shipping_provider && order.tracking_code && (
          <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-4 pb-4">
              <p className="font-medium flex items-center gap-1.5 text-sm mb-3"><Truck className="h-4 w-4" /> Vận chuyển</p>
              <div className="flex items-center gap-3">
                {provider && <img src={provider.logo} alt={provider.name} className="h-8 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{order.shipping_provider}</p>
                  <p className="font-mono text-blue-600 dark:text-blue-400">{order.tracking_code}</p>
                </div>
              </div>
              {trackingUrl && (
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-medium transition-colors">
                  <ExternalLink className="h-4 w-4" /> Tra cứu vận đơn
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🛒 Sản phẩm ({order.items?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items?.map((item: any, index: number) => {
              const imgSrc = getItemThumbnail(item);
              return (
                <div key={index} className="flex items-start gap-3">
                  {imgSrc ? (
                    <img src={imgSrc} alt={item.name} className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.selectedVariant && <p className="text-xs text-muted-foreground">{item.selectedVariant}</p>}
                    {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, val]) => (
                      <p key={key} className="text-xs text-muted-foreground">{key}: {val as string}</p>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0">
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString("vi-VN")}đ
                  </p>
                </div>
              );
            })}
            <Separator />
            {order.surcharge > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Phụ thu:</span>
                <span className="font-bold">+{order.surcharge.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-medium">Tổng cộng:</span>
              <span className="text-lg font-bold text-primary">{order.total_price.toLocaleString("vi-VN")}đ</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phương thức:</span>
              <span className="font-medium">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hình thức:</span>
              <span className="font-medium">{order.payment_type === "deposit" ? "Cọc 50%" : "Thanh toán đủ"}</span>
            </div>
            {order.payment_proof_url && (
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                <Upload className="h-3 w-3" /> Xem bill thanh toán
              </a>
            )}
            {order.second_payment_proof_url && (
              <a href={order.second_payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                <Upload className="h-3 w-3" /> Xem bill 2
              </a>
            )}
            {order.additional_bills?.length > 0 && (
              <div className="space-y-1">
                {order.additional_bills.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                    <Upload className="h-3 w-3" /> Bill bổ sung {i + 1}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery info */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Thông tin nhận hàng</CardTitle>
              {!editing && order.order_progress !== "Đã hoàn thành" && order.order_progress !== "Đã huỷ" && (
                <Button variant="ghost" size="sm" className="h-7" onClick={() => {
                  setEditing(true);
                  setTempDelivery({
                    delivery_name: order.delivery_name,
                    delivery_phone: order.delivery_phone,
                    delivery_address: order.delivery_address,
                    delivery_note: order.delivery_note,
                  });
                }}>
                  <Edit2 className="h-3 w-3 mr-1" /> Sửa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.delivery_name}</p>
                <p className="text-muted-foreground">{order.delivery_phone}</p>
                <p className="text-muted-foreground">{order.delivery_address}</p>
                {order.delivery_note && <p className="italic text-orange-600 mt-2">📝 {order.delivery_note}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Input placeholder="Tên người nhận" defaultValue={order.delivery_name} onChange={(e) => setTempDelivery({ ...tempDelivery, delivery_name: e.target.value })} />
                <Input placeholder="SĐT nhận hàng" defaultValue={order.delivery_phone} onChange={(e) => setTempDelivery({ ...tempDelivery, delivery_phone: e.target.value })} />
                <Textarea placeholder="Địa chỉ" defaultValue={order.delivery_address} onChange={(e) => setTempDelivery({ ...tempDelivery, delivery_address: e.target.value })} />
                <Textarea placeholder="Ghi chú" defaultValue={order.delivery_note} onChange={(e) => setTempDelivery({ ...tempDelivery, delivery_note: e.target.value })} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(false)}>Hủy</Button>
                  <Button size="sm" className="flex-1" onClick={handleUpdateDelivery} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Lưu
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status history */}
        {statusHistory.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <button onClick={() => setHistoryExpanded(!historyExpanded)} className="flex items-center justify-between w-full">
                <CardTitle className="text-base flex items-center gap-1.5"><History className="h-4 w-4" /> Lịch sử trạng thái ({statusHistory.length})</CardTitle>
                {historyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CardHeader>
            {historyExpanded && (
              <CardContent>
                <div className="space-y-3 border-l-2 border-primary/30 pl-3">
                  {statusHistory.map((h) => (
                    <div key={h.id} className="text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{h.field_changed === "payment_status" ? "Thanh toán" : "Tiến độ"}:</span>
                        <span className="text-muted-foreground">{h.old_value || "N/A"}</span>
                        <span>→</span>
                        <Badge variant="outline" className={`${getStatusColor(h.new_value)} text-[10px] px-1 py-0`}>{h.new_value}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{formatDate(h.changed_at)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Upload additional bill */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium text-sm">
                {order.payment_type === "deposit" && order.payment_status === "Đã cọc" ? "💳 Thanh toán 50% còn lại" : "📎 Đăng bill bổ sung"}
              </Label>
              <a href="/contact" className="text-xs text-primary hover:underline flex items-center gap-1">
                Xem thông tin CK <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUploadBill(e.target.files[0]); }} disabled={uploadingBill} />
            {uploadingBill && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang upload...</div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Cần hỗ trợ? Liên hệ Purin qua Messenger:</p>
            <Button className="w-full gap-2" onClick={() => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (isMobile) {
                const openApp = window.confirm("Mở bằng App Messenger?\n\nBấm OK để mở App, Cancel để mở trình duyệt.");
                if (openApp) {
                  window.open("fb-messenger://user-thread/105759462451542", "_blank");
                } else {
                  window.open("https://www.messenger.com/t/puorderin", "_blank");
                }
              } else {
                window.open("https://www.messenger.com/t/puorderin", "_blank");
              }
            }}>
              <Facebook className="w-4 h-4" />
              Nhắn tin xác nhận đơn #{orderCode}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
