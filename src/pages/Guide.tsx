import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, CreditCard, Truck } from "lucide-react";

export default function Guide() {
  const steps = [
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "Bước 1: Chọn sản phẩm",
      description: "Xem danh sách sản phẩm và chọn sản phẩm bạn muốn đặt. Nhấn nút 'Đặt hàng ngay' để tiếp tục."
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Bước 2: Điền thông tin",
      description: "Điền đầy đủ thông tin: họ tên, số điện thoại, địa chỉ nhận hàng và số lượng sản phẩm cần đặt."
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Bước 3: Xác nhận và thanh toán",
      description: "Sau khi xác nhận đơn, hệ thống sẽ chuyển đến Form thanh toán — bạn nhập thông tin, đính kèm bill và nhấn gửi."
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Bước 4: Chờ đợi & nhận hàng",
      description: "Sản phẩm sẽ được Purin cập nhật tiến độ cho bạn qua Email và Purin sẽ giao đến địa chỉ của bạn sau khi về hàng."
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Hướng dẫn đặt hàng</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Quy trình đặt hàng đơn giản, nhanh chóng chỉ với 4 bước
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {steps.map((step, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-primary rounded-lg text-primary-foreground">
                    {step.icon}
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Lưu ý quan trọng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📦 Về hàng Pre-order</h3>
              <p className="text-muted-foreground">
                Đa số sản phẩm là hàng order không có sẵn, thời gian về hàng dự kiến 1-2 tuần kể từ khi đóng đơn.
                Purin sẽ thông báo khi hàng về.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💳 Thanh toán</h3>
              <p className="text-muted-foreground">
                Bạn có thể thanh toán qua chuyển khoản ngân hàng hoặc ví điện tử.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🚚 Vận chuyển</h3>
              <p className="text-muted-foreground">
                Phí ship sẽ được tính theo khu vực. 
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📞 Hỗ trợ</h3>
              <p className="text-muted-foreground">
                Mọi thắc mắc vui lòng liên hệ qua trang Liên hệ hoặc inbox trực tiếp fanpage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
