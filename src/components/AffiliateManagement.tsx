import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Check, X, Edit, Eye, DollarSign, 
  RefreshCw, ExternalLink, Search, Calculator 
} from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  social_link: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_orders: number;
  bank_name: string | null;
  bank_account: string | null;
  account_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface AffiliateOrder {
  id: string;
  affiliate_id: string;
  order_id: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export default function AffiliateManagement() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliateOrders, setAffiliateOrders] = useState<AffiliateOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    commission_rate: 5,
    status: "pending",
    admin_note: "",
  });
  const [isUpdatingCommissions, setIsUpdatingCommissions] = useState(false);

  const fetchAffiliates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error("Lỗi tải danh sách CTV");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAffiliateOrders = async (affiliateId: string) => {
    try {
      const { data, error } = await supabase
        .from('affiliate_orders')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliateOrders(data || []);
    } catch (error) {
      console.error('Error fetching affiliate orders:', error);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleApprove = async (affiliate: Affiliate) => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'approved' })
        .eq('id', affiliate.id);

      if (error) throw error;
      toast.success(`Đã duyệt CTV ${affiliate.name}`);
      fetchAffiliates();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      toast.error("Lỗi duyệt CTV");
    }
  };

  const handleReject = async (affiliate: Affiliate) => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'rejected' })
        .eq('id', affiliate.id);

      if (error) throw error;
      toast.success(`Đã từ chối CTV ${affiliate.name}`);
      fetchAffiliates();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      toast.error("Lỗi từ chối CTV");
    }
  };

  const handleViewDetail = async (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    await fetchAffiliateOrders(affiliate.id);
    setShowDetailDialog(true);
  };

  const handleEdit = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setEditData({
      commission_rate: affiliate.commission_rate,
      status: affiliate.status,
      admin_note: affiliate.admin_note || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAffiliate) return;

    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          commission_rate: editData.commission_rate,
          status: editData.status,
          admin_note: editData.admin_note || null,
        })
        .eq('id', selectedAffiliate.id);

      if (error) throw error;
      toast.success("Đã cập nhật thông tin CTV");
      setShowEditDialog(false);
      fetchAffiliates();
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast.error("Lỗi cập nhật CTV");
    }
  };

  const handlePayCommission = async (affiliateId: string) => {
    try {
      // Mark pending orders as paid
      const { error: ordersError } = await supabase
        .from('affiliate_orders')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('affiliate_id', affiliateId)
        .eq('status', 'confirmed');

      if (ordersError) throw ordersError;

      // Update affiliate earnings
      const affiliate = affiliates.find(a => a.id === affiliateId);
      if (affiliate) {
        const { error: affiliateError } = await supabase
          .from('affiliates')
          .update({
            paid_earnings: affiliate.paid_earnings + affiliate.pending_earnings,
            pending_earnings: 0,
          })
          .eq('id', affiliateId);

        if (affiliateError) throw affiliateError;
      }

      toast.success("Đã đánh dấu thanh toán hoa hồng");
      fetchAffiliates();
    } catch (error) {
      console.error('Error paying commission:', error);
      toast.error("Lỗi thanh toán hoa hồng");
    }
  };

  const handleUpdateAllCommissions = async () => {
    setIsUpdatingCommissions(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-affiliate-commission`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        if (result.updates && result.updates.length > 0) {
          toast.success(`Đã cập nhật ${result.updates.length} CTV`, {
            description: result.updates.map((u: { name: string; oldRate: number; newRate: number; orderCount: number }) => 
              `${u.name}: ${u.oldRate}% → ${u.newRate}% (${u.orderCount} đơn)`
            ).join(', ')
          });
        } else {
          toast.info("Không có CTV nào cần cập nhật tỷ lệ hoa hồng");
        }
        fetchAffiliates();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating commissions:', error);
      toast.error("Lỗi cập nhật tỷ lệ hoa hồng");
    } finally {
      setIsUpdatingCommissions(false);
    }
  };

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

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.phone.includes(searchTerm) ||
      affiliate.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = affiliates.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quản lý CTV
                {pendingCount > 0 && (
                  <Badge variant="destructive">{pendingCount} chờ duyệt</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Duyệt đơn đăng ký và quản lý hoa hồng cộng tác viên
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleUpdateAllCommissions} disabled={isUpdatingCommissions}>
                <Calculator className={`h-4 w-4 mr-2 ${isUpdatingCommissions ? 'animate-spin' : ''}`} />
                Cập nhật % hoa hồng
              </Button>
              <Button variant="outline" onClick={fetchAffiliates} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, SĐT, mã..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="suspended">Tạm khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CTV</TableHead>
                  <TableHead>Mã giới thiệu</TableHead>
                  <TableHead>Đơn</TableHead>
                  <TableHead>Hoa hồng</TableHead>
                  <TableHead>Chờ TT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoading ? "Đang tải..." : "Chưa có CTV nào"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAffiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <p className="text-sm text-muted-foreground">{affiliate.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {affiliate.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>{affiliate.total_orders}</TableCell>
                      <TableCell className="text-green-600">
                        {formatPrice(affiliate.total_earnings)}
                      </TableCell>
                      <TableCell className="text-yellow-600">
                        {formatPrice(affiliate.pending_earnings)}
                      </TableCell>
                      <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {affiliate.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600"
                                onClick={() => handleApprove(affiliate)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleReject(affiliate)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetail(affiliate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(affiliate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {affiliate.pending_earnings > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-blue-600"
                              onClick={() => handlePayCommission(affiliate.id)}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết CTV: {selectedAffiliate?.name}</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SĐT</p>
                  <p className="font-medium">{selectedAffiliate.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedAffiliate.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mạng xã hội</p>
                  <a 
                    href={selectedAffiliate.social_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Xem <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ lệ hoa hồng</p>
                  <p className="font-medium">{selectedAffiliate.commission_rate}%</p>
                </div>
              </div>

              {(selectedAffiliate.bank_name || selectedAffiliate.bank_account) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Thông tin ngân hàng</p>
                  <p>{selectedAffiliate.bank_name} - {selectedAffiliate.bank_account}</p>
                  <p className="text-sm">{selectedAffiliate.account_name}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Lịch sử đơn hàng giới thiệu</p>
                {affiliateOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Chưa có đơn hàng</p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Giá trị</TableHead>
                          <TableHead>Hoa hồng</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affiliateOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.order_number}</TableCell>
                            <TableCell>{formatPrice(order.order_total)}</TableCell>
                            <TableCell className="text-green-600">
                              +{formatPrice(order.commission_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                                {order.status === 'paid' ? 'Đã TT' : order.status === 'confirmed' ? 'Chờ TT' : order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa CTV: {selectedAffiliate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tỷ lệ hoa hồng (%)</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={editData.commission_rate}
                onChange={(e) => setEditData({ ...editData, commission_rate: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select 
                value={editData.status} 
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="suspended">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú admin</Label>
              <Textarea
                value={editData.admin_note}
                onChange={(e) => setEditData({ ...editData, admin_note: e.target.value })}
                placeholder="Ghi chú nội bộ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
