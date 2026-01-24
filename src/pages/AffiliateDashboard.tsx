import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Users, Gift, TrendingUp, Copy, Search, DollarSign, Package, Clock, CheckCircle, XCircle, ExternalLink, Share2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
interface Affiliate {
  id: string;
  name: string;
  phone: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_orders: number;
  status: string;
  created_at: string;
}
interface AffiliateOrder {
  id: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
}
export default function AffiliateDashboard() {
  const [phone, setPhone] = useState("");
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const {
    products
  } = useCart();
  const searchAffiliate = async () => {
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    setIsLoading(true);
    setIsSearched(true);
    try {
      const {
        data: affiliateData,
        error: affiliateError
      } = await supabase.from('affiliates').select('*').eq('phone', phone.trim()).single();
      if (affiliateError || !affiliateData) {
        setAffiliate(null);
        toast.error("Không tìm thấy CTV với số điện thoại này");
        return;
      }
      setAffiliate(affiliateData);

      // Fetch affiliate orders
      const {
        data: ordersData
      } = await supabase.from('affiliate_orders').select('*').eq('affiliate_id', affiliateData.id).order('created_at', {
        ascending: false
      });
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error searching affiliate:', error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };
  const copyReferralLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Đã copy link giới thiệu!");
  };
  const copyProductLink = (productId: number) => {
    if (!affiliate) return;
    const link = `${window.location.origin}/product/${productId}?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Đã copy link sản phẩm có mã CTV!");
  };

  // Filter available products (not expired, in stock)
  const availableProducts = products.filter(p => {
    if (p.status === "Hết hàng") return false;
    if (p.orderDeadline) {
      const deadline = new Date(p.orderDeadline);
      if (deadline < new Date()) return false;
    }
    return true;
  });

  // Filter by search query
  const filteredProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.artist?.toLowerCase().includes(productSearch.toLowerCase())
  );
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Đã duyệt</Badge>;
      case 'pending':
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Tạm khóa</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Xác nhận</Badge>;
      case 'pending':
        return <Badge variant="secondary">Chờ xử lý</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500">Đã thanh toán</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  return <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard CTV</h1>
            <p className="text-muted-foreground">
              Kiểm tra trạng thái và theo dõi hoa hồng của bạn
            </p>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="phone" className="sr-only">Số điện thoại</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số điện thoại đã đăng ký" onKeyDown={e => e.key === 'Enter' && searchAffiliate()} />
                </div>
                <Button onClick={searchAffiliate} disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? "Đang tìm..." : "Tra cứu"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isSearched && !affiliate && !isLoading && <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-red-700">Không tìm thấy</h3>
                <p className="text-muted-foreground mt-2">
                  Số điện thoại chưa đăng ký làm CTV.{" "}
                  <a href="/affiliate-register" className="text-primary hover:underline">
                    Đăng ký ngay
                  </a>
                </p>
              </CardContent>
            </Card>}

          {affiliate && <>
              {/* Status card */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{affiliate.name}</h2>
                      <p className="text-muted-foreground">{affiliate.phone}</p>
                    </div>
                    {getStatusBadge(affiliate.status)}
                  </div>

                  {affiliate.status === 'pending' && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-700 text-sm">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Đơn đăng ký đang chờ admin duyệt. Bạn sẽ nhận thông báo khi được duyệt.
                      </p>
                    </div>}

                  {affiliate.status === 'approved' && <div className="bg-white p-4 rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã giới thiệu của bạn:</p>
                        <span className="text-2xl font-bold text-primary">{affiliate.referral_code}</span>
                      </div>
                      <Button variant="outline" onClick={copyReferralLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy link
                      </Button>
                    </div>}
                </CardContent>
              </Card>

              {/* Stats */}
              {affiliate.status === 'approved' && <>
                  <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{affiliate.total_orders}</p>
                        <p className="text-sm text-muted-foreground">Tổng đơn</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{formatPrice(affiliate.total_earnings)}</p>
                        <p className="text-sm text-muted-foreground">Tổng hoa hồng</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">{formatPrice(affiliate.pending_earnings)}</p>
                        <p className="text-sm text-muted-foreground">Chờ thanh toán</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{formatPrice(affiliate.paid_earnings)}</p>
                        <p className="text-sm text-muted-foreground">Đã nhận</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Commission rate */}
                  <Card className="mb-6 border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-primary" />
                          <span className="font-semibold">Tỷ lệ hoa hồng hiện tại:</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          {affiliate.commission_rate}% tiền công
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">* Hoa hồng được tính trên tiền công của sản phẩm</p>
                    </CardContent>
                  </Card>

                  {/* Share Products Section */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5" />
                            Chia sẻ sản phẩm
                          </CardTitle>
                          <CardDescription>
                            Copy link sản phẩm đã bao gồm mã CTV của bạn
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowProducts(!showProducts)}>
                          {showProducts ? "Ẩn" : "Xem sản phẩm"}
                        </Button>
                      </div>
                    </CardHeader>
                    {showProducts && <CardContent>
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Tìm sản phẩm..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                          {filteredProducts.slice(0, 12).map(product => <div key={product.id} className="relative group">
                              <div className="border rounded-lg p-2 bg-card hover:shadow-md transition-shadow">
                                <img src={product.images[0] || "/placeholder.svg"} alt={product.name} className="w-full h-24 object-cover rounded mb-2" />
                                <p className="text-xs font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.price.toLocaleString('vi-VN')}đ
                                  {product.cong ? ` (công: ${product.cong.toLocaleString('vi-VN')}đ)` : ''}
                                </p>
                                <Button size="sm" variant="secondary" className="w-full mt-2 h-7 text-xs" onClick={() => copyProductLink(product.id)}>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy link
                                </Button>
                              </div>
                            </div>)}
                        </div>
                        {filteredProducts.length > 12 && <p className="text-center text-sm text-muted-foreground mt-4">
                            Và {filteredProducts.length - 12} sản phẩm khác...{" "}
                            <a href="/products" target="_blank" className="text-primary hover:underline">
                              Xem tất cả
                            </a>
                          </p>}
                        {filteredProducts.length === 0 && <p className="text-center text-muted-foreground py-4">Không tìm thấy sản phẩm</p>}
                      </CardContent>}
                  </Card>

                  {/* Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Lịch sử đơn hàng giới thiệu</CardTitle>
                      <CardDescription>
                        Các đơn hàng được giới thiệu bởi bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {orders.length === 0 ? <p className="text-center text-muted-foreground py-8">
                          Chưa có đơn hàng nào. Hãy chia sẻ link giới thiệu để bắt đầu nhận hoa hồng!
                        </p> : <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Mã đơn</TableHead>
                              <TableHead>Giá trị</TableHead>
                              <TableHead>Hoa hồng</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead>Ngày</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map(order => <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.order_number}</TableCell>
                                <TableCell>{formatPrice(order.order_total)}</TableCell>
                                <TableCell className="text-green-600 font-medium">
                                  +{formatPrice(order.commission_amount)}
                                </TableCell>
                                <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                                <TableCell>
                                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>}
                    </CardContent>
                  </Card>
                </>}
            </>}

          {/* Register CTA */}
          {!affiliate && isSearched && <div className="mt-8 text-center">
              <Button onClick={() => window.location.href = '/affiliate-register'}>
                <Users className="h-4 w-4 mr-2" />
                Đăng ký làm CTV
              </Button>
            </div>}
        </div>
      </div>
    </Layout>;
}