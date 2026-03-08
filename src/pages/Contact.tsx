import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Facebook, Instagram, MessageSquare, Music2, Users, CreditCard, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import qrMomo from "@/assets/qr-momo.jpg";
import qrZalopay from "@/assets/qr-zalopay.jpg";
import qrVpbank from "@/assets/qr-vpbank.jpg";

const PAYMENT_INFO = {
  accountName: "BUI THANH NHU Y",
  vpbank: "0395939035",
  momo: "0395939035",
  zalopay: "0395939035"
};

export default function Contact() {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<string | null>(null);

  const handleCopy = (label: string, value: string) => {
    const textToCopy = `${label}: ${value}\nTên: ${PAYMENT_INFO.accountName}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedItem(label);
    toast({
      title: "Đã copy!",
      description: `Thông tin ${label} đã được copy vào clipboard`,
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Thông tin</h1>
          <p className="text-muted-foreground">Purin Order luôn sẵn sàng hỗ trợ bạn 💛</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">

            {/* THÔNG TIN THANH TOÁN */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Nhấn để copy thông tin thanh toán (bao gồm STK và tên thụ hưởng)
                </p>
                
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => { handleCopy("VPBank", PAYMENT_INFO.vpbank); setShowQr(showQr === "VPBank" ? null : "VPBank"); }}
                >
                  <span className="font-medium">VPBank</span>
                  {copiedItem === "VPBank" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {showQr === "VPBank" && (
                  <div className="flex justify-center py-2">
                    <img src={qrVpbank} alt="QR VPBank" className="max-w-[220px] rounded-lg shadow-sm" />
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => { handleCopy("Momo", PAYMENT_INFO.momo); setShowQr(showQr === "Momo" ? null : "Momo"); }}
                >
                  <span className="font-medium">Momo</span>
                  {copiedItem === "Momo" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {showQr === "Momo" && (
                  <div className="flex justify-center py-2">
                    <img src={qrMomo} alt="QR Momo" className="max-w-[220px] rounded-lg shadow-sm" />
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => { handleCopy("ZaloPay", PAYMENT_INFO.zalopay); setShowQr(showQr === "ZaloPay" ? null : "ZaloPay"); }}
                >
                  <span className="font-medium">ZaloPay</span>
                  {copiedItem === "ZaloPay" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {showQr === "ZaloPay" && (
                  <div className="flex justify-center py-2">
                    <img src={qrZalopay} alt="QR ZaloPay" className="max-w-[220px] rounded-lg shadow-sm" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* THÔNG TIN LIÊN HỆ */}
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
                    <a href="mailto:ppurin.order@gmail.com" className="text-muted-foreground hover:text-primary">
                      ppurin.order@gmail.com
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

            {/* MẠNG XÃ HỘI */}
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

            {/* GROUP THEO DÕI ĐƠN HÀNG */}
            <Card className="bg-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Group theo dõi đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Tham gia group Facebook để cập nhật tiến độ đơn hàng, nhận thông báo mới nhất và kết nối với cộng đồng Purin Order!
                </p>
                <a 
                  href="https://www.facebook.com/groups/1142581477955556/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full gap-2">
                    <Facebook className="h-4 w-4" />
                    Tham gia group theo dõi đơn hàng
                  </Button>
                </a>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}
