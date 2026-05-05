import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Image as ImageIcon, Loader2, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Shop {
  display_name: string;
  avatar_url?: string | null;
  shop_link?: string | null;
}

interface PosterProduct {
  id: number;
  name: string;
  price: number;
  price_display?: string | null;
  images?: any;
  status?: string | null;
}

interface Props {
  shop: Shop;
  products: PosterProduct[];
  origin?: string;
}

type Size = "square" | "portrait";

const SIZES: Record<Size, { w: number; h: number; cols: number; max: number; label: string }> = {
  square: { w: 1080, h: 1080, cols: 2, max: 4, label: "Vuông 1080×1080 (IG/Threads)" },
  portrait: { w: 1080, h: 1350, cols: 2, max: 6, label: "Dọc 1080×1350 (FB/IG feed)" },
};

const cover = (p: PosterProduct) => {
  const imgs = Array.isArray(p.images) ? p.images : [];
  return imgs[0] || "";
};

export function MasterShopPosterExport({ shop, products, origin }: Props) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size>("square");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const cfg = SIZES[size];

  const visible = products.slice(0, cfg.max);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: 1,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shop.display_name}-${size}.png`;
      a.click();
      toast({ title: "Đã tải ảnh" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Lỗi tạo ảnh", description: e?.message || "Có thể do CORS ảnh", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
        <ImageIcon className="h-4 w-4" /> Xuất ảnh shop
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xuất ảnh shop để đăng bài</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 flex-wrap">
            {(Object.keys(SIZES) as Size[]).map(s => (
              <Button key={s} size="sm" variant={size === s ? "default" : "outline"} onClick={() => setSize(s)}>
                {SIZES[s].label}
              </Button>
            ))}
            <Button size="sm" onClick={download} disabled={busy} className="gap-1 ml-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Tải ảnh
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Hiển thị tối đa {cfg.max} sản phẩm. Có {products.length} sản phẩm trong shop.
          </p>

          {/* Preview - scaled */}
          <div className="border rounded overflow-hidden bg-muted/30 p-2 flex justify-center">
            <div style={{ width: cfg.w / 2, height: cfg.h / 2, overflow: "hidden" }}>
              <div style={{ transform: "scale(0.5)", transformOrigin: "top left" }}>
                <PosterCanvas innerRef={ref} shop={shop} products={visible} base={base} size={size} cfg={cfg} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PosterCanvas({
  innerRef, shop, products, base, size, cfg,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  shop: Shop;
  products: PosterProduct[];
  base: string;
  size: Size;
  cfg: { w: number; h: number; cols: number; max: number };
}) {
  const domain = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div
      ref={innerRef}
      style={{
        width: cfg.w,
        height: cfg.h,
        background: "linear-gradient(135deg, #fff5f7 0%, #fff 50%, #f0f9ff 100%)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "#1a1a1a",
        padding: 60,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
        <div style={{
          width: 120, height: 120, borderRadius: 60, overflow: "hidden",
          background: "#f3e8ee", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, border: "4px solid #fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          {shop.avatar_url ? (
            <img src={shop.avatar_url} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ fontSize: 48 }}>🛍️</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, color: "#9ca3af", fontWeight: 500, marginBottom: 4 }}>🍮 Purin Order</div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 6 }}>{shop.display_name}</div>
          <div style={{ fontSize: 22, color: "#6b7280" }}>{products.length} sản phẩm đang order</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`,
        gap: 24,
        flex: 1,
      }}>
        {products.map(p => {
          const img = cover(p);
          const price = p.price_display || `${(p.price || 0).toLocaleString("vi-VN")}đ`;
          return (
            <div key={p.id} style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{ width: "100%", aspectRatio: "1 / 1", background: "#f5f5f5", overflow: "hidden" }}>
                {img && <img src={img} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{
                  fontSize: 22, fontWeight: 600, lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{p.name}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#e11d48", marginTop: 8 }}>{price}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 30, paddingTop: 20, borderTop: "2px solid rgba(0,0,0,0.08)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: 22, color: "#6b7280" }}>Đặt hàng tại</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#e11d48" }}>{domain || "purinorder.com"}</div>
      </div>
    </div>
  );
}
