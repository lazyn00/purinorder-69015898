import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, ExternalLink, Save, Pencil, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const getProgressColor = (progress: string) => {
  switch (progress) {
    case "Đang xử lý": return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Đã đặt hàng": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Đang sản xuất": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Đang vận chuyển T-V": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Sẵn sàng giao": return "bg-lime-100 text-lime-800 border-lime-200";
    case "Đang giao": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Đã hoàn thành": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface OrderRef {
  orderId: string;
  orderNumber: string;
  qty: number;
  progress: string;
  deliveryName: string;
}

interface AggregatedItem {
  productId: number;
  name: string;
  variant: string;
  image: string;
  totalQty: number;
  progress: { [key: string]: number };
  orderRefs: OrderRef[];
}

interface ProductData {
  id: number;
  name: string;
  price: number;
  te?: number;
  rate?: number;
  actual_rate?: number;
  actual_can?: number;
  actual_pack?: number;
  cong?: number;
  pack?: number;
  total?: number;
  chenh?: number;
  r_v?: number;
  can_weight?: number;
  variants?: any[];
}

interface Props {
  aggregated: AggregatedItem[];
  uniqueNames: string[];
  allStatuses: string[];
  products: ProductData[];
  onProductUpdated?: () => void;
}

interface EditFields {
  te: string;
  actual_rate: string;
  actual_can: string;
  cong: string;
}

const FIELD_LABELS: { key: keyof EditFields; label: string }[] = [
  { key: "te", label: "Tệ" },
  { key: "actual_rate", label: "Rate thực" },
  { key: "actual_can", label: "Cân thực" },
  { key: "cong", label: "Công" },
];
];

export default function ProductTrackingFiltered({ aggregated, uniqueNames, allStatuses, products, onProductUpdated }: Props) {
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({ te: "", actual_rate: "", actual_can: "", cong: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const filtered = aggregated.filter(item => {
    const matchName = !searchName || item.name.toLowerCase().includes(searchName.toLowerCase());
    const matchStatus = filterStatus === "all" || item.progress[filterStatus];
    return matchName && matchStatus;
  });

  const getProductData = (productId: number) => products.find(p => p.id === productId);

  const getVariantData = (product: ProductData | undefined, variantName: string) => {
    if (!product?.variants) return null;
    return product.variants.find((v: any) => v.name === variantName);
  };

  const fmt = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return val.toLocaleString('vi-VN');
  };

  const startEditing = (item: AggregatedItem, product: ProductData | undefined) => {
    const itemKey = `${item.productId}-${item.variant}`;
    if (item.variant && product?.variants) {
      const variant = getVariantData(product, item.variant);
      setEditFields({
        te: variant?.te?.toString() ?? product.te?.toString() ?? "",
        actual_rate: variant?.actual_rate?.toString() ?? product.actual_rate?.toString() ?? "",
        actual_can: variant?.actual_can?.toString() ?? product.actual_can?.toString() ?? "",
        cong: variant?.cong?.toString() ?? product.cong?.toString() ?? "",
      });
    } else {
      setEditFields({
        te: product?.te?.toString() ?? "",
        actual_rate: product?.actual_rate?.toString() ?? "",
        actual_can: product?.actual_can?.toString() ?? "",
        cong: product?.cong?.toString() ?? "",
      });
    }
    setEditingKey(itemKey);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditFields({ te: "", actual_rate: "", actual_can: "", cong: "" });
  };

  const saveEditing = async (item: AggregatedItem, product: ProductData | undefined) => {
    if (!product) return;
    setSaving(true);

    const parseNum = (v: string) => v === "" ? null : parseFloat(v);

    try {
      if (item.variant && product.variants) {
        // Update variant-level fields
        const updatedVariants = product.variants.map((v: any) => {
          if (v.name === item.variant) {
            return {
              ...v,
              te: parseNum(editFields.te),
              actual_rate: parseNum(editFields.actual_rate),
              actual_can: parseNum(editFields.actual_can),
              cong: parseNum(editFields.cong),
            };
          }
          return v;
        });

        const { error } = await supabase
          .from("products")
          .update({ variants: updatedVariants as any })
          .eq("id", product.id);

        if (error) throw error;
      } else {
        // Update product-level fields
        const { error } = await supabase
          .from("products")
          .update({
            te: parseNum(editFields.te),
            actual_rate: parseNum(editFields.actual_rate),
            actual_can: parseNum(editFields.actual_can),
            cong: parseNum(editFields.cong),
          })
          .eq("id", product.id);

        if (error) throw error;
      }

      toast({ title: "Đã lưu", description: `Cập nhật thành công ${item.variant ? `phân loại "${item.variant}"` : item.name}` });
      setEditingKey(null);
      onProductUpdated?.();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên sản phẩm..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {allStatuses.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} sản phẩm</p>

      {filtered.map((item, idx) => {
        const itemKey = `${item.productId}-${item.variant}`;
        const isExpanded = expandedId === itemKey;
        const isEditing = editingKey === itemKey;
        const product = getProductData(item.productId);
        const variant = item.variant ? getVariantData(product, item.variant) : null;

        // Get display values: variant-level > product-level
        const displayTe = variant?.te ?? product?.te;
        const displayRate = variant?.actual_rate ?? product?.actual_rate;
        const displayCan = variant?.actual_can ?? product?.actual_can;
        const displayPack = variant?.actual_pack ?? product?.actual_pack;
        const displayCong = variant?.cong ?? product?.cong;

        return (
          <div key={idx} className="border rounded-lg overflow-hidden">
            <div
              className="flex gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : itemKey)}
            >
              {item.image && (
                <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium truncate">{item.name}</p>
                  {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                </div>
                {item.variant && (
                  <p className="text-xs text-muted-foreground">Phân loại: {item.variant}</p>
                )}
                <p className="text-sm font-semibold text-primary mt-0.5">Tổng đặt: {item.totalQty}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(item.progress).map(([status, qty]) => (
                    <Badge key={status} variant="outline" className={`${getProgressColor(status)} text-[10px] px-1.5 py-0`}>
                      {status}: {qty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t bg-muted/20 p-3 space-y-3">
                {/* Product financial details */}
                {product && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold">📊 Thông tin chi phí {item.variant ? `- ${item.variant}` : ''}</p>
                      {!isEditing ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); startEditing(item, product); }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                            disabled={saving}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Huỷ
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => { e.stopPropagation(); saveEditing(item, product); }}
                            disabled={saving}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Lưu
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {FIELD_LABELS.map(({ key, label }) => (
                          <div key={key}>
                            <label className="text-[10px] text-muted-foreground">{label}</label>
                            <Input
                              type="number"
                              className="h-7 text-xs"
                              value={editFields[key]}
                              onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Giá bán:</span>
                          <span className="font-medium">{fmt(product.price)}đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tệ:</span>
                          <span className="font-medium">{fmt(displayTe)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rate thực:</span>
                          <span className="font-medium">{fmt(displayRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cân thực:</span>
                          <span className="font-medium">{fmt(displayCan)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pack thực:</span>
                          <span className="font-medium">{fmt(displayPack)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Công:</span>
                          <span className="font-medium">{fmt(displayCong)}</span>
                        </div>
                        {product.chenh !== null && product.chenh !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chênh:</span>
                            <span className={`font-medium ${product.chenh >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(product.chenh)}đ</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Orders containing this product */}
                <div>
                  <p className="text-xs font-semibold mb-1.5">📦 Đơn hàng ({item.orderRefs.length})</p>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {item.orderRefs.map((ref, i) => (
                      <Link
                        key={i}
                        to={`/admin/order/${ref.orderId}`}
                        className="flex items-center justify-between p-2 rounded bg-background border text-xs hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-primary">#{ref.orderNumber}</span>
                          <span className="text-muted-foreground truncate">{ref.deliveryName}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span>x{ref.qty}</span>
                          <Badge variant="outline" className={`${getProgressColor(ref.progress)} text-[10px] px-1.5 py-0`}>
                            {ref.progress}
                          </Badge>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy sản phẩm phù hợp</p>
      )}
    </div>
  );
}
