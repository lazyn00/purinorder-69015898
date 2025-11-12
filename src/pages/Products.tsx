// @/components/ProductCard.tsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// (Bạn có thể cần import kiểu Product từ data/context)
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
  variants: ProductVariant[];
};

// Hàm helper (giữ nguyên)
const formatPrice = (price: number) => {
  return `${price.toLocaleString('vi-VN')}đ`;
};

const getPriceRange = (variants: ProductVariant[], defaultPrice: number): string => {
  if (!variants || variants.length === 0) {
    return formatPrice(defaultPrice);
  }
  if (variants.length === 1) {
    return formatPrice(variants[0].price);
  }

  let minPrice = variants[0].price;
  let maxPrice = variants[0].price;
  for (const variant of variants) {
    if (variant.price < minPrice) minPrice = variant.price;
    if (variant.price > maxPrice) maxPrice = variant.price;
  }

  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  // Thay vì "k", chúng ta hiển thị giá đầy đủ
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};

export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  
  // Sửa đổi hàm getPriceRange để hiển thị khoảng giá đầy đủ thay vì "k"
  const priceDisplay = getPriceRange(product.variants, product.price);

  return (
    <Link to={`/product/${product.id}`} className="group block">
      {/* Sửa đổi: Bỏ border, dùng shadow nhẹ cho style Shopee */}
      <div className="overflow-hidden rounded-sm bg-card shadow-sm transition-shadow hover:shadow-md">
        
        {/* Phần ảnh và Tag */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.status && (
            // Sửa đổi: Tag nhỏ hơn
            <Badge 
              variant="secondary" 
              className="absolute top-1.5 left-1.5 h-5 px-1.5 text-[10px]"
            >
              {product.status}
            </Badge>
          )}
        </div>

        {/* Phần Tên và Giá (Style Shopee) */}
        {/* Sửa đổi: Giảm padding, giảm cỡ chữ */}
        <div className="p-2">
          <h3 className="h-8 text-xs font-normal line-clamp-2 md:text-sm md:h-10">
            {product.name}
          </h3>
          <p className="mt-1 truncate text-sm font-bold text-primary md:text-base">
            {priceDisplay}
          </p>
        </div>
      </div>
    </Link>
  );
}
