import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // 1. Import thêm useNavigate
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Store, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingPudding } from "@/components/LoadingPudding";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";

// ... (Interface và hàm slugify/isAvailable giữ nguyên)

export default function ShopDetail() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const { products, isLoading } = useCart();
  const navigate = useNavigate(); // 2. Khởi tạo navigate

  const [shopFromDB, setShopFromDB] = useState<MasterShop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  // ... (Logic currentSlug, resolvedMasterName, fetchShop, finalShop giữ nguyên)

  if (isLoading) {
    return <Layout><div className="flex justify-center items-center h-[50vh]"><LoadingPudding /></div></Layout>;
  }

  if (!finalShop && !shopLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Không tìm thấy shop: {currentSlug}</p>
          {/* Nút quay lại ở trang lỗi */}
          <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* 3. Thay đổi Link thành Button để điều hướng về trang trước (-1) */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 p-0 h-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 rounded-lg bg-card border mb-8">
          {/* ... (Phần hiển thị thông tin shop giữ nguyên) */}
        </div>

        {/* ... (Các phần còn lại giữ nguyên) */}
      </div>
    </Layout>
  );
}
