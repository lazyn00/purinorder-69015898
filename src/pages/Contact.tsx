import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Facebook, Instagram, MessageSquare, Music2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Gửi data vào Google Sheet
    console.log("Contact form:", formData);

    toast({
      title: "Gửi thành công!",
      description: "Chúng tôi sẽ phản hồi sớm nhất có thể.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      message: ""
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Liên hệ</h1>
          <p className="text-muted-foreground">Purin Order luôn sẵn sàng hỗ trợ bạn 💛</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Gửi tin nhắn</CardTitle>
              <CardDescription>
                Điền thông tin và tin nhắn của bạn, Purin sẽ phản hồi trong thời gian sớm nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Họ và tên *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0395939035"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Tin nhắn *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Nội dung cần hỗ trợ..."
                    rows={5}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  Gửi tin nhắn
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent rounded-lg text-accent-foreground">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-muted-foreground">ppurin.order@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent rounded-lg text-accent-foreground">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Hotline</p>
                    <p className="text-muted-foreground">0395939035</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent rounded-lg text-accent-foreground">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Địa chỉ</p>
                    <p className="text-muted-foreground">Thành phố Hồ Chí Minh</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mạng xã hội</CardTitle>
                <CardDescription>Theo dõi Purin để cập nhật sản phẩm mới nhất 💫</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="https://www.facebook.com/puorderin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Facebook className="w-5 h-5 text-primary" />
                  <span className="font-medium">Facebook: @puorderin</span>
                </a>
                <a
                  href="https://www.instagram.com/purin_order/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Instagram className="w-5 h-5 text-primary" />
                  <span className="font-medium">Instagram: @purin_order</span>
                </a>
                <a
                  href="https://www.threads.com/@purin_order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="font-medium">Threads: @purin_order</span>
                </a>
                <a
                  href="https://www.tiktok.com/@purin_order/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Music2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">TikTok: @purin_order</span>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giờ làm việc</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2">
                <p><strong>Luôn mở cửa</strong> — Purin luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào 💛</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
