import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Facebook } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Đặt hàng thành công!</CardTitle>
            {orderNumber && (
              <CardDescription className="text-lg">
                Mã đơn hàng: <span className="font-semibold text-foreground">#{orderNumber}</span>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Cảm ơn bạn đã tin tưởng và ủng hộ Purin 🍮💖
              </p>
              <p className="text-muted-foreground">
                Chúng tôi sẽ xử lý đơn hàng và liên hệ với bạn sớm nhất.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Theo dõi đơn hàng</h3>
                  <p className="text-sm text-muted-foreground">
                    Tham gia group để cập nhật tiến độ đơn hàng kịp thời
                  </p>
                </div>
              </div>

              <Button 
                className="w-full gap-2"
                onClick={() => window.open("https://www.facebook.com/groups/1142581477955556/", "_blank")}
              >
                <Facebook className="w-4 h-4" />
                Tham gia Group Facebook
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/track-order")}
              >
                Tra cứu đơn hàng
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate("/products")}
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
