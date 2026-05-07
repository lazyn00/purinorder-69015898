import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Truck } from "lucide-react";

interface Props {
  masterName: string;
  className?: string;
}

const ACTIVE_PROGRESS = [
  "Đang xử lý",
];

const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

export function MasterShippingProgress({ masterName, className }: Props) {
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [orderedQty, setOrderedQty] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // 1. shop info
      const { data: shop } = await (supabase as any)
        .from("master_shops")
        .select("shipping_fee_total")
        .eq("master_name", masterName)
        .maybeSingle();
      const ship = Number(shop?.shipping_fee_total || 0);

      // 2. count items in active orders that match this master
      const { data: orders } = await (supabase as any)
        .from("orders")
        .select("items, order_progress")
        .in("order_progress", ACTIVE_PROGRESS);

      let qty = 0;
      (orders || []).forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((it: any) => {
          if ((it.master || "") === masterName) {
            qty += Number(it.quantity || 1);
          }
        });
      });

      if (!cancelled) {
        setShippingTotal(ship);
        setOrderedQty(qty);
        setLoading(false);
      }
    };
    if (masterName) load();
    return () => { cancelled = true; };
  }, [masterName]);

  if (loading || !shippingTotal) return null;

  const perItem = orderedQty > 0 ? Math.ceil(shippingTotal / orderedQty) : shippingTotal;
  // Progress = how close we are to "ship per item" being low. Use orderedQty progress vs target estimated as qty needed for perItem ≤ 10k
  // Simpler: show inverse — more orders = closer to 100% (cap at 50sp = 100%)
  const cap = 50;
  const pct = Math.min(100, (orderedQty / cap) * 100);

  return (
    <div className={`rounded-lg border bg-card p-3 space-y-2 ${className || ""}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Truck className="h-4 w-4" /> Phí ship chia đều
        </span>
        <span className="text-xs text-muted-foreground">
          {orderedQty} sp đã đặt · tổng {fmt(shippingTotal)}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs">
        Hiện tại: <span className="font-semibold text-primary">{fmt(perItem)}/sp</span>
        {orderedQty > 0 && (
          <span className="text-muted-foreground"> · càng nhiều người đặt, phí ship/sp càng giảm</span>
        )}
      </p>
    </div>
  );
}
