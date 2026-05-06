import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Facebook, AtSign } from "lucide-react";

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
    size?: string | null;
    includes?: string | null;
    order_deadline?: string | null;
    fees_included?: boolean | null;
    deposit_allowed?: boolean | null;
    production_time?: string | null;
  };
  origin?: string;
}

const formatPriceShort = (price: number) => {
  if (price >= 1000) {
    const k = price / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toString().replace('.', ',')}k`;
  }
  return `${price}`;
};

const formatPriceVND = (price: number) =>
  price.toLocaleString("vi-VN") + " VND";

const formatDeadline = (iso?: string | null) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit", minute: "2-digit",
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => fmt.find(p => p.type === t)?.value || "";
    return `${get("hour")}:${get("minute")} ${get("day")}/${get("month")}/${get("year")}`;
  } catch { return null; }
};

// ff = full phí (fees_included = true), cff = chưa full phí (fees_included = false)
const getFeeLabel = (fees_included?: boolean | null) => {
  if (fees_included === true) return "ff";
  if (fees_included === false) return "cff";
  return "";
};

const buildFacebookCaption = (p: Props["product"], origin: string) => {
  const url = `${origin}/product/${p.id}`;
  const fee = getFeeLabel(p.fees_included);
  const lines: string[] = [];
  lines.push(`[order] ${p.name} 💛 🍮`);
  lines.push("");
  lines.push(`🍮 Link order: ${url}`);
  if (p.master) lines.push(`Master: ${p.master}`);
  if (p.size) lines.push(`Kích thước: ${p.size}`);
  lines.push(`Giá: ${formatPriceShort(p.price)}${fee ? ` ${fee}` : ""}`);
  if (p.includes) lines.push(`Bao gồm: ${p.includes}`);
  lines.push("");
  lines.push("Order ngay tại link hoặc ib Purin hỗ trợ nhaa 💖");
  return lines.join("\n");
};

const buildThreadsCaption = (p: Props["product"], origin: string) => {
  const url = `${origin}/product/${p.id}`;
  const fee = getFeeLabel(p.fees_included);
  const lines: string[] = [];
  lines.push(`${p.name} 🦋`);
  lines.push("");
  lines.push(`🏷️ ${formatPriceVND(p.price)}${fee ? ` (${fee})` : ""}`);
  const dl = formatDeadline(p.order_deadline);
  if (dl) lines.push(`🔚 Deadline: ${dl}`);
  const notes: string[] = [];
  if (p.production_time) notes.push(`Sản xuất ${p.production_time}`);
  notes.push("only ck");
  if (p.deposit_allowed) notes.push("có cọc 50%");
  lines.push(`❗️${notes.join(", ")}`);
  lines.push("");
  lines.push(`Order now: ${url}`);
  return lines.join("\n");
};

export function ProductExportButtons({ product, origin }: Props) {
  const { toast } = useToast();
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");

  const copyCaption = async (target: "facebook" | "threads") => {
    const caption = target === "facebook"
      ? buildFacebookCaption(product, base)
      : buildThreadsCaption(product, base);
    try {
      await navigator.clipboard.writeText(caption);
      toast({ title: `Đã copy mẫu ${target === "facebook" ? "Facebook 📘" : "Threads 🧵"}`, description: "Dán vào ô đăng bài là được!" });
    } catch {
      toast({ title: "Không copy được", variant: "destructive" });
    }
  };

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCaption("facebook")} title="Copy mẫu Facebook">
        <Facebook className="h-3.5 w-3.5 text-blue-600" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCaption("threads")} title="Copy mẫu Threads">
        <AtSign className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
