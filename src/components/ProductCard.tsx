// @/components/ProductCard.tsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type ProductVariant = {
  name: string;
  price: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
  images: string[];
  status?: string;
  orderDeadline?: string;
  variants: ProductVariant[];
  artist?: string; // Đã thêm
};

// === HÀM HELPER: ĐỊNH DẠNG NGÀY GIỜ (Giữ nguyên nhưng không sử dụng) ===
const formatDeadline = (isoString: string | null | undefined): string => {
    if (!isoString) return "";
    
    const transformedString = isoString.replace(' ', 'T');
    const date = new Date(transformedString);
    
    if (isNaN(date.getTime())) return "Ngày không hợp lệ";

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};
// === KẾT THÚC HÀM HELPER ===

const formatPrice = (price: number) => {
  return `${price.toLocaleString('vi-VN')}đ`;
};

const getMinPrice = (variants: ProductVariant[], defaultPrice: number): number => {
  if (!variants || variants.length === 0) {
    return defaultPrice;
  }

  let minPrice = variants[0].price;
  for (const variant of variants) {
    if (variant.price < minPrice) {
      minPrice = variant.price;
    }
  }
  
  return minPrice;
};


export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  
  const minPriceValue = getMinPrice(product.variants, product.price);
  const priceDisplay = formatPrice(minPriceValue);

  // Đã loại bỏ logic deadline
  
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-sm bg-card shadow-sm transition-shadow hover:shadow-md">
        
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* CONTAINER CHO CÁC TAG - SỬA: Dùng flex và space-x-1 để xếp ngang */}
          <div className="absolute top-1.5 left-1.5 flex items-start space-x-1">
            {/* TAG STATUS */}
            {product.status && (
              <Badge 
                variant="secondary" 
                className="h-5 px-1.5 text-[10px]"
              >
                {product.status}
              </Badge>
            )}

            {/* TAG ARTIST (MÀU PRIMARY - HỒNG) */}
            {product.artist && (
              <Badge 
                variant="default"
                className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/80" 
              >
                {product.artist}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-2">
          
          <h3 className="h-10 text-sm font-semibold line-clamp-2">
            {product.name}
          </h3>
          
          {/* KHỐI HẠN ORDER ĐÃ BỊ LOẠI BỎ */}
          
          {/* (Hiển thị giá rẻ nhất đã định dạng) */}
          <p className="mt-1 truncate text-sm font-bold text-primary md:text-base">
            {priceDisplay}
          </p>
        </div>
        
      </div>
    </Link>
  );
}
