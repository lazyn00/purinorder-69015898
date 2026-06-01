import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingPudding } from "@/components/LoadingPudding";
import { ProductCard } from "@/components/ProductCard";

interface MasterShop {
  id: string;
  master_name: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  shop_link: string | null;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
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
    .slice(0, 100) || "shop";
};

// Bảng màu pastel dễ thương để fallback khi shop không có avatar
const PASTEL_COLORS = [
  { bg: "bg-pink-100", fg: "text-pink-700" },
  { bg: "bg-purple-100", fg: "text-purple-700" },
  { bg: "bg-blue-100", fg: "text-blue-700" },
  { bg: "bg-green-100", fg: "text-green-700" },
  { bg: "bg-yellow-100", fg: "text-yellow-700" },
  { bg: "bg-orange-100", fg: "text-orange-700" },
  { bg: "bg-teal-100", fg: "text-teal-700" },
  { bg: "bg-rose-100", fg: "text-rose-700" },
];

const pickColor = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PASTEL_COLORS[h % PASTEL_COLORS.length];
};

const CUTE_EMOJIS = ["🌸", "🍡", "🐰", "🧸", "🍓", "🌼", "🍑", "☁️", "🦄", "🌷"];
const pickEmoji = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i)) >>> 0;
  return CUTE_EMOJIS[h % CUTE_EMOJIS.length];
};

const isAvailable = (p: any) => {
  if (p.status === "Ẩn") return false;
  const notExpired = !p.orderDeadline || new Date(p.orderDeadline) > new Date();
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const hasVariantStock = variants.some((v: any) => v && v.stock !== undefined);
  let hasStock = false;
  if (hasVariantStock) {
    const total = variants
      .filter((v: any) => v && v.stock !== undefined)
      .reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    hasStock = total > 0;
  } else if (p.stock !== null && p.stock !== undefined) {
    hasStock = p.stock > 0;
  }
  return hasStock && notExpired;
};

const mapProduct = (p: any) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  images: Array.isArray(p.images) ? p.images : [],
  variants: Array.isArray(p.variants) ? p.variants.map((v: any) => ({
    name: v.name,
    price: Number(v.price) || 0,
    stock: v.stock === null || v.stock === undefined || String(v.stock).trim() === "" ? (p.stock ?? 0) : Number(v.stock),
  })) : [],
  status: p.status,
  orderDeadline: p.order_deadline,
  stock: p.stock ?? undefined,
  master: p.master,
  artist: p.artist,
});

export default function Shops() {
  const [shops, setShops] = useState<MasterShop[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: shopRows }, { data: productRows }] = await Promise.all([
        (supabase as any).from("master_shops").select("*").eq("is_visible", true).order("sort_order"),
        supabase.from("products").select("*").not("master", "is", null).neq("master", "").order("id", { ascending: false }),
      ]);
      setShops((shopRows as MasterShop[]) || []);
      setProducts(((productRows as any) || []).map(mapProduct));
      setLoading(false);
    })();
  }, []);

  const merged = useMemo(() => {
    const map = new Map<string, MasterShop>();
    shops.forEach((s) => map.set(s.master_name, s));
    const allMasters = [...new Set(products.map((p) => p.master).filter(Boolean))] as string[];
    allMasters.forEach((m) => {
      if (!map.has(m)) {
        map.set(m, {
          id: m,
          master_name: m,
          display_name: m,
          slug: slugify(m),
          avatar_url: null,
          shop_link: null,
          description: null,
          is_visible: true,
          sort_order: 9999,
        });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name)
    );
  }, [shops, products]);

  const shopProducts = (masterName: string) =>
    products.filter((p) => p.master === masterName && isAvailable(p));

  const filtered = merged
    .map((s) => ({ shop: s, items: shopProducts(s.master_name) }))
    .filter(({ shop, items }) => {
      if (items.length === 0) return false;
      if (!search) return true;
      return (
        shop.display_name.toLowerCase().includes(search.toLowerCase()) ||
        shop.master_name.toLowerCase().includes(search.toLowerCase())
      );
    });

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1">Shops</h1>
          <p className="text-sm text-muted-foreground">Khám phá sản phẩm theo từng shop / master</p>
        </div>

        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          {filtered.map(({ shop, items }) => {
            const color = pickColor(shop.master_name);
            const emoji = pickEmoji(shop.master_name);
            return (
              <div key={shop.id} className="bg-card border rounded-lg overflow-hidden shadow-sm">
                {/* Shop header */}
                <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b bg-muted/20">
                  <Link to={`/shop/${shop.slug}`} className="flex items-center gap-3 min-w-0 group">
                    {shop.avatar_url ? (
                      <img
                        src={shop.avatar_url}
                        alt={shop.display_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full ${color.bg} ${color.fg} flex items-center justify-center text-2xl shrink-0 border-2 border-background shadow-sm`}
                      >
                        {emoji}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {shop.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{items.length} sản phẩm</p>
                    </div>
                  </Link>
                  <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1">
                    <Link to={`/shop/${shop.slug}`}>
                      <span className="hidden sm:inline text-xs">Xem shop</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Products horizontal scroll */}
                <div className="flex gap-3 overflow-x-auto p-3 scrollbar-hide snap-x scroll-smooth">
                  {items.slice(0, 12).map((p) => (
                    <div key={p.id} className="shrink-0 w-[140px] sm:w-[160px] snap-start">
                      <ProductCard product={p} />
                    </div>
                  ))}
                  {items.length > 12 && (
                    <Link
                      to={`/shop/${shop.slug}`}
                      className="shrink-0 w-[140px] sm:w-[160px] flex flex-col items-center justify-center bg-muted/40 hover:bg-muted/60 rounded-md border border-dashed text-xs text-muted-foreground gap-2"
                    >
                      <ChevronRight className="h-6 w-6" />
                      <span>Xem thêm</span>
                      <span className="text-[10px]">{items.length - 12} sp khác</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Không tìm thấy shop nào có sản phẩm đang mở.</p>
        )}
      </div>
    </Layout>
  );
}
