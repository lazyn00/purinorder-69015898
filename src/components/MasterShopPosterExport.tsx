import { useState, useRef } from "react";
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
  square:  { w: 1080, h: 1080, label: "Vuông 1080×1080" },
  portrait:{ w: 1080, h: 1350, label: "Dọc 1080×1350" },
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
        // last line — truncate with ellipsis
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

export function MasterShopPosterExport({ shop, products, origin }: Props) {
  const [open, setOpen]   = useState(false);
  const [size, setSize]   = useState<Size>("portrait");
  const [busy, setBusy]   = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");

  const buildCanvas = async (cfg: { w: number; h: number }): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    canvas.width  = cfg.w;
    canvas.height = cfg.h;
    const ctx = canvas.getContext("2d")!;

    const PAD   = 50;
    const COLS  = 5;
    const ROWS  = 2;
    const GAP   = 18;
    const HEADER_H = cfg.h > cfg.w ? 195 : 155;
    const FOOTER_H = 80;
    const GRID_W = cfg.w - PAD * 2;
    const GRID_H = cfg.h - PAD * 2 - HEADER_H - FOOTER_H;
    const CELL_W = Math.floor((GRID_W - GAP * (COLS - 1)) / COLS);
    const CELL_H = Math.floor((GRID_H - GAP * (ROWS - 1)) / ROWS);
    const IMG_H  = Math.floor(CELL_H * 0.62);
    const R      = 14; // border radius

    // ── Background gradient ──
    const bg = ctx.createLinearGradient(0, 0, cfg.w, cfg.h);
    bg.addColorStop(0,   "#fff5f9");
    bg.addColorStop(0.5, "#fffdf5");
    bg.addColorStop(1,   "#f5f0ff");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cfg.w, cfg.h);

    // decorative circle top-right
    const gc1 = ctx.createRadialGradient(cfg.w - 60, 60, 0, cfg.w - 60, 60, 220);
    gc1.addColorStop(0, "rgba(249,168,212,0.30)");
    gc1.addColorStop(1, "transparent");
    ctx.fillStyle = gc1;
    ctx.fillRect(0, 0, cfg.w, cfg.h);

    // ── Header ──
    // Avatar circle
    const AVA = HEADER_H - 30;
    const avatarX = PAD + AVA / 2;
    const avatarY = PAD + AVA / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, AVA / 2, 0, Math.PI * 2);
    ctx.clip();
    const avatarImg = await loadImage(shop.avatar_url || "");
    if (avatarImg) {
      ctx.drawImage(avatarImg, PAD, PAD, AVA, AVA);
    } else {
      const ag = ctx.createLinearGradient(PAD, PAD, PAD + AVA, PAD + AVA);
      ag.addColorStop(0, "#f9a8d4");
      ag.addColorStop(1, "#fde68a");
      ctx.fillStyle = ag;
      ctx.fillRect(PAD, PAD, AVA, AVA);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.floor(AVA * 0.4)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🛍️", avatarX, avatarY);
    }
    ctx.restore();

    // Avatar border
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, AVA / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Shop name
    const textX = PAD + AVA + 24;
    ctx.fillStyle = "#1a1a1a";
    const nameFontSize = cfg.h > cfg.w ? 52 : 42;
    ctx.font = `800 ${nameFontSize}px 'Quicksand', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    wrapText(ctx, shop.display_name, textX, PAD + 6, cfg.w - textX - PAD, nameFontSize * 1.2, 2);

    // Badge
    const badgeY = PAD + nameFontSize * 1.2 * 2 + 14;
    const badgeText = `🍮  ${products.length} sản phẩm đang order`;
    ctx.font = `600 22px sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + 32;
    ctx.fillStyle = "rgba(249,168,212,0.28)";
    roundRect(ctx, textX, badgeY, badgeW, 38, 999);
    ctx.fill();
    ctx.fillStyle = "#be185d";
    ctx.font = `600 22px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, textX + 16, badgeY + 19);

    // ── Product grid ──
    const gridTop = PAD + HEADER_H;
    const priceColor = "#e11d48";

    // load all images in parallel
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

        // Card shadow
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur  = 14;
        ctx.shadowOffsetY = 3;

        // Card background
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, cx, cy, CELL_W, CELL_H, R);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur  = 0;
        ctx.shadowOffsetY = 0;

        if (idx >= items.length) continue; // empty slot styled
        const p   = items[idx];
        const img = imgEls[idx];

        // Product image (clipped to rounded top)
        ctx.save();
        roundRectTop(ctx, cx, cy, CELL_W, IMG_H, R);
        ctx.clip();
        if (img) {
          // object-fit: cover
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

        // Product name
        const textPad = 8;
        const nameY   = cy + IMG_H + textPad + 2;
        const fontSize = Math.max(13, Math.floor(CELL_W * 0.1));
        ctx.fillStyle = "#1a1a1a";
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        wrapText(ctx, p.name, cx + textPad, nameY, CELL_W - textPad * 2, fontSize * 1.3, 2);

        // Price
        const price = p.price_display || `${(p.price || 0).toLocaleString("vi-VN")}đ`;
        const priceY = cy + CELL_H - Math.floor(CELL_H * 0.16);
        const priceFontSize = Math.max(13, Math.floor(CELL_W * 0.105));
        ctx.fillStyle = priceColor;
        ctx.font = `800 ${priceFontSize}px sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.fillText(price, cx + textPad, priceY);
      }
    }

    // ── Footer ──
    const footerY = cfg.h - PAD - FOOTER_H + 10;
    ctx.beginPath();
    ctx.moveTo(PAD, footerY);
    ctx.lineTo(cfg.w - PAD, footerY);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const domain = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
    ctx.fillStyle = "#9ca3af";
    ctx.font = `400 22px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Order ngay tại", PAD, footerY + FOOTER_H / 2);

    ctx.font = `700 26px sans-serif`;
    ctx.fillStyle = "#e11d48";
    ctx.textAlign = "right";
    ctx.fillText(domain || "purinorder.vercel.app", cfg.w - PAD, footerY + FOOTER_H / 2);

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
            Hiển thị {Math.min(products.length, 10)} / {products.length} sản phẩm (tối đa 10)
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

// helpers
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
