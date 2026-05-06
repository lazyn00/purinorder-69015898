import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
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

const SIZES: Record<Size, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "Vuông 1080×1080 (IG/Threads)" },
  portrait: { w: 1080, h: 1350, label: "Dọc 1080×1350 (FB/IG feed)" },
};

const cover = (p: PosterProduct) => {
  const imgs = Array.isArray(p.images) ? p.images : [];
  return imgs[0] || "";
};

export function MasterShopPosterExport({ shop, products, origin }: Props) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size>("portrait");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const cfg = SIZES[size];

  const visible = products.slice(0, 10);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shop.display_name}-${size}.png`;
      a.click();
      toast({ title: "Đã tải ảnh!" });
    } catch (e: any) {
      toast({ title: "Lỗi tạo ảnh", description: e?.message || "Có thể do CORS ảnh", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const SCALE = 0.45;

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

          <div className="flex gap-2 flex-wrap items-center">
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
            Hiển thị {Math.min(visible.length, 10)} / {products.length} sản phẩm (tối đa 10)
          </p>

          {/* Preview scaled */}
          <div className="border rounded overflow-hidden bg-muted/30 flex justify-center p-2">
            <div style={{ width: cfg.w * SCALE, height: cfg.h * SCALE, overflow: "hidden", position: "relative" }}>
              <div style={{ transform: `scale(${SCALE})`, transformOrigin: "top left", position: "absolute" }}>
                <PosterCanvas innerRef={ref} shop={shop} products={visible} base={base} cfg={cfg} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PosterCanvas({
  innerRef, shop, products, base, cfg,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  shop: Shop;
  products: PosterProduct[];
  base: string;
  cfg: { w: number; h: number };
}) {
  const domain = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const isPortrait = cfg.h > cfg.w;

  // Layout: 5 cột × 2 hàng = 10 sản phẩm
  const COLS = 5;
  const ROWS = 2;
  const PAD = 48;
  const HEADER_H = isPortrait ? 200 : 160;
  const FOOTER_H = 70;
  const GAP = 16;
  const gridW = cfg.w - PAD * 2;
  const gridH = cfg.h - PAD * 2 - HEADER_H - FOOTER_H;
  const cellW = (gridW - GAP * (COLS - 1)) / COLS;
  const cellH = (gridH - GAP * (ROWS - 1)) / ROWS;
  const imgSize = cellW; // ảnh vuông

  return (
    <div
      ref={innerRef}
      style={{
        width: cfg.w,
        height: cfg.h,
        background: "linear-gradient(160deg, #fff5f9 0%, #fffdf5 60%, #f5f0ff 100%)",
        fontFamily: "'Quicksand', 'Inter', system-ui, sans-serif",
        color: "#1a1a1a",
        padding: PAD,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(249,168,212,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -60, left: -60,
        width: 250, height: 250, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(196,181,253,0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, zIndex: 1 }}>
        {/* Avatar */}
        <div style={{
          width: isPortrait ? 110 : 90,
          height: isPortrait ? 110 : 90,
          borderRadius: "50%",
          overflow: "hidden",
          background: "linear-gradient(135deg, #f9a8d4, #fde68a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          border: "3px solid #fff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}>
          {shop.avatar_url
            ? <img src={shop.avatar_url} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ fontSize: isPortrait ? 44 : 36 }}>🛍️</div>
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isPortrait ? 42 : 34,
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 6,
            color: "#1a1a1a",
          }}>{shop.display_name}</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(249,168,212,0.25)",
            borderRadius: 999,
            padding: "4px 16px",
          }}>
            <span style={{ fontSize: 20, color: "#be185d", fontWeight: 600 }}>
              🍮 {products.length} sản phẩm đang order
            </span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, ${cellW}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${cellH}px)`,
        gap: GAP,
        flex: 1,
        zIndex: 1,
      }}>
        {Array.from({ length: COLS * ROWS }).map((_, idx) => {
          const p = products[idx];
          if (!p) {
            return (
              <div key={idx} style={{
                borderRadius: 14,
                background: "rgba(0,0,0,0.03)",
                border: "2px dashed rgba(0,0,0,0.08)",
              }} />
            );
          }
          const img = cover(p);
          const price = p.price_display || `${(p.price || 0).toLocaleString("vi-VN")}đ`;
          const textH = cellH - imgSize - 8;

          return (
            <div key={p.id} style={{
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
            }}>
              {/* Ảnh */}
              <div style={{ width: cellW, height: imgSize, flexShrink: 0, background: "#f5f5f5", overflow: "hidden" }}>
                {img
                  ? <img src={img} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
                }
              </div>
              {/* Info */}
              <div style={{ padding: "6px 8px", height: textH, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{
                  fontSize: Math.max(13, cellW * 0.085),
                  fontWeight: 600,
                  lineHeight: 1.25,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  color: "#1a1a1a",
                }}>{p.name}</div>
                <div style={{
                  fontSize: Math.max(13, cellW * 0.09),
                  fontWeight: 800,
                  color: "#e11d48",
                  marginTop: 2,
                }}>{price}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 20,
        paddingTop: 14,
        borderTop: "1.5px solid rgba(0,0,0,0.07)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1,
      }}>
        <div style={{ fontSize: 20, color: "#9ca3af" }}>Order ngay tại</div>
        <div style={{
          fontSize: 22, fontWeight: 700,
          background: "linear-gradient(90deg, #e11d48, #be185d)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>{domain || "purinorder.vercel.app"}</div>
      </div>
    </div>
  );
}
