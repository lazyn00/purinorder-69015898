import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Store, ArrowLeft } from "lucide-react";
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

// HÀM SLUGIFY CHUẨN NHẤT
const slugify = (s: string) => {
  if (!s) return "shop";
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
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
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const { products, isLoading } = useCart();
  
  const [shopFromDB, setShopFromDB] = useState<MasterShop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  // 1. Làm sạch Slug từ URL (SỬA LẠI Ở ĐÂY)
  const currentSlug = useMemo(() => {
    if (!rawSlug) return "";
    try {
      // Thử decode, nếu không được (do đã là tiếng Trung) thì giữ nguyên
      const decoded = decodeURIComponent(rawSlug);
      return decoded.split('/').filter(Boolean).pop() || "";
    } catch (e) {
      return rawSlug.split('/').filter(Boolean).pop() || "";
    }
  }, [rawSlug]);

  // 2. Tìm Master Name từ danh sách sản phẩm
  const resolvedMasterName = useMemo(() => {
    if (!currentSlug || isLoading) return null;
    
    // Tìm sản phẩm khớp với slug hiện tại
    const found = products.find((p: any) => {
      if (!p.master) return false;
      const masterSlug = slugify(p.master);
      return masterSlug === currentSlug;
    });

    return found ? (found as any).master : null;
  }, [currentSlug, products, isLoading]);

  // 3. Lấy thông tin Shop từ Database
  useEffect(() => {
    const fetchShop = async () => {
      if (!currentSlug) return;
      setShopLoading(true);
      
      // Thử tìm theo slug trước (Ưu tiên slug Ý đặt trong DB)
      let { data, error } = await (supabase as any)
        .from("master_shops")
        .select("*")
        .eq("slug", currentSlug)
        .maybeSingle();

      // Nếu không thấy theo slug, thử tìm theo master_name đã tìm được từ sản phẩm
      if (!data && resolvedMasterName) {
        const { data: dataByName } = await (supabase as any)
          .from("master_shops")
          .select("*")
          .eq("master_name", resolvedMasterName)
          .maybeSingle();
        data = dataByName;
      }

      setShopFromDB(data as MasterShop);
      setShopLoading(false);
    };

    if (!isLoading) {
      fetchShop();
    }
  }, [currentSlug, resolvedMasterName, isLoading]);

  // 4. Tổng hợp thông tin để hiển thị
  const finalShop = useMemo(() => {
    if (shopFromDB) return shopFromDB;
    if (resolvedMasterName) {
      return {
        master_name: resolvedMasterName,
        display_name: resolvedMasterName,
        slug: currentSlug,
        avatar_url: null,
        shop_link: null,
        description: null,
      };
    }
    return null;
  }, [shopFromDB, resolvedMasterName, currentSlug]);

  const masterProducts = useMemo(() => {
    if (!resolvedMasterName) return [];
    return products.filter((p: any) => p.master === resolvedMasterName);
  }, [resolvedMasterName, products]);

  const available = masterProducts.filter(isAvailable);
  const hidden = masterProducts.filter((p: any) => !isAvailable(p));

  // Loading state
  if (isLoading) {
    return <Layout><div className="flex justify-center items-center h-[50vh]"><LoadingPudding /></div></Layout>;
  }

  // Nếu đã load xong mà không tìm thấy gì
  if (!finalShop && !shopLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Không tìm thấy shop: {currentSlug}</p>
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

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 rounded-lg bg-card border mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {finalShop?.avatar_url ? (
              <img src={finalShop.avatar_url} alt={finalShop.display_name} className="w-full h-full object-cover" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">{finalShop?.display_name}</h1>
            {finalShop?.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{finalShop.description}</p>}
            <p className="text-sm text-muted-foreground mt-3">{available.length} đang order · {hidden.length} đã ẩn</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Đang order ({available.length})</h2>
          {available.length === 0 ? <p className="text-sm text-muted-foreground">Hiện chưa có sản phẩm nào.</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {available.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {hidden.length > 0 && (
          <Collapsible open={showHidden} onOpenChange={setShowHidden}>
            <div className="border-t pt-6">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="font-medium">Sản phẩm đã ẩn ({hidden.length})</span>
                  {showHidden ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
