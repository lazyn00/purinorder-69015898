import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export default function ProductManagement() {
  const { refetchProducts, isLoading } = useCart();

  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <p className="text-muted-foreground">
          Sản phẩm được quản lý trực tiếp từ Google Sheet.<br />
          Mọi thay đổi trên Sheet sẽ tự động cập nhật khi tải lại trang.
        </p>
        <Button 
          variant="outline" 
          onClick={refetchProducts}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Tải lại sản phẩm
        </Button>
      </CardContent>
    </Card>
  );
}
