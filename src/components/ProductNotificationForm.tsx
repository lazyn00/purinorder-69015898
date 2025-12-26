import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Facebook, Instagram, MessageCircle } from "lucide-react";
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
    ];
    return patterns.some(pattern => pattern.test(link));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socialLink.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập link Facebook/Instagram/Threads",
        variant: "destructive"
      });
      return;
    }

    if (!validateSocialLink(socialLink)) {
      toast({
        title: "Link không hợp lệ",
        description: "Vui lòng nhập link Facebook, Instagram hoặc Threads",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
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
        description: "Chúng tôi sẽ liên hệ qua mạng xã hội khi sản phẩm có hàng.",
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
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Nhận thông báo khi có hàng</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Để lại link Facebook/Instagram/Threads để nhận thông báo
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
                <MessageCircle className="h-3.5 w-3.5" />
              </div>
            </Label>
            <Input
              id="social-link"
              type="url"
              placeholder="https://facebook.com/yourprofile"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              className="h-10"
            />
            <p className="text-[10px] text-muted-foreground">
              VD: facebook.com/tenban, instagram.com/tenban, threads.net/@tenban
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký nhận thông báo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
