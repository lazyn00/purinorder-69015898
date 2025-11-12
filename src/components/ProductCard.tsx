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
  variants: ProductVariant[];
};

// Hàm helper 1: Chỉ định dạng "k"
const formatPriceK = (price: number) => {
  const priceInK = Math.round(price / 1000);
  return `${priceInK}k`;
};

// Hàm helper 2: Lấy khoảng giá (LUÔN LUÔN ra "k")
const getPriceRange = (variants: ProductVariant[], defaultPrice: number): string => {
  if (!variants || variants.length === 0) {
    // Trường hợp 1: Không có variant
    return formatPriceK(defaultPrice);
  }

  let minPrice = variants[0].price;
  let maxPrice = variants[0].price;

  // Nếu có nhiều variant, tìm min/max
  if (variants.length > 1) {
    for (const variant of variants) {
      if (variant.price < minPrice) minPrice = variant.price;
      if (variant.price > maxPrice) maxPrice = variant.price;
    }
  } else {
    // Trường hợp 2: Chỉ có 1 variant (như "Sticker 83k")
    minPrice = maxPrice = variants[0].price;
  }

  const minK = Math.round(minPrice / 1000);
  const maxK = Math.round(maxPrice / 1000);

  // === (ĐÂY LÀ PHẦN SỬA LỖI) ===
  if (minK === maxK) {
    // Trước đó: nó có thể trả về 83.000đ
    // Bây giờ: nó sẽ trả về "83k"
    return `${minK}k`;
  }
  // === KẾT THÚC SỬA LỖI ===

  // Trường hợp 3: Khoảng giá (ví dụ "48k - 230k")
  return `${minK}k - ${maxK}k`;
};


export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  
  // Hàm này giờ sẽ luôn trả về "k"
  const priceDisplay = getPriceRange(product.variants, product.price);

  return (
    <Link to={`/product/${product.id}`} className="group block">
      {/* (Layout "Shopee") */}
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
