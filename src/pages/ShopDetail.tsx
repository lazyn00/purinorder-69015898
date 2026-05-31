import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Store, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingPudding } from "@/components/LoadingPudding";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { MasterShopPosterExport } from "@/components/MasterShopPosterExport";
import { MasterShippingProgress } from "@/components/MasterShippingProgress";

// Imports cho Popup
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import ProductDetail from "@/pages/ProductDetail";

interface MasterShop {
  master_name: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  shop_link: string | null;
  description: string | null;
}

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

interface ShopDetailProps {
  overrideSlug?: string;
}

export default function ShopDetail({ overrideSlug }: ShopDetailProps) {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { products, isLoading } = useCart();
  const navigate = useNavigate();
  
  const [shopFromDB, setShopFromDB] = useState<MasterShop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [popupProductId, setPopupProductId] = useState<string | null>(null);

  const slug = overrideSlug || urlSlug;

  const currentSlug = useMemo(() => {
    if (!slug) return "";
    try {
      const decoded = decodeURIComponent(slug);
      return decoded.split('/').filter(Boolean).pop() || "";
    } catch (e) {
      return slug.split('/').filter(Boolean).pop() || "";
    }
  }, [slug]);

  const resolvedMasterName = useMemo(() => {
    if (!currentSlug || isLoading) return null;
    
    const found = products.find((p: any) => {
      if (!p.master) return false;
      const masterSlug = slugify(p.master);
      return masterSlug === currentSlug;
    });

    return found ? (found as any).master : null;
  }, [currentSlug, products, isLoading]);

  useEffect(() => {
    const fetchShop = async () => {
      if (!currentSlug) return;
      setShopLoading(true);
      
      let { data } = await (supabase as any)
        .from("master_shops")
        .select("*")
        .eq("slug", currentSlug)
        .maybeSingle();

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

  const productPopup = (
    <Dialog open={popupProductId !== null} onOpenChange={(open) => { if (!open) setPopupProductId(null); }}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 rounded-xl">
        <button
          onClick={() => setPopupProductId(null)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 z-50"
        >
          <X className="h-4 w-4" />
        </button>
        {popupProductId && (
          <div className="pt-2">
            <ProductDetail overrideId={popupProductId} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    if (overrideSlug) return <div className="flex justify-center items-center h-[30vh]"><LoadingPudding /></div>;
    return <Layout><div className="flex justify-center items-center h-[50vh]"><LoadingPudding /></div></Layout>;
  }

  if (!finalShop && !shopLoading) {
    const errorFallback = (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Không tìm thấy shop: {currentSlug}</p>
        {!overrideSlug && <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>}
      </div>
    );
    if (overrideSlug) return errorFallback;
    return <Layout>{errorFallback}</Layout>;
  }

  const shopContent = (
    <div className="container mx-auto px-4 py-4">
      {!overrideSlug && (
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 p-0 h-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 rounded-lg bg-card border mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
          {finalShop?.avatar_url ? (
            <img src={finalShop.avatar_url} alt={finalShop.display_name} className="w-full h-full object-cover" />
          ) : (
            <Store className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">{finalShop?.display_name}</h1>
          {finalShop?.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{finalShop.description}</p>}
          <p className="text-sm text-muted-foreground mt-3">{available.length} đang order · {hidden.length} đã ẩn</p>
          <div className="mt-3 flex gap-2 flex-wrap justify-center sm:justify-start">
            {finalShop && available.length > 0 && (
              <MasterShopPosterExport shop={finalShop as any} products={available as any} />
            )}
          </div>
        </div>
      </div>

      {resolvedMasterName && (
        <div className="mb-6">
          <MasterShippingProgress masterName={resolvedMasterName} />
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Đang order ({available.length})</h2>
        {available.length === 0 ? <p className="text-sm text-muted-foreground">Hiện chưa có sản phẩm nào.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {available.map((p: any) => (
              <div key={p.id} onClick={() => setPopupProductId(String(p.id))} className="cursor-pointer">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {hidden.length > 0 && (
        <Collapsible open={showHidden} onOpenChange={setShowHidden}>
          <div className="border-t pt-6">
            <ThemeCollapsibleButton hiddenCount={hidden.length} showHidden={showHidden} />
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {hidden.map((p: any) => (
                  <div key={p.id} onClick={() => setPopupProductId(String(p.id))} className="cursor-pointer">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );

  if (overrideSlug) {
    return <>{shopContent}{productPopup}</>;
  }

  return <Layout>{shopContent}{productPopup}</Layout>;
}

function ThemeCollapsibleButton({ hiddenCount, showHidden }: { hiddenCount: number; showHidden: boolean }) {
  return (
    <CollapsibleTrigger asChild>
      <Button variant="ghost" className="w-full justify-between">
        <span className="font-medium">Sản phẩm đã ẩn ({hiddenCount})</span>
        {showHidden ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
    </CollapsibleTrigger>
  );
}
