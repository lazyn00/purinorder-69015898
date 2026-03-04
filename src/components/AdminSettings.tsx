import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Eye, EyeOff, Clock, Mail, Loader2, AlertTriangle, Send, Download, Database } from "lucide-react";

interface ExpiringProduct {
  id: number;
  name: string;
  order_deadline: string;
  status: string;
}

interface PageVisibilitySettings {
  showSellPage: boolean;
  showAffiliatePage: boolean;
}

const SETTINGS_KEY = 'purin_admin_page_settings';

export default function AdminSettings() {
  const { toast } = useToast();
  
  // Page visibility settings
  const [settings, setSettings] = useState<PageVisibilitySettings>({
    showSellPage: true,
    showAffiliatePage: true
  });
  
  // Expiring products
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [adminEmail, setAdminEmail] = useState("ppurin.order@gmail.com");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Error parsing settings:", e);
      }
    }
    
    // Load email from localStorage
    const savedEmail = localStorage.getItem('purin_admin_email');
    if (savedEmail) setAdminEmail(savedEmail);
    
    // Check expiring products on mount
    checkExpiringProducts();
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: Partial<PageVisibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    
    // Dispatch custom event so Layout can react to changes
    window.dispatchEvent(new CustomEvent('pageSettingsChanged', { detail: updated }));
    
    toast({
      title: "Đã lưu cài đặt",
      description: "Thay đổi sẽ được áp dụng ngay",
    });
  };

  const checkExpiringProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-expiring-products', {
        body: { daysBeforeExpiry: daysThreshold }
      });

      if (error) throw error;

      setExpiringProducts(data.expiringProducts || []);
      setExpiredProducts(data.expiredProducts || []);
      
      toast({
        title: "Đã kiểm tra",
        description: `Tìm thấy ${data.expiredProducts?.length || 0} sản phẩm hết hạn, ${data.expiringProducts?.length || 0} sắp hết hạn`,
      });
    } catch (error: any) {
      console.error("Error checking expiring products:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra sản phẩm hết hạn",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async () => {
    if (!adminEmail) {
      toast({
        title: "Thiếu email",
        description: "Vui lòng nhập email để nhận thông báo",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);
    try {
      localStorage.setItem('purin_admin_email', adminEmail);
      
      const { data, error } = await supabase.functions.invoke('check-expiring-products', {
        body: { 
          daysBeforeExpiry: daysThreshold,
          adminEmail,
          sendEmail: true
        }
      });

      if (error) throw error;

      if (data.emailSent) {
        toast({
          title: "Đã gửi email",
          description: `Email thông báo đã được gửi đến ${adminEmail}`,
        });
      } else {
        toast({
          title: "Không có sản phẩm cần thông báo",
          description: "Không có sản phẩm nào sắp hết hạn hoặc đã hết hạn",
        });
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Lỗi gửi email",
        description: error.message || "Không thể gửi email thông báo",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilExpiry = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Page Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ẩn/Hiện trang trên menu
          </CardTitle>
          <CardDescription>
            Bật/tắt các trang chưa ra mắt trên menu chính
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {settings.showSellPage ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="show-sell" className="text-base font-medium">
                  Trang Đăng bán
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép người dùng đăng bán sản phẩm
                </p>
              </div>
            </div>
            <Switch
              id="show-sell"
              checked={settings.showSellPage}
              onCheckedChange={(checked) => updateSettings({ showSellPage: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {settings.showAffiliatePage ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="show-affiliate" className="text-base font-medium">
                  Trang Cộng tác viên (CTV)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép đăng ký làm cộng tác viên
                </p>
              </div>
            </div>
            <Switch
              id="show-affiliate"
              checked={settings.showAffiliatePage}
              onCheckedChange={(checked) => updateSettings({ showAffiliatePage: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expiring Products Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Thông báo sản phẩm sắp hết hạn
          </CardTitle>
          <CardDescription>
            Kiểm tra và nhận thông báo về các sản phẩm sắp hoặc đã hết hạn order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="days-threshold" className="whitespace-nowrap">Cảnh báo trước:</Label>
              <Input
                id="days-threshold"
                type="number"
                value={daysThreshold}
                onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 3)}
                className="w-20"
                min={1}
                max={30}
              />
              <span className="text-sm text-muted-foreground">ngày</span>
            </div>
            
            <Button 
              onClick={checkExpiringProducts} 
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Kiểm tra
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="admin-email">Email nhận thông báo</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <Button 
              onClick={sendEmailNotification}
              disabled={sendingEmail || (!expiringProducts.length && !expiredProducts.length)}
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Gửi email
            </Button>
          </div>

          {/* Expired Products */}
          {expiredProducts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-destructive flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Sản phẩm đã hết hạn ({expiredProducts.length})
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {expiredProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <span className="font-medium truncate flex-1">{product.name}</span>
                    <Badge variant="destructive" className="ml-2">
                      Hết hạn {formatDate(product.order_deadline)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon Products */}
          {expiringProducts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-amber-600 flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Sản phẩm sắp hết hạn ({expiringProducts.length})
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {expiringProducts.map((product) => {
                  const daysLeft = getDaysUntilExpiry(product.order_deadline);
                  return (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                    >
                      <span className="font-medium truncate flex-1">{product.name}</span>
                      <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        Còn {daysLeft} ngày
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && expiringProducts.length === 0 && expiredProducts.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Không có sản phẩm nào sắp hết hạn</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export toàn bộ Database
          </CardTitle>
          <CardDescription>
            Tải toàn bộ dữ liệu ra file JSON để chuyển sang database mới
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              setExporting(true);
              try {
                const tables = [
                  'products', 'orders', 'affiliates', 'affiliate_orders',
                  'discount_codes', 'admin_notifications', 'order_status_history',
                  'product_notifications', 'product_views', 'user_listings'
                ] as const;

                const exportData: Record<string, any[]> = {};

                await Promise.all(
                  tables.map(async (table) => {
                    let allRows: any[] = [];
                    let from = 0;
                    const batchSize = 1000;
                    let hasMore = true;

                    while (hasMore) {
                      const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .range(from, from + batchSize - 1);

                      if (error) throw new Error(`Error fetching ${table}: ${error.message}`);
                      if (data && data.length > 0) {
                        allRows = [...allRows, ...data];
                        from += batchSize;
                        hasMore = data.length === batchSize;
                      } else {
                        hasMore = false;
                      }
                    }

                    exportData[table] = allRows;
                  })
                );

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);

                const totalRows = Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0);
                toast({
                  title: "Export thành công!",
                  description: `Đã tải ${totalRows} bản ghi từ ${tables.length} bảng`,
                });
              } catch (error: any) {
                console.error("Export error:", error);
                toast({
                  title: "Lỗi export",
                  description: error.message || "Không thể export dữ liệu",
                  variant: "destructive"
                });
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Đang export..." : "Export Database (JSON)"}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Bao gồm: products, orders, affiliates, affiliate_orders, discount_codes, admin_notifications, order_status_history, product_notifications, product_views, user_listings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
