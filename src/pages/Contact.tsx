import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Facebook, Instagram, MessageSquare, Music2 } from "lucide-react";

export default function Contact() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Liên hệ</h1>
          <p className="text-muted-foreground">Purin Order luôn sẵn sàng hỗ trợ bạn 💛</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            
            {/* 1. THÔNG TIN LIÊN HỆ */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Điện thoại</p>
                    <a href="tel:0395939035" className="text-muted-foreground hover:text-primary">
                      0395 939 035
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:purinorder@gmail.com" className="text-muted-foreground hover:text-primary">
                      purinorder@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Địa chỉ</p>
                    <p className="text-muted-foreground">TP. Hồ Chí Minh, Việt Nam</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. MẠNG XÃ HỘI */}
            <Card>
              <CardHeader>
                <CardTitle>Mạng xã hội</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <a 
                  href="https://www.facebook.com/puorderin/?locale=vi_VN" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  <span>Facebook: Purin Order - Muốn Gì Cũm Coá</span>
                </a>
                <a 
                  href="https://instagram.com/purin_order" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span>Instagram: @purin_order</span>
                </a>
                <a 
                  href="https://www.threads.com/@purin_order?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Threads: @purin_order</span>
                </a>
                <a 
                  href="https://tiktok.com/@purin_order" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Music2 className="h-5 w-5" />
                  <span>TikTok: @purin_order</span>
                </a>
              </CardContent>
            </Card>

            {/* MỤC GIỜ LÀM VIỆC ĐÃ BỊ LOẠI BỎ Ở ĐÂY */}
          </div>
        </div>
      </div>
    </Layout>
  );
}
