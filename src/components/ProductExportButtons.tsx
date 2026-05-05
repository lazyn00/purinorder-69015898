import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Facebook, AtSign, Copy } from "lucide-react";

interface Props {
  product: {
    id: number;
    name: string;
    price: number;
    price_display?: string | null;
    description?: string | null;
    images?: any;
    category?: string | null;
    master?: string | null;
    status?: string | null;
  };
  origin?: string;
}

const buildCaption = (product: Props["product"], origin: string) => {
  const url = `${origin}/product/${product.id}`;
  const price = product.price_display || `${(product.price || 0).toLocaleString("vi-VN")}đ`;
  const lines: string[] = [];
  lines.push(`🍮 ${product.name}`);
  if (product.master) lines.push(`Shop: ${product.master}`);
  lines.push(`💰 Giá: ${price}`);
  if (product.status) lines.push(`📦 ${product.status}`);
  if (product.description) {
    const desc = product.description.split("\n").slice(0, 4).map(l => l.trim()).filter(Boolean);
    if (desc.length) {
      lines.push("");
      desc.forEach(l => lines.push(`• ${l}`));
    }
  }
  lines.push("");
  lines.push(`🛒 Đặt hàng: ${url}`);
  lines.push("");
  lines.push("#purinorder #order #merch");
  return lines.join("\n");
};

export function ProductExportButtons({ product, origin }: Props) {
  const { toast } = useToast();
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");

  const copyAndOpen = async (target: "facebook" | "threads") => {
    const caption = buildCaption(product, base);
    try {
      await navigator.clipboard.writeText(caption);
      toast({ title: "Đã copy nội dung", description: "Dán vào ô đăng bài là được" });
    } catch {
      toast({ title: "Không copy được", variant: "destructive" });
    }
    if (target === "facebook") {
      window.open(`https://www.facebook.com/`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`https://www.threads.net/`, "_blank", "noopener,noreferrer");
    }
  };

  const copyOnly = async () => {
    const caption = buildCaption(product, base);
    try {
      await navigator.clipboard.writeText(caption);
      toast({ title: "Đã copy nội dung" });
    } catch {
      toast({ title: "Không copy được", variant: "destructive" });
    }
  };

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAndOpen("facebook")} title="Xuất bài Facebook">
        <Facebook className="h-3.5 w-3.5 text-blue-600" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAndOpen("threads")} title="Xuất bài Threads">
        <AtSign className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyOnly} title="Copy nội dung">
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
