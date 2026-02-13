 import { useState, useEffect, useMemo } from "react";
 import { useParams, useNavigate, Link } from "react-router-dom";
 import { Layout } from "@/components/Layout";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2, ArrowLeft, ExternalLink, Copy, Save, Package, Phone, Mail, MapPin, Clock, History, FileText, CreditCard, Truck, User } from "lucide-react";
 import { SHIPPING_PROVIDERS, findProviderByName, getTrackingUrlFromProvider } from "@/data/shippingProviders";
 import { Textarea } from "@/components/ui/textarea";
 
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
     case "Chưa thanh toán": return "bg-red-100 text-red-800 border-red-200";
     case "Đang xác nhận thanh toán": return "bg-blue-50 text-blue-700 border-blue-200";
     case "Đang xác nhận cọc": return "bg-blue-50 text-blue-700 border-blue-200";
     case "Đã thanh toán": return "bg-green-100 text-green-800 border-green-200";
     case "Đã cọc": return "bg-amber-100 text-amber-800 border-amber-200";
     case "Đã hoàn cọc": return "bg-pink-100 text-pink-800 border-pink-200";
     default: return "bg-gray-100 text-gray-800 border-gray-200";
   }
 };
 
 const getProgressColor = (progress: string) => {
   switch (progress) {
     case "Đang xử lý": return "bg-cyan-100 text-cyan-800 border-cyan-200";
     case "Đã đặt hàng": return "bg-blue-100 text-blue-800 border-blue-200";
     case "Đang sản xuất": return "bg-purple-100 text-purple-800 border-purple-200";
     case "Đang vận chuyển T-V": return "bg-yellow-100 text-yellow-800 border-yellow-200";
     case "Sẵn sàng giao": return "bg-lime-100 text-lime-800 border-lime-200";
     case "Đang giao": return "bg-orange-100 text-orange-800 border-orange-200";
     case "Đã hoàn thành": return "bg-emerald-100 text-emerald-800 border-emerald-200";
     case "Đã huỷ": return "bg-gray-100 text-gray-800 border-gray-200";
     default: return "bg-gray-100 text-gray-800 border-gray-200";
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
 
 interface StatusHistory {
   id: string;
   field_changed: string;
   old_value: string | null;
   new_value: string;
   changed_at: string;
   changed_by: string;
 }
 
 export default function AdminOrderDetail() {
   const { orderId } = useParams<{ orderId: string }>();
   const navigate = useNavigate();
   const { toast } = useToast();
   
   const [order, setOrder] = useState<Order | null>(null);
   const [relatedOrders, setRelatedOrders] = useState<Order[]>([]);
   const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   
   // Editable fields
   const [paymentStatus, setPaymentStatus] = useState("");
   const [orderProgress, setOrderProgress] = useState("");
   const [shippingProvider, setShippingProvider] = useState("");
   const [trackingCode, setTrackingCode] = useState("");
   const [surcharge, setSurcharge] = useState("");
   const [deliveryNote, setDeliveryNote] = useState("");
   
   // Check admin login
   useEffect(() => {
     const adminSession = sessionStorage.getItem('admin_logged_in');
     if (adminSession !== 'true') {
       navigate('/admin');
     }
   }, [navigate]);
   
   // Fetch order details
   useEffect(() => {
     const fetchOrderDetails = async () => {
       if (!orderId) return;
       
       setIsLoading(true);
       try {
         // Fetch main order
         const { data: orderData, error: orderError } = await supabase
           .from('orders')
           .select('*')
           .eq('id', orderId)
           .single();
         
         if (orderError) throw orderError;
         
         const orderTyped = orderData as Order;
         setOrder(orderTyped);
         setPaymentStatus(orderTyped.payment_status || "");
         setOrderProgress(orderTyped.order_progress || "");
         setShippingProvider(orderTyped.shipping_provider || "");
         setTrackingCode(orderTyped.tracking_code || "");
         setSurcharge(orderTyped.surcharge?.toString() || "0");
         setDeliveryNote(orderTyped.delivery_note || "");
         
         // Fetch status history
         const { data: historyData } = await supabase
           .from('order_status_history')
           .select('*')
           .eq('order_id', orderId)
           .order('changed_at', { ascending: false });
         
         setStatusHistory((historyData as StatusHistory[]) || []);
         
         // Fetch related orders (same customer phone or address)
         const { data: relatedData } = await supabase
           .from('orders')
           .select('*')
           .neq('id', orderId)
           .is('deleted_at', null)
           .or(`customer_phone.eq.${orderTyped.customer_phone},delivery_phone.eq.${orderTyped.delivery_phone}`)
           .order('created_at', { ascending: false })
           .limit(10);
         
         setRelatedOrders((relatedData as Order[]) || []);
         
       } catch (error) {
         console.error('Error fetching order:', error);
         toast({
           title: "Lỗi",
           description: "Không thể tải thông tin đơn hàng",
           variant: "destructive"
         });
       } finally {
         setIsLoading(false);
       }
     };
     
     fetchOrderDetails();
   }, [orderId, toast]);
   
   const handleSave = async () => {
     if (!order) return;
     
     setIsSaving(true);
     try {
       const updates: any = {
         payment_status: paymentStatus,
         order_progress: orderProgress,
         shipping_provider: shippingProvider,
         tracking_code: trackingCode,
         surcharge: parseInt(surcharge) || 0,
         delivery_note: deliveryNote
       };
       
       // Track status changes
       const historyInserts: any[] = [];
       
       if (paymentStatus !== order.payment_status) {
         historyInserts.push({
           order_id: order.id,
           field_changed: 'payment_status',
           old_value: order.payment_status,
           new_value: paymentStatus,
           changed_by: 'admin'
         });
       }
       
       if (orderProgress !== order.order_progress) {
         historyInserts.push({
           order_id: order.id,
           field_changed: 'order_progress',
           old_value: order.order_progress,
           new_value: orderProgress,
           changed_by: 'admin'
         });
       }
       
       // Update order
       const { error: updateError } = await supabase
         .from('orders')
         .update(updates)
         .eq('id', order.id);
       
       if (updateError) throw updateError;
       
       // Insert status history
       if (historyInserts.length > 0) {
         await supabase.from('order_status_history').insert(historyInserts);
         
         // Refresh history
         const { data: newHistory } = await supabase
           .from('order_status_history')
           .select('*')
           .eq('order_id', order.id)
           .order('changed_at', { ascending: false });
         
         setStatusHistory((newHistory as StatusHistory[]) || []);
       }
       
       // Update local state
       setOrder({
         ...order,
         ...updates
       });
       
       toast({
         title: "Đã lưu",
         description: "Cập nhật đơn hàng thành công"
       });
       
     } catch (error) {
       console.error('Error saving order:', error);
       toast({
         title: "Lỗi",
         description: "Không thể cập nhật đơn hàng",
         variant: "destructive"
       });
     } finally {
       setIsSaving(false);
     }
   };
   
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast({ title: "Đã copy", description: text });
   };
   
   const formatDate = (dateStr: string) => {
     return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
   };
   
   const getTrackingUrl = (provider: string, code: string) => {
     return getTrackingUrlFromProvider(provider, code);
   };
   
   if (isLoading) {
     return (
       <Layout>
         <div className="container mx-auto px-4 py-12 flex justify-center">
           <Loader2 className="h-8 w-8 animate-spin" />
         </div>
       </Layout>
     );
   }
   
   if (!order) {
     return (
       <Layout>
         <div className="container mx-auto px-4 py-12 text-center">
           <p className="text-muted-foreground">Không tìm thấy đơn hàng</p>
           <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
             <ArrowLeft className="mr-2 h-4 w-4" />
             Quay lại
           </Button>
         </div>
       </Layout>
     );
   }
   
   return (
     <Layout>
       <div className="container mx-auto px-4 py-8">
         {/* Header */}
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
               <ArrowLeft className="h-4 w-4" />
             </Button>
             <div>
               <h1 className="text-2xl font-bold flex items-center gap-2">
                 Đơn hàng #{order.order_number || order.id.slice(0, 8)}
                 <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.order_number || order.id)}>
                   <Copy className="h-4 w-4" />
                 </Button>
               </h1>
               <p className="text-sm text-muted-foreground">
                 Tạo lúc: {formatDate(order.created_at)}
               </p>
             </div>
           </div>
           <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Lưu thay đổi
           </Button>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Main content - Left 2 columns */}
           <div className="lg:col-span-2 space-y-6">
             {/* Order Status */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Package className="h-5 w-5" />
                   Trạng thái đơn hàng
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label>Thanh toán</Label>
                     <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                       <SelectTrigger className="mt-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {PAYMENT_STATUSES.map(status => (
                           <SelectItem key={status} value={status}>{status}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label>Tiến độ</Label>
                     <Select value={orderProgress} onValueChange={setOrderProgress}>
                       <SelectTrigger className="mt-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {ORDER_PROGRESS.map(progress => (
                           <SelectItem key={progress} value={progress}>{progress}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 
                 <Separator />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label>Đơn vị vận chuyển</Label>
                     <Select value={shippingProvider} onValueChange={setShippingProvider}>
                       <SelectTrigger className="mt-1">
                         <SelectValue placeholder="Chọn đơn vị..." />
                       </SelectTrigger>
                       <SelectContent>
                         {SHIPPING_PROVIDERS.map(provider => (
                           <SelectItem key={provider.name} value={provider.name}>
                             {provider.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label>Mã vận đơn</Label>
                     <Input 
                       className="mt-1"
                       value={trackingCode}
                       onChange={(e) => setTrackingCode(e.target.value)}
                       placeholder="Nhập mã vận đơn..."
                     />
                   </div>
                 </div>
                 
                 {shippingProvider && trackingCode && (
                   <div>
                     <a
                       href={getTrackingUrl(shippingProvider, trackingCode) || '#'}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-sm text-primary hover:underline flex items-center gap-1"
                     >
                       <ExternalLink className="h-3 w-3" />
                       Tra cứu vận đơn
                     </a>
                   </div>
                 )}
                 
                 <div>
                   <Label>Phụ thu (đ)</Label>
                   <Input
                     className="mt-1"
                     type="number"
                     value={surcharge}
                     onChange={(e) => setSurcharge(e.target.value)}
                   />
                 </div>
               </CardContent>
             </Card>
             
             {/* Order Items */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <FileText className="h-5 w-5" />
                   Sản phẩm ({order.items.length})
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {order.items.map((item: any, idx: number) => (
                     <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                       {item.image && (
                         <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                       )}
                       <div className="flex-1 min-w-0">
                         <p className="font-medium truncate">{item.name}</p>
                         {item.selectedVariant && (
                           <p className="text-sm text-muted-foreground">Phân loại: {item.selectedVariant}</p>
                         )}
                         {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                           <p className="text-sm text-muted-foreground">
                             {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                           </p>
                         )}
                         <p className="text-sm">
                           <span className="text-primary font-medium">{item.price?.toLocaleString('vi-VN')}đ</span>
                           <span className="text-muted-foreground"> x {item.quantity}</span>
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 <Separator className="my-4" />
                 
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span>Tổng tiền</span>
                     <span className="font-bold text-lg text-primary">
                       {order.total_price.toLocaleString('vi-VN')}đ
                     </span>
                   </div>
                   {parseInt(surcharge) > 0 && (
                     <div className="flex justify-between text-orange-600">
                       <span>Phụ thu</span>
                       <span>+{parseInt(surcharge).toLocaleString('vi-VN')}đ</span>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
             
             {/* Payment Proof */}
             {(order.payment_proof_url || order.second_payment_proof_url) && (
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <CreditCard className="h-5 w-5" />
                     Bằng chứng thanh toán
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex gap-4 flex-wrap">
                     {order.payment_proof_url && (
                       <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                         <img src={order.payment_proof_url} alt="Payment proof" className="w-40 h-auto rounded border hover:opacity-80 transition" />
                       </a>
                     )}
                     {order.second_payment_proof_url && (
                       <a href={order.second_payment_proof_url} target="_blank" rel="noopener noreferrer">
                         <img src={order.second_payment_proof_url} alt="Second payment proof" className="w-40 h-auto rounded border hover:opacity-80 transition" />
                       </a>
                     )}
                   </div>
                 </CardContent>
               </Card>
             )}
             
             {/* Status History */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <History className="h-5 w-5" />
                   Lịch sử thay đổi trạng thái
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {statusHistory.length === 0 ? (
                   <p className="text-sm text-muted-foreground">Chưa có thay đổi trạng thái nào được ghi lại</p>
                 ) : (
                   <div className="space-y-3">
                     {statusHistory.map((history) => (
                       <div key={history.id} className="flex items-start gap-3 text-sm">
                         <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                         <div className="flex-1">
                           <p>
                             <span className="font-medium">
                               {history.field_changed === 'payment_status' ? 'Thanh toán' : 'Tiến độ'}
                             </span>
                             : <span className="text-muted-foreground">{history.old_value || 'N/A'}</span>
                             {' → '}
                             <span className="font-medium">{history.new_value}</span>
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {formatDate(history.changed_at)} • {history.changed_by}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
           
           {/* Sidebar - Right column */}
           <div className="space-y-6">
             {/* Customer Info */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <User className="h-5 w-5" />
                   Thông tin khách hàng
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 text-sm">
                 <div className="flex items-start gap-2">
                   <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                   <span>{order.delivery_name}</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                   <a href={`tel:${order.delivery_phone}`} className="text-primary hover:underline">
                     {order.delivery_phone}
                   </a>
                 </div>
                 {order.customer_email && (
                   <div className="flex items-start gap-2">
                     <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                     <a href={`mailto:${order.customer_email}`} className="text-primary hover:underline truncate">
                       {order.customer_email}
                     </a>
                   </div>
                 )}
                 <div className="flex items-start gap-2">
                   <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                   <span>{order.delivery_address}</span>
                 </div>
                 
                 <Separator />
                 
                 <div>
                   <Label className="text-xs text-muted-foreground">Ghi chú giao hàng</Label>
                   <Textarea
                     className="mt-1 text-sm"
                     value={deliveryNote}
                     onChange={(e) => setDeliveryNote(e.target.value)}
                     placeholder="Ghi chú..."
                     rows={3}
                   />
                 </div>
               </CardContent>
             </Card>
             
             {/* Payment Info */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <CreditCard className="h-5 w-5" />
                   Thông tin thanh toán
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Phương thức:</span>
                   <span>{order.payment_method}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Hình thức:</span>
                   <span>{order.payment_type === 'deposit' ? 'Cọc 50%' : 'Thanh toán đủ'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Trạng thái:</span>
                   <Badge variant="outline" className={`${getPaymentStatusColor(order.payment_status)} text-xs`}>
                     {order.payment_status}
                   </Badge>
                 </div>
               </CardContent>
             </Card>
             
             {/* Related Orders */}
             {relatedOrders.length > 0 && (
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <Truck className="h-5 w-5" />
                     Đơn hàng liên quan ({relatedOrders.length})
                   </CardTitle>
                   <CardDescription>Các đơn khác từ cùng khách hàng</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2">
                     {relatedOrders.map((related) => (
                       <Link
                         key={related.id}
                         to={`/admin/order/${related.id}`}
                         className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition"
                       >
                         <div className="flex justify-between items-start">
                           <div>
                             <p className="font-medium text-sm">
                               #{related.order_number || related.id.slice(0, 8)}
                             </p>
                             <p className="text-xs text-muted-foreground">
                               {new Date(related.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                             </p>
                           </div>
                           <div className="text-right">
                             <Badge variant="outline" className={`${getProgressColor(related.order_progress)} text-xs mb-1`}>
                               {related.order_progress}
                             </Badge>
                             <p className="text-xs font-medium text-primary">
                               {related.total_price.toLocaleString('vi-VN')}đ
                             </p>
                           </div>
                         </div>
                       </Link>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             )}
           </div>
         </div>
       </div>
     </Layout>
   );
 }