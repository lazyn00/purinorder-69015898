import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Facebook } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tenant } from "@/config/tenant";

const SHOP_CONFIG = {
  purin: {
    thankMessage: `Cảm ơn bạn đã tin tưởng và ủng hộ Purin 🍮💖`,
    contactMessage: "Vui lòng liên hệ với Purin để xác nhận đơn hàng sớm nhất.",
    groupUrl: "https://www.facebook.com/groups/1142581477955556/",
    groupLabel: "Tham gia Group Facebook",
    contactUrl: "https://m.me/105759462451542",
    contactLabel: "Nhắn tin xác nhận đơn hàng",
    contactColor: "bg-[#AFC6F7] hover:bg-[#94B4EE] text-[#2F4C8A]",
    showGroup: true,
  },
  tiemnhaca: {
    thankMessage: `Cảm ơn bạn đã tin tưởng và ủng hộ tiệm nhà cá 🐡💖`,
    contactMessage: "Vui lòng liên hệ với Cá để xác nhận đơn hàng sớm nhất.",
    groupUrl: "",
    groupLabel: "",
    contactUrl: "https://www.instagram.com/motchutca_/",
    contactLabel: "Nhắn tin xác nhận đơn hàng",
    contactColor: "bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white hover:opacity-90",
    showGroup: false,
  },
};

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const config = SHOP_CONFIG[tenant.shopId as keyof typeof SHOP_CONFIG] || SHOP_CONFIG.purin;

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
              <p className="text-muted-foreground">{config.thankMessage}</p>
              <p className="text-muted-foreground">{config.contactMessage}</p>
            </div>

            {config.showGroup && (
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
                  onClick={() => window.open(config.groupUrl, "_blank")}
                >
                  <Facebook className="w-4 h-4" />
                  {config.groupLabel}
                </Button>
              </div>
            )}

            <Button
  className={`w-full ${config.contactColor}`}
  onClick={() => window.open(config.contactUrl, "_blank")}
>
  {tenant.shopId === 'tiemnhaca'
    ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    : <Facebook className="w-4 h-4 mr-2" />
  }
  {config.contactLabel} {orderNumber ? `#${orderNumber}` : ""}
</Button>

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
