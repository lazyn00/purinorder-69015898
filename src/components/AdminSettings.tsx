import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Database } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export toàn bộ Database
          </CardTitle>
          <CardDescription>
            Tải dữ liệu từng bảng ra file CSV để import vào backend mới
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

                  const headers = Object.keys(allRows[0]);
                  const csvRows = [headers.join(',')];
                  for (const row of allRows) {
                    const values = headers.map(h => {
                      const val = row[h];
                      if (val === null || val === undefined) return '';
                      if (typeof val === 'object') {
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
            Sẽ tải về 10 file CSV riêng biệt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
