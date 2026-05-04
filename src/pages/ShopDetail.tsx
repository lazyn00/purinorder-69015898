import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ExternalLink, Store, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingPudding } from "@/components/LoadingPudding";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";

interface MasterShop {
  master_name: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  shop_link: string | null;
  description: string | null;
}

// ĐỒNG BỘ: Hàm slugify hỗ trợ tiếng Trung và đa ngôn ngữ
const slugify = (s: string) => {
  if (!s) return "shop";
  
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Khử dấu tiếng Việt
    .replace(/đ/g, "d")
    // Giữ lại ký tự chữ cái (bao gồm tiếng Trung/Nhật/Hàn) và số
    .replace(/[^\p{L}\p{N}]+/gu, "-") 
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
};

const isAvailable = (p: any) => {
  if (p.status === "Ẩn") return false;
  const notExpired = !p.order_deadline || new Date(p.order_deadline) > new Date();
  const hasVariantStock = p.variants?.some((v: any) => v.stock !== undefined);
  let hasStock = false;
  if (hasVariantStock) {
    const total = p.variants
      .filter((v: any) => v.stock !== undefined)
      .reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    hasStock = total > 0;
  } else if (p.stock !== undefined && p.stock !== null) {
    hasStock = p.stock > 0;
  }
  return hasStock && notExpired;
};

export default function ShopDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { products, isLoading } = useCart();
  const [shop, setShop] = useState<MasterShop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    (async () => {
      setShopLoading(true);
      // Ưu tiên tìm shop khớp chính xác với slug trong database (bao gồm slug Ý tự đặt)
      const { data } = await (supabase as any)
        .from("master_shops")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        setShop(data as MasterShop);
      }
      setShopLoading(false);
    })();
  }, [slug]);

  // Nếu không tìm thấy hàng trong DB, thử tìm Master có tên khi chạy qua slugify khớp với URL
  const resolvedMaster = useMemo(() => {
    if (shop) return shop.master_name;
    if (!slug || isLoading) return null;
    const found = products.find((p: any) => p.master && slugify(p.master) === slug);
    return found ? (found as any).master : null;
  }, [shop, slug, products, isLoading]);

  const fallbackShop: MasterShop | null = useMemo(() => {
    if (shop || !resolvedMaster) return null;
    return {
      master_name: resolvedMaster,
      display_name: resolvedMaster,
      slug: slug || "",
      avatar_url: null,
      shop_link: null,
      description: null,
    };
  }, [shop, resolvedMaster, slug]);

  const finalShop = shop || fallbackShop;

  const masterProducts = useMemo(() => {
    if (!resolvedMaster) return [];
    return products.filter((p: any) => p.master === resolvedMaster);
  }, [resolvedMaster, products]);

  const available = masterProducts.filter(isAvailable);
  const hidden = masterProducts.filter((p: any) => !isAvailable(p));

  if (shopLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  if (!finalShop) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Không tìm thấy shop này.</p>
          <Link to="/shops"><Button variant="outline">Về danh sách shop</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/shops" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Tất cả shop
        </Link>

        {/* Shop header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 rounded-lg bg-card border mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {finalShop.avatar_url ? (
              <img src={finalShop.avatar_url} alt={finalShop.display_name} className="w-full h-full object-cover" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold break-words">{finalShop.display_name}</h1>
            {finalShop.description && (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{finalShop.description}</p>
            )}
            <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start mt-3">
              <span className="text-sm text-muted-foreground">{available.length} đang order · {hidden.length} đã ẩn</span>
              {finalShop.shop_link && (
                <a
                  href={finalShop.shop_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Link shop
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Available products */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Đang order ({available.length})</h2>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hiện chưa có sản phẩm nào.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {available.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Hidden / out of stock - collapsible */}
        {hidden.length > 0 && (
          <Collapsible open={showHidden} onOpenChange={setShowHidden}>
            <div className="border-t pt-6">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="font-medium">Hết hàng / Hết hạn ({hidden.length})</span>
                  {showHidden ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {hidden.map((p: any) => <ProductCard key={p.id} product={p} />)}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </div>
    </Layout>
  );
}
