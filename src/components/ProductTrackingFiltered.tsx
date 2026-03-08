import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

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

interface AggregatedItem {
  productId: number;
  name: string;
  variant: string;
  image: string;
  totalQty: number;
  progress: { [key: string]: number };
}

interface Props {
  aggregated: AggregatedItem[];
  uniqueNames: string[];
  allStatuses: string[];
}

export default function ProductTrackingFiltered({ aggregated, uniqueNames, allStatuses }: Props) {
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = aggregated.filter(item => {
    const matchName = !searchName || item.name.toLowerCase().includes(searchName.toLowerCase());
    const matchStatus = filterStatus === "all" || item.progress[filterStatus];
    return matchName && matchStatus;
  });

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

      {filtered.map((item, idx) => (
        <div key={idx} className="flex gap-3 p-3 border rounded-lg">
          {item.image && (
            <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.name}</p>
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
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy sản phẩm phù hợp</p>
      )}
    </div>
  );
}
