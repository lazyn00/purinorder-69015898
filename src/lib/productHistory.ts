import { supabase } from "@/integrations/supabase/client";

// Fields tracked for admin change history.
const TRACKED_FIELDS: { key: string; label: string; json?: boolean }[] = [
  { key: "name", label: "Tên" },
  { key: "price", label: "Giá" },
  { key: "price_display", label: "Hiển thị giá" },
  { key: "stock", label: "Tồn kho" },
  { key: "status", label: "Trạng thái" },
  { key: "category", label: "Danh mục" },
  { key: "subcategory", label: "Danh mục phụ" },
  { key: "artist", label: "Artist" },
  { key: "master", label: "Master" },
  { key: "order_deadline", label: "Hạn order" },
  { key: "te", label: "Tệ" },
  { key: "rate", label: "Rate" },
  { key: "can_weight", label: "Cân" },
  { key: "pack", label: "Pack" },
  { key: "cong", label: "Công" },
  { key: "description", label: "Mô tả" },
  { key: "size", label: "Kích thước" },
  { key: "includes", label: "Bao gồm" },
  { key: "production_time", label: "TG sản xuất" },
  { key: "deposit_allowed", label: "Cho đặt cọc" },
  { key: "fees_included", label: "Đã bao gồm phí" },
  { key: "images", label: "Hình ảnh", json: true },
  { key: "variants", label: "Phân loại", json: true },
  { key: "option_groups", label: "Nhóm tuỳ chọn", json: true },
  { key: "variant_image_map", label: "Ảnh phân loại", json: true },
];

function norm(v: any, json?: boolean) {
  if (v === null || v === undefined || v === "") return "";
  if (json) return JSON.stringify(v ?? null);
  return String(v);
}

export async function logProductChanges(
  productId: number,
  oldRow: any,
  newRow: any,
  changedBy: string,
) {
  if (!oldRow || !newRow) return;
  const rows: any[] = [];
  for (const f of TRACKED_FIELDS) {
    const a = norm(oldRow[f.key], f.json);
    const b = norm(newRow[f.key], f.json);
    if (a !== b) {
      rows.push({
        product_id: productId,
        field_changed: f.label,
        old_value: a.slice(0, 500) || null,
        new_value: b.slice(0, 500) || null,
        changed_by: changedBy,
      });
    }
  }
  if (rows.length === 0) return;
  try {
    await (supabase as any).from("product_change_history").insert(rows);
  } catch (e) {
    console.error("Failed to log product history", e);
  }
}
