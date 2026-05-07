import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tenant } from "@/config/tenant";

interface Shop {
  display_name: string;
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
  square:  { w: 1080, h: 1080, label: "Vuông 1080×1080" },
  portrait:{ w: 1080, h: 1350, label: "Dọc 1080×1350" },
};

// HSL string "270 55% 70%" → "hsl(270, 55%, 70%)"
const hslToCss = (v: string, alpha?: number) => {
  if (!v) return "#fff";
  const parts = v.trim().split(/\s+/);
  if (parts.length < 3) return v;
  const [h, s, l] = parts;
  if (alpha !== undefined) return `hsla(${h}, ${s}, ${l}, ${alpha})`;
  return `hsl(${h}, ${s}, ${l})`;
};

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines: number
) => {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      if (lineCount >= maxLines - 1) {
        while (ctx.measureText(line + "…").width > maxW && line.length > 0)
          line = line.slice(0, -1);
        ctx.fillText(line + "…", x, y + lineCount * lineH);
        return;
      }
      ctx.fillText(line, x, y + lineCount * lineH);
      line = word;
      lineCount++;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y + lineCount * lineH);
};

// Per-tenant theme cho poster
const getTheme = () => {
  const isPurin = tenant.shopId === "purin";
  if (isPurin) {
    return {
      bg1: "#fff5f9",
      bg2: "#fffdf5",
      bg3: "#f5f0ff",
      decor: "rgba(249,168,212,0.30)",
      title: "#8b1a4b",
      titleFont: "'Quicksand', 'Nunito', sans-serif",
      bodyFont: "'Nunito', sans-serif",
      price: "#e11d48",
      footerLabel: "#a37b8c",
      footerDomain: "#e11d48",
      cardBg: "#ffffff",
      emoji: tenant.emoji || "🍮",
      tagline: "Order ngay tại",
    };
  }
  // tiệm nhà cá - tím pastel
  return {
    bg1: "#f6f0fa",
    bg2: "#f9f5fc",
    bg3: "#ece4f7",
    decor: "rgba(196,167,231,0.35)",
    title: "#3f2566",
    titleFont: "'Quicksand', 'Nunito', sans-serif",
    bodyFont: "'Nunito', sans-serif",
    price: "#7a3fb8",
    footerLabel: "#9b87b8",
    footerDomain: "#7a3fb8",
    cardBg: "#ffffff",
    emoji: tenant.emoji || "🐡",
    tagline: "Order tại",
  };
};

export function MasterShopPosterExport({ shop, products, origin }: Props) {
  const [open, setOpen]   = useState(false);
  const [size, setSize]   = useState<Size>("portrait");
  const [busy, setBusy]   = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");

  const buildCanvas = async (cfg: { w: number; h: number }): Promise<HTMLCanvasElement> => {
    const theme = getTheme();
    const canvas = document.createElement("canvas");
    canvas.width  = cfg.w;
    canvas.height = cfg.h;
    const ctx = canvas.getContext("2d")!;

    const PAD   = 50;
    const COLS  = 5;
    const ROWS  = 2;
    const GAP   = 18;
    const HEADER_H = cfg.h > cfg.w ? 140 : 110;
    const FOOTER_H = 80;
    const GRID_W = cfg.w - PAD * 2;
    const GRID_H = cfg.h - PAD * 2 - HEADER_H - FOOTER_H;
    const CELL_W = Math.floor((GRID_W - GAP * (COLS - 1)) / COLS);
    const CELL_H = Math.floor((GRID_H - GAP * (ROWS - 1)) / ROWS);
    const IMG_H  = Math.floor(CELL_H * 0.62);
    const R      = 14;

    // Background gradient theo theme
    const bg = ctx.createLinearGradient(0, 0, cfg.w, cfg.h);
    bg.addColorStop(0,   theme.bg1);
    bg.addColorStop(0.5, theme.bg2);
    bg.addColorStop(1,   theme.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cfg.w, cfg.h);

    // Decorative blobs
    const gc1 = ctx.createRadialGradient(cfg.w - 60, 60, 0, cfg.w - 60, 60, 280);
    gc1.addColorStop(0, theme.decor);
    gc1.addColorStop(1, "transparent");
    ctx.fillStyle = gc1;
    ctx.fillRect(0, 0, cfg.w, cfg.h);

    const gc2 = ctx.createRadialGradient(80, cfg.h - 80, 0, 80, cfg.h - 80, 220);
    gc2.addColorStop(0, theme.decor);
    gc2.addColorStop(1, "transparent");
    ctx.fillStyle = gc2;
    ctx.fillRect(0, 0, cfg.w, cfg.h);

    // Header: chỉ shop name + emoji, KHÔNG avatar/master/badge SL
    ctx.fillStyle = theme.title;
    const titleSize = cfg.h > cfg.w ? 64 : 54;
    ctx.font = `800 ${titleSize}px ${theme.titleFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const title = `${theme.emoji}  ${shop.display_name}`;
    wrapText(ctx, title, PAD, PAD + 8, cfg.w - PAD * 2, titleSize * 1.15, 1);

    // Product grid
    const gridTop = PAD + HEADER_H;
    const items = products.slice(0, COLS * ROWS);
    const imgEls = await Promise.all(items.map(p => {
      const imgs = Array.isArray(p.images) ? p.images : [];
      return loadImage(imgs[0] || "");
    }));

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const cx = PAD + col * (CELL_W + GAP);
        const cy = gridTop + row * (CELL_H + GAP);

        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur  = 14;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = theme.cardBg;
        roundRect(ctx, cx, cy, CELL_W, CELL_H, R);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur  = 0;
        ctx.shadowOffsetY = 0;

        if (idx >= items.length) continue;
        const p   = items[idx];
        const img = imgEls[idx];

        ctx.save();
        roundRectTop(ctx, cx, cy, CELL_W, IMG_H, R);
        ctx.clip();
        if (img) {
          const scale = Math.max(CELL_W / img.width, IMG_H / img.height);
          const sw = CELL_W / scale, sh = IMG_H / scale;
          const sx = (img.width  - sw) / 2;
          const sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, cx, cy, CELL_W, IMG_H);
        } else {
          ctx.fillStyle = "#f3f3f3";
          ctx.fillRect(cx, cy, CELL_W, IMG_H);
          ctx.fillStyle = "#ccc";
          ctx.font = `${Math.floor(IMG_H * 0.35)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("📦", cx + CELL_W / 2, cy + IMG_H / 2);
        }
        ctx.restore();

        const textPad = 8;
        const nameY   = cy + IMG_H + textPad + 2;
        const fontSize = Math.max(13, Math.floor(CELL_W * 0.1));
        ctx.fillStyle = "#1a1a1a";
        ctx.font = `600 ${fontSize}px ${theme.bodyFont}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        wrapText(ctx, p.name, cx + textPad, nameY, CELL_W - textPad * 2, fontSize * 1.3, 2);

        const price = p.price_display || `${(p.price || 0).toLocaleString("vi-VN")}đ`;
        const priceY = cy + CELL_H - Math.floor(CELL_H * 0.16);
        const priceFontSize = Math.max(13, Math.floor(CELL_W * 0.105));
        ctx.fillStyle = theme.price;
        ctx.font = `800 ${priceFontSize}px ${theme.bodyFont}`;
        ctx.textBaseline = "bottom";
        ctx.fillText(price, cx + textPad, priceY);
      }
    }

    // Footer
    const footerY = cfg.h - PAD - FOOTER_H + 10;
    ctx.beginPath();
    ctx.moveTo(PAD, footerY);
    ctx.lineTo(cfg.w - PAD, footerY);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const domain = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
    ctx.fillStyle = theme.footerLabel;
    ctx.font = `400 22px ${theme.bodyFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.tagline, PAD, footerY + FOOTER_H / 2);

    ctx.font = `700 26px ${theme.bodyFont}`;
    ctx.fillStyle = theme.footerDomain;
    ctx.textAlign = "right";
    ctx.fillText(domain || tenant.shopId, cfg.w - PAD, footerY + FOOTER_H / 2);

    return canvas;
  };

  const generatePreview = async () => {
    setBusy(true);
    try {
      const cfg = SIZES[size];
      const canvas = await buildCanvas(cfg);
      setPreview(canvas.toDataURL("image/png"));
    } catch (e: any) {
      toast({ title: "Lỗi tạo preview", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const cfg = SIZES[size];
      const canvas = await buildCanvas(cfg);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shop.display_name}-${size}.png`;
      a.click();
      toast({ title: "Đã tải ảnh!" });
    } catch (e: any) {
      toast({ title: "Lỗi tạo ảnh", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); setPreview(null); }} className="gap-1">
        <ImageIcon className="h-4 w-4" /> Xuất ảnh shop
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xuất ảnh shop để đăng bài</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 flex-wrap items-center">
            {(Object.keys(SIZES) as Size[]).map(s => (
              <Button key={s} size="sm" variant={size === s ? "default" : "outline"}
                onClick={() => { setSize(s); setPreview(null); }}>
                {SIZES[s].label}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={generatePreview} disabled={busy} className="gap-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              Preview
            </Button>
            <Button size="sm" onClick={download} disabled={busy} className="gap-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Tải ảnh
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Hiển thị tối đa 10 sản phẩm còn order được. Nếu ảnh sản phẩm không hiển thị, kiểm tra CORS trên R2 (cho phép domain web hiện tại).
          </p>

          {preview && (
            <div className="border rounded overflow-hidden">
              <img src={preview} alt="preview" className="w-full h-auto" />
            </div>
          )}
          {!preview && (
            <div className="border rounded bg-muted/30 flex items-center justify-center h-48 text-muted-foreground text-sm">
              Bấm Preview để xem trước
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
