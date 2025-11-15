// @/components/ProductCard.tsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type ProductVariant = {
  name: string;
  price: number;
  stock?: number; // Stock riêng cho variant này
};

type Product = {
  id: number;
  name: string;
  price: number;
  images: string[];
  status?: string;
  orderDeadline?: string;
  variants: ProductVariant[];
  artist?: string;
  stock?: number;
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

  // === LOGIC XÁC ĐỊNH TRẠNG THÁI STOCK (ĐÃ SỬA) ===
  let availableStock: number = 0;
  const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
  
  if (hasVariantStock) {
    // Nếu có stock riêng cho variant, tính TỔNG stock từ các variant đó
    availableStock = product.variants
      ?.filter(v => v.stock !== undefined)
      .reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  } else {
    // Nếu không có stock riêng cho variant, dùng stock chung của sản phẩm
    availableStock = product.stock || 0;
  }
  
  const isOutOfStock = availableStock <= 0;
  const isExpired = product.orderDeadline && new Date(product.orderDeadline) < new Date();
  const isUnavailable = isOutOfStock || isExpired;
  // === KẾT THÚC LOGIC XÁC ĐỊNH TRẠNG THÁI STOCK ===
  
  // Sử dụng availableStock để hiển thị số lượng còn lại
  const stockDisplay = availableStock;
  
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-sm bg-card shadow-sm transition-shadow hover:shadow-md">
        
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isUnavailable ? 'opacity-50' : ''}`}
          />
          
          {/* Unavailable overlay */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">
                {isOutOfStock ? "Hết hàng" : "Hết hạn"}
              </Badge>
            </div>
          )}
          
          {/* Tags container */}
          <div className="absolute top-1.5 left-1.5 flex items-start space-x-1"> 
            {/* Status badge */}
            {product.status && !isUnavailable && (
              <Badge 
                variant="secondary" 
                className="h-5 px-1.5 text-[10px]"
              >
                {product.status}
              </Badge>
            )}

            {/* Artist badge */}
            {product.artist && !isUnavailable && (
              <Badge 
                variant="default"
                className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/80" 
              >
                {product.artist}
              </Badge>
            )}
          </div>
          
          {/* Stock indicator */}
          {!isUnavailable && stockDisplay !== undefined && stockDisplay < 10 && (
            <div className="absolute bottom-1.5 right-1.5">
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                Còn {stockDisplay}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-2">
          <h3 className="h-10 text-sm font-semibold line-clamp-2">
            {product.name}
          </h3>
          
          <p className={`mt-1 truncate text-sm font-bold md:text-base ${isUnavailable ? 'text-muted-foreground' : 'text-primary'}`}>
            {priceDisplay}
          </p>
        </div>
        
      </div>
    </Link>
  );
}
