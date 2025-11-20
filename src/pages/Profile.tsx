import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Package, LogOut, Upload, Truck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
}

interface Order {
  id: string;
  order_code: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  payment_type: string | null;
  deposit_amount: number | null;
  deposit_refund_deadline: string | null;
  payment_proof_url: string | null;
  tracking_number: string | null;
  items: OrderItem[];
}

interface OrderItem {
  product_name: string;
  product_variant: string | null;
  quantity: number;
  price: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    facebook_link: "",
    instagram_link: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadProfile(user.id);
    await loadOrders(user.id);
  };

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log("Profile not found, creating new profile...");
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || "",
              });
            
            if (insertError) {
              console.error("Error creating profile:", insertError);
              throw insertError;
            }
            
            console.log("Profile created successfully, reloading...");
            // Reload after creating
            await loadProfile(userId);
            return;
          }
        }
        throw error;
      }

      if (data) {
        console.log("Profile loaded successfully:", data);
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          facebook_link: data.facebook_link || "",
          instagram_link: data.instagram_link || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Lỗi tải thông tin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (userId: string) => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

          return { ...order, items: items || [] };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setSaving(true);

    try {
      console.log("Updating profile with data:", formData);
      
      const { data, error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      console.log("Profile updated successfully:", data);

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin của bạn đã được cập nhật.",
      });

      await loadProfile(user.id);

      // Sync profile to Google Sheets in background (fire-and-forget)
      supabase.functions.invoke('sync-profile-to-sheets', {
        body: { userId: user.id }
      }).catch(err => console.error('Background sync failed:', err));
    } catch (error: any) {
      console.error("Update profile failed:", error);
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật thông tin. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleUploadPaymentProof = async (orderId: string, file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${orderId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_proof_url: publicUrl })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast({
        title: "Tải lên thành công!",
        description: "Bill chuyển khoản đã được gửi.",
      });

      await loadOrders(user.id);
    } catch (error: any) {
      toast({
        title: "Lỗi tải lên",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getOrderProgress = (status: string) => {
    const statusMap: { [key: string]: { label: string; progress: number } } = {
      unpaid: { label: "Chưa thanh toán", progress: 20 },
      paid: { label: "Đã thanh toán", progress: 40 },
      processing: { label: "Đang xử lý", progress: 60 },
      shipping: { label: "Đang giao hàng", progress: 80 },
      completed: { label: "Hoàn thành", progress: 100 },
      cancelled: { label: "Đã hủy", progress: 0 },
    };
    return statusMap[status] || { label: status, progress: 0 };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tài khoản của tôi</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Quản lý đơn hàng
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="mr-2 h-4 w-4" />
              Đơn hàng ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Họ tên</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_link">Link Facebook</Label>
                    <Input
                      id="facebook_link"
                      type="url"
                      value={formData.facebook_link}
                      onChange={(e) =>
                        setFormData({ ...formData, facebook_link: e.target.value })
                      }
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_link">Link Instagram</Label>
                    <Input
                      id="instagram_link"
                      type="url"
                      value={formData.instagram_link}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram_link: e.target.value })
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cập nhật
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Bạn chưa có đơn hàng nào
                    </p>
                    <Button
                      variant="link"
                      onClick={() => navigate("/products")}
                      className="mt-4"
                    >
                      Mua sắm ngay
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => {
                  const orderProgress = getOrderProgress(order.status);
                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <CardTitle className="text-lg">
                              Đơn hàng {order.order_code || `#${order.id.slice(0, 8)}`}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(order.created_at).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{orderProgress.label}</span>
                            <span className="text-sm text-muted-foreground">{orderProgress.progress}%</span>
                          </div>
                          <Progress value={orderProgress.progress} className="h-2" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 border-b last:border-0"
                            >
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                {item.product_variant && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.product_variant}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {item.price.toLocaleString("vi-VN")}đ
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  x{item.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Deposit Info */}
                        {order.payment_type === "deposit" && order.deposit_refund_deadline && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                            <p className="font-semibold text-amber-800">Đặt cọc 50%</p>
                            <p className="text-amber-700">
                              Hạn hoàn cọc: {new Date(order.deposit_refund_deadline).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <p className="font-semibold">Tổng cộng:</p>
                          <p className="text-xl font-bold text-primary">
                            {order.total_amount.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        
                        {/* Upload Payment Proof */}
                        {order.status === "unpaid" && !order.payment_proof_url && (
                          <div className="mt-4 pt-4 border-t">
                            <Label htmlFor={`upload-${order.id}`} className="cursor-pointer">
                              <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                                <Upload className="h-5 w-5" />
                                <span>Tải lên bill chuyển khoản</span>
                              </div>
                              <input
                                id={`upload-${order.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadPaymentProof(order.id, file);
                                }}
                              />
                            </Label>
                          </div>
                        )}
                        
                        {/* Show Payment Proof */}
                        {order.payment_proof_url && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Bill chuyển khoản:</p>
                            <a 
                              href={order.payment_proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              Xem bill đã tải lên
                            </a>
                          </div>
                        )}
                        
                        {/* Tracking Number */}
                        {(order.status === "shipping" || order.status === "completed") && order.tracking_number && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                              <Truck className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-semibold text-blue-800">Mã vận đơn</p>
                                <p className="text-sm text-blue-700">{order.tracking_number}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
