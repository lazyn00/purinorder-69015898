import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Facebook, Instagram, MessageCircle, Video } from "lucide-react"; // Import thêm icon Video đại diện cho TikTok
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductNotificationFormProps {
  productId: number;
  productName: string;
}

export function ProductNotificationForm({ productId, productName }: ProductNotificationFormProps) {
  const [socialLink, setSocialLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateSocialLink = (link: string): boolean => {
    const patterns = [
      /facebook\.com/i,
      /fb\.com/i,
      /instagram\.com/i,
      /threads\.net/i,
      /m\.me/i,
      /tiktok\.com/i,    // Chấp nhận tiktok.com
      /vt\.tiktok\.com/i // Chấp nhận link rút gọn từ app TikTok
    ];
    return patterns.some(pattern => pattern.test(link));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socialLink.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập link MXH (Facebook, TikTok...)",
        variant: "destructive"
      });
      return;
    }

    if (!validateSocialLink(socialLink)) {
      toast({
        title: "Link không hợp lệ",
        description: "Vui lòng nhập đúng link Facebook, Instagram, Threads hoặc TikTok",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Vẫn lưu vào cột social_link như cũ, không cần sửa Database
      const { error } = await supabase
        .from('product_notifications')
        .insert({
          product_id: productId,
          product_name: productName,
          social_link: socialLink,
          email: null
        });

      if (error) throw error;

      toast({
        title: "Đăng ký thành công!",
        description: "Purin sẽ nhắn bạn qua link MXH bạn cung cấp khi có hàng.",
      });
      
      setSocialLink("");
    } catch (error) {
      console.error("Error registering notification:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng ký thông báo. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Nhận thông báo khi có hàng</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Để lại link Facebook/Instagram/TikTok để nhận thông báo từ Purin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="social-link" className="text-sm flex items-center gap-2">
              <span>Link MXH của bạn</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Facebook className="h-3.5 w-3.5" />
                <Instagram className="h-3.5 w-3.5" />
                {/* Lucide không có icon TikTok chuẩn, dùng Video icon thay thế hoặc để text */}
                <Video className="h-3.5 w-3.5" /> 
              </div>
            </Label>
            <Input
              id="social-link"
              type="url"
              placeholder="VD: facebook.com/ban, tiktok.com/@ban"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              className="h-10 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Hỗ trợ: Facebook, Instagram, Threads, TikTok
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? "Đang lưu..." : "Đăng ký nhận thông báo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
