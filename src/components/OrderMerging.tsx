import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Merge, Package, User, MapPin, Phone, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  shipping_provider: string;
  tracking_code: string;
  surcharge: number;
}

interface OrderMergingProps {
  orders: Order[];
  onMergeComplete: () => void;
}

interface CustomerGroup {
  phone: string;
  name: string;
  address: string;
  orders: Order[];
}

export function OrderMerging({ orders, onMergeComplete }: OrderMergingProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const { toast } = useToast();

  // Group orders by customer (same phone + same address) that are "Sẵn sàng giao"
  const customerGroups = useMemo(() => {
    const readyOrders = orders.filter(order => order.order_progress === "Sẵn sàng giao");
    
    const groups: { [key: string]: CustomerGroup } = {};
    
    readyOrders.forEach(order => {
      // Create a key from phone + normalized address
      const key = `${order.delivery_phone}_${order.delivery_address.toLowerCase().trim()}`;
      
      if (!groups[key]) {
        groups[key] = {
          phone: order.delivery_phone,
          name: order.delivery_name,
          address: order.delivery_address,
          orders: []
        };
      }
      groups[key].orders.push(order);
    });

    // Only return groups with more than 1 order (can be merged)
    return Object.values(groups).filter(group => group.orders.length > 1);
  }, [orders]);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const selectAllInGroup = (group: CustomerGroup) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      const allSelected = group.orders.every(o => prev.has(o.id));
      
      if (allSelected) {
        // Deselect all
        group.orders.forEach(o => newSet.delete(o.id));
      } else {
        // Select all
        group.orders.forEach(o => newSet.add(o.id));
      }
      return newSet;
    });
  };

  const getSelectedOrdersDetails = () => {
    const selectedOrdersList = orders.filter(o => selectedOrders.has(o.id));
    
    // Get unique customers in selected orders
    const customers = new Map<string, { name: string; phone: string; address: string }>();
    selectedOrdersList.forEach(o => {
      const key = `${o.delivery_phone}_${o.delivery_address}`;
      if (!customers.has(key)) {
        customers.set(key, {
          name: o.delivery_name,
          phone: o.delivery_phone,
          address: o.delivery_address
        });
      }
    });

    return {
      orders: selectedOrdersList,
      totalItems: selectedOrdersList.reduce((sum, o) => sum + o.items.length, 0),
      totalPrice: selectedOrdersList.reduce((sum, o) => sum + o.total_price, 0),
      customers: Array.from(customers.values()),
      isSameCustomer: customers.size === 1
    };
  };

  const handleMerge = async () => {
    const details = getSelectedOrdersDetails();
    
    if (details.orders.length < 2) {
      toast({
        title: "Lỗi",
        description: "Cần chọn ít nhất 2 đơn hàng để gộp",
        variant: "destructive"
      });
      return;
    }

    if (!details.isSameCustomer) {
      toast({
        title: "Lỗi", 
        description: "Chỉ có thể gộp đơn hàng cùng một khách hàng (SĐT + địa chỉ giống nhau)",
        variant: "destructive"
      });
      return;
    }

    setMerging(true);
    try {
      // Sort by created_at to get the main order (earliest)
      const sortedOrders = [...details.orders].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const mainOrder = sortedOrders[0];
      const ordersToMerge = sortedOrders.slice(1);

      // Combine all items
      const allItems = sortedOrders.flatMap(order => 
        order.items.map((item: any) => ({
          ...item,
          mergedFrom: order.order_number // Track which order this came from
        }))
      );

      // Calculate total price
      const totalPrice = sortedOrders.reduce((sum, o) => sum + o.total_price, 0);

      // Update main order with merged items
      const mergedOrderNumbers = sortedOrders.map(o => o.order_number).join(' + ');
      const newDeliveryNote = [
        mainOrder.delivery_note,
        `[GỘP ĐƠN: ${mergedOrderNumbers}]`,
        ...ordersToMerge.map(o => o.delivery_note).filter(Boolean)
      ].filter(Boolean).join(' | ');

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          items: allItems,
          total_price: totalPrice,
          delivery_note: newDeliveryNote
        })
        .eq('id', mainOrder.id);

      if (updateError) throw updateError;

      // Mark merged orders as cancelled with note
      for (const order of ordersToMerge) {
        const { error: cancelError } = await supabase
          .from('orders')
          .update({
            order_progress: 'Đã huỷ',
            delivery_note: `[ĐÃ GỘP VÀO ĐƠN ${mainOrder.order_number}] ${order.delivery_note || ''}`
          })
          .eq('id', order.id);

        if (cancelError) throw cancelError;
      }

      toast({
        title: "Gộp đơn thành công!",
        description: `${ordersToMerge.length + 1} đơn đã được gộp vào ${mainOrder.order_number}`,
      });

      setSelectedOrders(new Set());
      setShowMergeDialog(false);
      onMergeComplete();
    } catch (error) {
      console.error('Error merging orders:', error);
      toast({
        title: "Lỗi",
        description: "Không thể gộp đơn hàng",
        variant: "destructive"
      });
    } finally {
      setMerging(false);
    }
  };

  const selectedDetails = getSelectedOrdersDetails();

  if (customerGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Gộp đơn ship chung
          </CardTitle>
          <CardDescription>
            Gộp các đơn hàng cùng khách hàng đang ở trạng thái "Sẵn sàng giao"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Không có đơn hàng nào có thể gộp</p>
            <p className="text-sm mt-2">
              Cần có ít nhất 2 đơn "Sẵn sàng giao" từ cùng một khách hàng
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Merge className="h-5 w-5" />
                Gộp đơn ship chung
              </CardTitle>
              <CardDescription>
                Gộp các đơn hàng cùng khách hàng đang ở trạng thái "Sẵn sàng giao"
              </CardDescription>
            </div>
            {selectedOrders.size >= 2 && selectedDetails.isSameCustomer && (
              <Button onClick={() => setShowMergeDialog(true)}>
                <Merge className="h-4 w-4 mr-2" />
                Gộp {selectedOrders.size} đơn
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {customerGroups.map((group, index) => {
            const allSelected = group.orders.every(o => selectedOrders.has(o.id));
            const someSelected = group.orders.some(o => selectedOrders.has(o.id));
            
            return (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                {/* Customer info header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => selectAllInGroup(group)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <User className="h-4 w-4" />
                          {group.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {group.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {group.address}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {group.orders.length} đơn có thể gộp
                  </Badge>
                </div>

                <Separator />

                {/* Orders list */}
                <div className="grid gap-3">
                  {group.orders.map(order => (
                    <div
                      key={order.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        selectedOrders.has(order.id) 
                          ? "bg-primary/5 border-primary" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium">#{order.order_number}</span>
                          <Badge variant="secondary" className="text-xs">
                            {order.payment_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {order.items.map((item: any, i: number) => (
                            <span key={i}>
                              {i > 0 && ", "}
                              x{item.quantity} {item.name}
                              {item.selectedVariant && ` (${item.selectedVariant})`}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {order.total_price.toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Merge confirmation dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gộp đơn</DialogTitle>
            <DialogDescription>
              Bạn đang gộp {selectedDetails.orders.length} đơn hàng
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Số đơn gộp:</span>
                <span className="font-medium">{selectedDetails.orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng sản phẩm:</span>
                <span className="font-medium">{selectedDetails.totalItems}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span>Tổng tiền:</span>
                <span className="font-bold text-primary">
                  {selectedDetails.totalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Đơn sớm nhất sẽ là đơn chính</p>
              <p>• Các đơn khác sẽ được đánh dấu "Đã huỷ"</p>
              <p>• Tất cả sản phẩm sẽ được gộp vào đơn chính</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Đơn hàng sẽ gộp:</p>
              <div className="text-sm space-y-1">
                {selectedDetails.orders.map((order, i) => (
                  <div key={order.id} className="flex items-center gap-2">
                    {i === 0 ? (
                      <Badge variant="default" className="text-xs">Đơn chính</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Gộp vào</Badge>
                    )}
                    <span className="font-mono">#{order.order_number}</span>
                    <span className="text-muted-foreground">
                      ({order.total_price.toLocaleString('vi-VN')}đ)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergeDialog(false)} disabled={merging}>
              Hủy
            </Button>
            <Button onClick={handleMerge} disabled={merging}>
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gộp...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Xác nhận gộp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
