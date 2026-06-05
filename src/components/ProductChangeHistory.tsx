import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, Loader2 } from "lucide-react";

interface Row {
  id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

export function ProductChangeHistory({ productId }: { productId: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("product_change_history")
        .select("*")
        .eq("product_id", productId)
        .order("changed_at", { ascending: false })
        .limit(100);
      if (active) {
        setRows((data as Row[]) || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [productId]);

  const fmt = (s: string) =>
    new Date(s).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const trunc = (s: string | null) => {
    if (!s) return <span className="text-muted-foreground italic">trống</span>;
    return s.length > 60 ? s.slice(0, 60) + "…" : s;
  };

  return (
    <div className="border rounded-lg p-3 bg-muted/20">
      <div className="flex items-center gap-2 mb-2 font-medium text-sm">
        <History className="h-4 w-4" /> Lịch sử thay đổi
      </div>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa có lịch sử thay đổi.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rows.map(r => (
            <div key={r.id} className="text-xs border-l-2 border-primary/40 pl-2 py-1">
              <div>
                <span className="font-medium">{r.field_changed}</span>:{" "}
                <span className="text-muted-foreground">{trunc(r.old_value)}</span>
                {" → "}
                <span>{trunc(r.new_value)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {fmt(r.changed_at)} • {r.changed_by || "Admin"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
