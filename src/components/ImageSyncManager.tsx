import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart, Product } from "@/contexts/CartContext";
import { Image, RefreshCw, Check, X, Upload } from "lucide-react";

interface SyncResult {
  productId: number;
  productName: string;
  originalCount: number;
  syncedCount: number;
  status: 'success' | 'partial' | 'failed';
}

export default function ImageSyncManager() {
  const { products, refetchProducts } = useCart();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProduct, setCurrentProduct] = useState("");
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [totalStats, setTotalStats] = useState({ synced: 0, total: 0 });

  const countExternalImages = () => {
    let external = 0;
    let total = 0;
    products.forEach(product => {
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img: string) => {
          total++;
          if (!img.includes('supabase.co/storage')) {
            external++;
          }
        });
      }
    });
    return { external, total };
  };

  const syncProductImages = async (product: Product): Promise<SyncResult> => {
    try {
      const externalImages = product.images?.filter(
        (img: string) => !img.includes('supabase.co/storage')
      ) || [];

      if (externalImages.length === 0) {
        return {
          productId: product.id,
          productName: product.name,
          originalCount: product.images?.length || 0,
          syncedCount: product.images?.length || 0,
          status: 'success'
        };
      }

      const { data, error } = await supabase.functions.invoke('sync-images-to-storage', {
        body: {
          imageUrls: product.images,
          productId: product.id,
          productName: product.name
        }
      });

      if (error) throw error;

      return {
        productId: product.id,
        productName: product.name,
        originalCount: data.originalCount,
        syncedCount: data.syncedCount,
        status: data.syncedCount === data.originalCount ? 'success' : 'partial'
      };

    } catch (error) {
      console.error(`Error syncing product ${product.id}:`, error);
      return {
        productId: product.id,
        productName: product.name,
        originalCount: product.images?.length || 0,
        syncedCount: 0,
        status: 'failed'
      };
    }
  };

  const handleSyncAll = async () => {
    if (products.length === 0) {
      toast.error("Không có sản phẩm để đồng bộ");
      return;
    }

    setIsSyncing(true);
    setProgress(0);
    setSyncResults([]);
    setTotalStats({ synced: 0, total: 0 });

    const results: SyncResult[] = [];
    let totalSynced = 0;
    let totalImages = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setCurrentProduct(product.name);
      setProgress(Math.round(((i + 1) / products.length) * 100));

      const result = await syncProductImages(product);
      results.push(result);
      totalSynced += result.syncedCount;
      totalImages += result.originalCount;
    }

    setSyncResults(results);
    setTotalStats({ synced: totalSynced, total: totalImages });
    setIsSyncing(false);
    setCurrentProduct("");

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    if (failedCount === 0) {
      toast.success(`Đã đồng bộ ${totalSynced}/${totalImages} hình ảnh thành công!`);
    } else {
      toast.warning(`Đồng bộ hoàn tất: ${successCount} thành công, ${failedCount} thất bại`);
    }

    // Refresh products to get updated URLs
    refetchProducts();
  };

  const { external, total } = countExternalImages();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Đồng bộ hình ảnh
        </CardTitle>
        <CardDescription>
          Upload hình ảnh từ Google Sheet lên Lovable Cloud để load nhanh hơn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">Sản phẩm</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Tổng hình</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">{external}</p>
            <p className="text-xs text-muted-foreground">Chưa sync</p>
          </div>
        </div>

        {/* Sync button */}
        <Button 
          onClick={handleSyncAll} 
          disabled={isSyncing || external === 0}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Đang đồng bộ...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {external === 0 ? "Tất cả hình đã được sync" : `Đồng bộ ${external} hình ảnh`}
            </>
          )}
        </Button>

        {/* Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {progress}% - {currentProduct}
            </p>
          </div>
        )}

        {/* Results */}
        {syncResults.length > 0 && !isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kết quả đồng bộ:</span>
              <span className="font-medium">
                {totalStats.synced}/{totalStats.total} hình
              </span>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {syncResults.filter(r => r.status !== 'success').map((result) => (
                <div 
                  key={result.productId}
                  className="flex items-center justify-between text-sm p-2 rounded bg-muted"
                >
                  <span className="truncate flex-1">{result.productName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {result.syncedCount}/{result.originalCount}
                    </span>
                    {result.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
                    {result.status === 'partial' && <Badge variant="secondary">Một phần</Badge>}
                    {result.status === 'failed' && <X className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          * Hình ảnh được lưu trữ trên Lovable Cloud sẽ load nhanh hơn đáng kể so với link Google Drive/Dropbox.
        </p>
      </CardContent>
    </Card>
  );
}
