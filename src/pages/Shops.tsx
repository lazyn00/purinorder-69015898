import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingPudding } from "@/components/LoadingPudding";

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

interface ProductLite {
  id: number;
  master: string | null;
  status: string | null;
  stock: number | null;
  variants: any;
  order_deadline: string | null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "shop";

const isAvailable = (p: ProductLite) => {
  if (p.status === "Ẩn") return false;
  const notExpired = !p.order_deadline || new Date(p.order_deadline) > new Date();
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

export default function Shops() {
  const [shops, setShops] = useState<MasterShop[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [allMasters, setAllMasters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: shopRows }, { data: productRows }] = await Promise.all([
        (supabase as any).from("master_shops").select("*").eq("is_visible", true).order("sort_order"),
        supabase.from("products").select("id, master, status, stock, variants, order_deadline").not("master", "is", null).neq("master", ""),
      ]);
      setShops((shopRows as MasterShop[]) || []);
      setProducts((productRows as any) || []);
      const uniques = [...new Set(((productRows as any) || []).map((p: any) => p.master).filter(Boolean))] as string[];
      setAllMasters(uniques);
      setLoading(false);
    })();
  }, []);

  // Merge: shops with explicit row + masters without one (auto-fallback)
  const merged = useMemo(() => {
    const map = new Map<string, MasterShop>();
    shops.forEach((s) => map.set(s.master_name, s));
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
    return Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name));
  }, [shops, allMasters]);

  const countAvailable = (masterName: string) =>
    products.filter((p) => p.master === masterName && isAvailable(p)).length;

  // LỌC: Chỉ giữ lại những shop có sản phẩm thỏa mãn điều kiện isAvailable
  const filtered = merged.filter((s) => {
    const availableCount = countAvailable(s.master_name);
    const matchesSearch = !search || 
      s.display_name.toLowerCase().includes(search.toLowerCase()) || 
      s.master_name.toLowerCase().includes(search.toLowerCase());
    
    return availableCount > 0 && matchesSearch;
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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Shops</h1>
          <p className="text-muted-foreground">Khám phá sản phẩm theo từng shop / master</p>
        </div>

        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((s) => {
            const count = countAvailable(s.master_name);
            return (
              <Link
                key={s.id}
                to={`/shop/${s.slug}`}
                className="group flex flex-col items-center text-center p-4 rounded-lg bg-card border hover:shadow-md transition-shadow"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center mb-3">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.display_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Store className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-semibold line-clamp-2 break-words">{s.display_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{count} sản phẩm</p>
              </Link>
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
