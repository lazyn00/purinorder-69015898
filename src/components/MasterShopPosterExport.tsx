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

const getTheme = () => {
  const isPurin = tenant.shopId === "purin";
  if (isPurin) {
    return {
      // Nền kem hồng vintage
      bgTop: "#fdf6f0",
      bgBottom: "#fce8ef",
      // Texture dots color
      dotColor: "rgba(233,150,175,0.18)",
      // Header
      headerAccent: "#e8b4c8",    // dải màu header
      shopNameColor: "#c0426e",   // tên shop
      taglineColor: "#b07088",
      // Cards
      cardBg: "#ffffff",
      cardShadow: "rgba(192,66,110,0.10)",
      cardBorder: "rgba(232,180,200,0.6)",
      imgOverlay: "rgba(253,246,240,0.08)",
      // Text
      nameColor: "#3d1a28",
      priceColor: "#c0426e",
      // Divider & footer
      dividerColor: "rgba(192,66,110,0.20)",
      footerBg: "#f9e8f0",
      footerText: "#b07088",
      footerDomain: "#c0426e",
      // Decorations
      star1: "#f9a8d4",
      star2: "#fcd5e5",
      ribbonColor: "rgba(232,180,200,0.55)",
      emoji: tenant.emoji || "🍮",
      tagline: "order tại",
    };
  }
  // Tiệm nhà cá — tím lavender editorial
  return {
    bgTop: "#f4eff9",
    bgBottom: "#ede4f5",
    dotColor: "rgba(160,120,210,0.15)",
    headerAccent: "#c9a8e8",
    shopNameColor: "#5b2d8e",
    taglineColor: "#8a6aaa",
    cardBg: "#ffffff",
    cardShadow: "rgba(91,45,142,0.10)",
    cardBorder: "rgba(196,160,232,0.6)",
    imgOverlay: "rgba(244,239,249,0.08)",
    nameColor: "#1e0d33",
    priceColor: "#7a3fb8",
    dividerColor: "rgba(91,45,142,0.18)",
    footerBg: "#ede4f5",
    footerText: "#8a6aaa",
    footerDomain: "#7a3fb8",
    star1: "#c9a8e8",
    star2: "#e4d4f7",
    ribbonColor: "rgba(196,160,232,0.50)",
    emoji: tenant.emoji || "🐡",
    tagline: "order tại",
  };
};

// Draw a soft ribbon/bow shape decoration
const drawRibbon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  // left loop
  ctx.beginPath();
  ctx.ellipse(-size * 0.7, 0, size * 0.65, size * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // right loop
  ctx.beginPath();
  ctx.ellipse(size * 0.7, 0, size * 0.65, size * 0.32, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // center knot
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.22, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Draw sparkle/star
const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.15;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * size * 0.2, y + Math.sin(angle) * size * 0.2);
    ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.stroke();
  }
  ctx.restore();
};

// Draw dotted texture pattern
const drawDots = (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => {
  ctx.save();
  ctx.fillStyle = color;
  const spacing = 36;
  for (let xi = 0; xi < w; xi += spacing) {
    for (let yi = 0; yi < h; yi += spacing) {
      ctx.beginPath();
      ctx.arc(xi, yi, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};

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

    const isPortrait = cfg.h > cfg.w;
    const PAD    = 48;
    const COLS   = 5;
    const ROWS   = 2;
    const GAP    = 14;

    // ── Background gradient ──
    const bg = ctx.createLinearGradient(0, 0, cfg.w * 0.4, cfg.h);
    bg.addColorStop(0,   theme.bgTop);
    bg.addColorStop(1,   theme.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cfg.w, cfg.h);

    // Dot texture
    drawDots(ctx, cfg.w, cfg.h, theme.dotColor);

    // ── Decorative ribbon top-right ──
    drawRibbon(ctx, cfg.w - 90, 72, 52, theme.ribbonColor);

    // ── Small sparkles ──
    drawStar(ctx, cfg.w - 180, 48, 16, theme.star1, 0.8);
    drawStar(ctx, 60, cfg.h - 110, 12, theme.star1, 0.6);
    drawStar(ctx, cfg.w - 55, 180, 9, theme.star2, 0.7);
    drawStar(ctx, 90, 90, 10, theme.star2, 0.5);

    // ── Header accent bar (thin colored stripe) ──
    ctx.save();
    ctx.fillStyle = theme.headerAccent;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.roundRect(PAD, PAD - 10, cfg.w - PAD * 2, 6, 3);
    ctx.fill();
    ctx.restore();

    // ── Shop name ──
    const HEADER_H = isPortrait ? 120 : 100;
    const titleSize = isPortrait ? 58 : 50;

    // Emoji small
    ctx.font = `${Math.floor(titleSize * 0.65)}px serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(theme.emoji, PAD, PAD + 10);

    // Shop name — serif bold
    ctx.fillStyle = theme.shopNameColor;
    ctx.font = `800 ${titleSize}px Georgia, 'Times New Roman', serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const nameX = PAD + titleSize * 0.75;
    wrapText(ctx, shop.display_name, nameX, PAD + 8, cfg.w - nameX - PAD - 130, titleSize * 1.15, 1);

    // Tagline / subtitle — light italic
    ctx.fillStyle = theme.taglineColor;
    ctx.font = `italic 300 22px Georgia, serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("✦  new arrivals & pre-order  ✦", PAD, PAD + titleSize * 1.2 + 6);

    // ── Thin divider below header ──
    const divY = PAD + HEADER_H - 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(PAD, divY);
    ctx.lineTo(cfg.w - PAD, divY);
    ctx.strokeStyle = theme.dividerColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── Product grid ──
    const FOOTER_H    = 70;
    const GRID_TOP    = PAD + HEADER_H;
    const GRID_W      = cfg.w - PAD * 2;
    const GRID_H      = cfg.h - GRID_TOP - PAD - FOOTER_H - 12;
    const CELL_W      = Math.floor((GRID_W - GAP * (COLS - 1)) / COLS);
    const CELL_H      = Math.floor((GRID_H - GAP * (ROWS - 1)) / ROWS);
    const IMG_RATIO   = 0.60;
    const IMG_H       = Math.floor(CELL_H * IMG_RATIO);
    const R           = 12;
    const TEXT_PAD    = 7;

    const items = products.slice(0, COLS * ROWS);
    const imgEls = await Promise.all(items.map(p => {
      const imgs = Array.isArray(p.images) ? p.images : [];
      return loadImage(imgs[0] || "");
    }));

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const cx = PAD + col * (CELL_W + GAP);
        const cy = GRID_TOP + row * (CELL_H + GAP);

        // Card shadow
        ctx.save();
        ctx.shadowColor = theme.cardShadow;
        ctx.shadowBlur  = 16;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = theme.cardBg;
        roundRect(ctx, cx, cy, CELL_W, CELL_H, R);
        ctx.fill();
        ctx.restore();

        // Card border
        ctx.save();
        ctx.strokeStyle = theme.cardBorder;
        ctx.lineWidth = 1;
        roundRect(ctx, cx, cy, CELL_W, CELL_H, R);
        ctx.stroke();
        ctx.restore();

        if (idx >= items.length) continue;
        const p   = items[idx];
        const img = imgEls[idx];

        // Image area
        ctx.save();
        roundRectTop(ctx, cx, cy, CELL_W, IMG_H, R);
        ctx.clip();
        if (img) {
          const scale = Math.max(CELL_W / img.width, IMG_H / img.height);
          const sw = CELL_W / scale, sh = IMG_H / scale;
          const sx = (img.width  - sw) / 2;
          const sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, cx, cy, CELL_W, IMG_H);
          // Subtle vignette overlay on image
          const vg = ctx.createLinearGradient(cx, cy + IMG_H * 0.6, cx, cy + IMG_H);
          vg.addColorStop(0, "transparent");
          vg.addColorStop(1, "rgba(0,0,0,0.12)");
          ctx.fillStyle = vg;
          ctx.fillRect(cx, cy, CELL_W, IMG_H);
        } else {
          ctx.fillStyle = "#f0eef5";
          ctx.fillRect(cx, cy, CELL_W, IMG_H);
          ctx.fillStyle = "#c8b8e0";
          ctx.font = `${Math.floor(IMG_H * 0.3)}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🛍", cx + CELL_W / 2, cy + IMG_H / 2);
        }
        ctx.restore();

        // Status badge (nếu có)
        if (p.status) {
          const badgeW = CELL_W * 0.52;
          const badgeH = 18;
          const badgeX = cx + TEXT_PAD;
          const badgeY = cy + IMG_H - badgeH - 6;
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 5);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = `600 11px sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(p.status, badgeX + 5, badgeY + badgeH / 2);
          ctx.restore();
        }

        // Product name
        const nameY    = cy + IMG_H + TEXT_PAD + 3;
        const fontSize = Math.max(11, Math.floor(CELL_W * 0.093));
        ctx.fillStyle  = theme.nameColor;
        ctx.font       = `600 ${fontSize}px 'Nunito', sans-serif`;
        ctx.textAlign  = "left";
        ctx.textBaseline = "top";
        wrapText(ctx, p.name, cx + TEXT_PAD, nameY, CELL_W - TEXT_PAD * 2, fontSize * 1.28, 2);

        // Price
        const priceY       = cy + CELL_H - Math.floor(CELL_H * 0.155);
        const priceFontSize = Math.max(12, Math.floor(CELL_W * 0.098));
        ctx.fillStyle      = theme.priceColor;
        ctx.font           = `800 ${priceFontSize}px 'Nunito', sans-serif`;
        ctx.textBaseline   = "bottom";
        const price = p.price_display || `${(p.price || 0).toLocaleString("vi-VN")}đ`;
        ctx.fillText(price, cx + TEXT_PAD, priceY);
      }
    }

    // ── Footer ──
    const footerY = cfg.h - PAD - FOOTER_H + 8;

    // Footer bg pill
    ctx.save();
    ctx.fillStyle = theme.footerBg;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.roundRect(PAD, footerY - 6, cfg.w - PAD * 2, FOOTER_H - 4, 10);
    ctx.fill();
    ctx.restore();

    // Dashed divider above footer
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(PAD, footerY - 8);
    ctx.lineTo(cfg.w - PAD, footerY - 8);
    ctx.strokeStyle = theme.dividerColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const domain = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const midY = footerY + (FOOTER_H - 4) / 2 + 2;

    ctx.fillStyle = theme.footerText;
    ctx.font = `300 italic 20px Georgia, serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.tagline, PAD + 14, midY);

    ctx.font = `700 24px Georgia, serif`;
    ctx.fillStyle = theme.footerDomain;
    ctx.textAlign = "right";
    ctx.fillText(domain || tenant.shopId, cfg.w - PAD - 14, midY);

    // Decorative bow in footer center
    drawRibbon(ctx, cfg.w / 2, midY, 18, theme.ribbonColor);

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
            <DialogTitle>Xuất ảnh shop để đăng Instagram</DialogTitle>
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
