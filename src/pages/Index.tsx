import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Star, Package, Shield, Headphones } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <Star className="w-8 h-8" />,
      title: "Đa dạng sàn TQ",
      description: "Order từ Taobao, 1688, PDD, Douyin, XHS - nguồn hàng phong phú"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Giá cạnh tranh",
      description: "Phí order hợp lý, tỷ giá tốt, ship về Việt Nam nhanh chóng"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Kiểm hàng kỹ",
      description: "Kiểm tra chất lượng sản phẩm trước khi ship đến tay bạn"
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "Tư vấn tận tâm",
      description: "Hỗ trợ tìm kiếm sản phẩm, tư vấn size và chọn shop uy tín"
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            🍮 Purin Order - Muốn Gì Cũm Coá
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Chuyên nhận order các sản phẩm K-pop, C-pop, Anime từ Taobao, 1688, PDD, Douyin, XHS.
            Hàng chính hãng từ Trung Quốc với giá tốt nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-gradient-primary text-lg px-8">
                Xem sản phẩm
              </Button>
            </Link>
            <Link to="/guide">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Hướng dẫn đặt hàng
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Tại sao chọn Purin?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto p-3 bg-gradient-primary rounded-lg text-primary-foreground w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

     {/* about section */}
<section classname="py-16 md:py-24 bg-muted/50">
  <div classname="container mx-auto px-4">
    <div classname="max-w-3xl mx-auto text-center">
      <h2 classname="text-3xl md:text-4xl font-bold mb-6">
        về chúng tôi
      </h2>
      <p classname="text-lg text-muted-foreground mb-6">
        purin order chuyên nhận order các sản phẩm k-pop, c-pop, anime từ các sàn thương mại điện tử
        lớn của trung quốc như taobao, 1688, pdd, douyin, xhs. chúng tôi giúp bạn tiếp cận được
        những sản phẩm độc quyền, phiên bản giới hạn với giá tốt nhất.
      </p>
      <p classname="text-lg text-muted-foreground mb-8">
        purin có kinh nghiệm order hàng từ trung quốc nên bạn yên tâm nha! tụi mình sẽ kiểm tra kỹ,
        đóng gói cẩn thận và đưa đến tay bạn một cách an toàn. cần tìm món gì hay muốn hỏi thêm,
        purin luôn ở đây hỗ trợ bạn 💛
      </p>
      {/* khối div chứa thống kê đã bị xoá ở đây */}
    </div>
  </div>
</section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-primary-foreground border-0">
            <CardContent className="text-center py-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sẵn sàng đặt hàng?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Khám phá các sản phẩm K-pop, C-pop, Anime hot nhất từ Trung Quốc
              </p>
              <Link to="/products">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Xem sản phẩm ngay
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
