import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Star, Package, Shield, Headphones } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";

const Index = () => {
  useReferralCapture();

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg space-y-6">
          <div className="text-6xl">🍮</div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Đang bảo trì
          </h1>
          <p className="text-lg text-muted-foreground">
            Purin Order đang được nâng cấp hệ thống.
            <br />
            Vui lòng quay lại sau <strong>12 giờ</strong> nha! 💛
          </p>
          <p className="text-sm text-muted-foreground">
            Xin lỗi vì sự bất tiện này. Purin sẽ quay lại sớm thôi!
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
