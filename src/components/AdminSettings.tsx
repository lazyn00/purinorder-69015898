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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export toàn bộ Database
          </CardTitle>
          <CardDescription>
            Tải dữ liệu từng bảng ra file CSV để import vào Supabase mới
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={async () => {
              setExporting(true);
              try {
                const tables = [
                  'products', 'orders', 'affiliates', 'affiliate_orders',
                  'discount_codes', 'admin_notifications', 'order_status_history',
                  'product_notifications', 'product_views', 'user_listings'
                ] as const;

                let totalRows = 0;

                for (const table of tables) {
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

                  if (allRows.length === 0) continue;

                  // Convert to CSV
                  const headers = Object.keys(allRows[0]);
                  const csvRows = [headers.join(',')];
                  for (const row of allRows) {
                    const values = headers.map(h => {
                      const val = row[h];
                      if (val === null || val === undefined) return '';
                      if (typeof val === 'object') {
                        // JSON fields - wrap in quotes and escape
                        const jsonStr = JSON.stringify(val).replace(/"/g, '""');
                        return `"${jsonStr}"`;
                      }
                      const str = String(val);
                      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                      }
                      return str;
                    });
                    csvRows.push(values.join(','));
                  }

                  const csvContent = csvRows.join('\n');
                  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${table}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  totalRows += allRows.length;

                  // Small delay between downloads
                  await new Promise(r => setTimeout(r, 300));
                }

                toast({
                  title: "Export thành công!",
                  description: `Đã tải ${totalRows} bản ghi từ ${tables.length} bảng (CSV)`,
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
            {exporting ? "Đang export..." : "Export tất cả (CSV)"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Sẽ tải về 10 file CSV riêng biệt. Vào Supabase mới → Table Editor → chọn bảng → Import CSV để nhập từng file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
