// @/components/ProductCard.tsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export type ProductVariant = {
  name: string;
  price: number;
  stock?: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  images: string[];
  status?: string;
  orderDeadline?: string;
  variants: ProductVariant[];
  artist?: string;
  stock?: number;
  isUserListing?: boolean;
  listingId?: string;
  listingCode?: string;
};

// 1. Hàm check trạng thái để dùng cho việc SORT ở file cha
export const getProductAvailability = (product: Product) => {
  if (product.isUserListing) return { isOutOfStock: false, isExpired: false, isUnavailable: false };

  // Check hết hạn
  const isExpired = !!(product.orderDeadline && new Date(product.orderDeadline) < new Date());

  // Check hết hàng
  let availableStock = 0;
  const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
  
  if (hasVariantStock) {
    availableStock = product.variants?.filter(v => v.stock !== undefined).reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  } else if (product.stock !== undefined && product.stock !== null) {
    availableStock = product.stock;
  } else {
    availableStock = 0; // Mặc định không có stock data là hết hàng
  }

  const isOutOfStock = availableStock <= 0;
  
  return {
    isOutOfStock,
    isExpired,
    isUnavailable: isOutOfStock || isExpired,
    availableStock
  };
};

const formatPrice = (price: number) => {
  return `${price.toLocaleString('vi-VN')}đ`;
};

const getMinPrice = (variants: ProductVariant[], defaultPrice: number): number => {
  if (!variants || variants.length === 0) return defaultPrice;
  return Math.min(...variants.map(v => v.price));
};

export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  const minPriceValue = getMinPrice(product.variants, product.price);
  const priceDisplay = formatPrice(minPriceValue);

  // Lấy trạng thái từ hàm dùng chung
  const { isOutOfStock, isExpired, isUnavailable, availableStock } = getProductAvailability(product);
  
  const productLink = product.isUserListing 
    ? `/listing/${product.listingId}`
    : `/product/${product.id}`;
  
  return (
    <Link to={productLink} className="group block">
      <div className="overflow-hidden rounded-sm bg-card shadow-sm transition-shadow hover:shadow-md">
        
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isUnavailable ? 'opacity-50 grayscale-[30%]' : ''}`}
          />
          
          {/* Overlay cảnh báo khi hết hàng/hạn */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px] font-bold uppercase py-1">
                {isOutOfStock ? "Hết hàng" : "Hết hạn"}
              </Badge>
            </div>
          )}
          
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start"> 
            {product.status && !isUnavailable && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] opacity-90 shadow-sm">
                {product.status}
              </Badge>
            )}

            {product.artist && !isUnavailable && !product.isUserListing && (
              <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {product.artist}
              </Badge>
            )}
          </div>
          
          {/* Badge báo sắp hết hàng */}
          {!isUnavailable && !product.isUserListing && availableStock < 10 && (
            <div className="absolute bottom-1.5 right-1.5">
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/80 backdrop-blur-sm">
                Còn {availableStock}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-2">
          <h3 className="h-10 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
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
