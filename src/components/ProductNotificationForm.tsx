import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductNotificationFormProps {
  productId: number;
  productName: string;
}

export function ProductNotificationForm({ productId, productName }: ProductNotificationFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email hợp lệ",
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
          email: email
        });

      if (error) throw error;

      toast({
        title: "Đăng ký thành công!",
        description: "Chúng tôi sẽ gửi email thông báo khi sản phẩm có hàng trở lại.",
      });
      
      setEmail("");
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
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Nhận thông báo khi có hàng</CardTitle>
        </div>
        <CardDescription>
          Nhập email để nhận thông báo khi sản phẩm này có hàng trở lại
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-email">Email của bạn</Label>
            <Input
              id="notification-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký nhận thông báo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
