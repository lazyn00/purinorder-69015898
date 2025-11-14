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
};

// === (SỬA ĐỔI) HÀM HELPER 1 ===
// Đổi lại thành định dạng "đ" (83000 -> "83.000đ")
const formatPrice = (price: number) => {
  return `${price.toLocaleString('vi-VN')}đ`;
};
// === KẾT THÚC SỬA ĐỔI ===


// === (SỬA ĐỔI) HÀM HELPER 2 ===
// Đổi tên từ getPriceRange thành getMinPrice (lấy giá rẻ nhất)
const getMinPrice = (variants: ProductVariant[], defaultPrice: number): number => {
  // Nếu không có variant, dùng giá gốc
  if (!variants || variants.length === 0) {
    return defaultPrice;
  }

  // Tìm giá rẻ nhất trong các variants
  let minPrice = variants[0].price;
  for (const variant of variants) {
    if (variant.price < minPrice) {
      minPrice = variant.price;
    }
  }
  
  return minPrice;
};
// === KẾT THÚC SỬA ĐỔI ===


export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  
  // 1. Lấy giá trị số rẻ nhất
  const minPriceValue = getMinPrice(product.variants, product.price);
  
  // 2. Chuyển giá trị đó sang định dạng "đ"
  const priceDisplay = formatPrice(minPriceValue);

  // 3. Check if order deadline exists and is upcoming
  const hasDeadline = product.orderDeadline && new Date(product.orderDeadline) > new Date();

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-sm bg-card shadow-sm transition-shadow hover:shadow-md">
        
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.status && (
            <Badge 
              variant="secondary" 
              className="absolute top-1.5 left-1.5 h-5 px-1.5 text-[10px]"
            >
              {product.status}
            </Badge>
          )}
        </div>

        <div className="p-2">
          {/* (Giữ nguyên định dạng tên sản phẩm) */}
          <h3 className="h-10 text-sm font-semibold line-clamp-2">
            {product.name}
          </h3>
          
          {/* Order deadline - hiển thị nổi bật */}
          {hasDeadline && (
            <p className="mt-1 text-xs font-semibold text-red-600 animate-pulse">
              ⏰ Hạn order: {new Date(product.orderDeadline!).toLocaleDateString('vi-VN')}
            </p>
          )}
          
          {/* (Hiển thị giá rẻ nhất đã định dạng) */}
          <p className="mt-1 truncate text-sm font-bold text-primary md:text-base">
            {priceDisplay}
          </p>
        </div>
      </div>
    </Link>
  );
}
