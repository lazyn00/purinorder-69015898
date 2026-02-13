// @/components/ProductCard.tsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type ProductVariant = {
  name: string;
  price: number;
  stock?: number;
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
  isUserListing?: boolean;
  listingId?: string;
  listingCode?: string;
};

const formatPrice = (price: number) => {
  return `${price.toLocaleString('vi-VN')}đ`;
};

const getMinPrice = (variants: ProductVariant[], defaultPrice: number): number => {
  if (!variants || variants.length === 0) return defaultPrice;
  let minPrice = variants[0].price;
  for (const variant of variants) {
    if (variant.price < minPrice) minPrice = variant.price;
  }
  return minPrice;
};

export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  
  const minPriceValue = getMinPrice(product.variants, product.price);
  const priceDisplay = formatPrice(minPriceValue);

  let availableStock: number | undefined;
  let isOutOfStock: boolean = false;
  
  if (product.isUserListing) {
    availableStock = undefined; 
    isOutOfStock = false;
  } else {
    const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
    if (hasVariantStock) {
      availableStock = product.variants?.filter(v => v.stock !== undefined).reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      isOutOfStock = availableStock <= 0;
    } else if (product.stock !== undefined && product.stock !== null) {
      availableStock = product.stock;
      isOutOfStock = availableStock <= 0;
    } else {
      // Stock trống (null/undefined) và không có variant stock => coi như hết hàng
      availableStock = 0;
      isOutOfStock = true;
    }
  }
  
  const isExpired = !product.isUserListing && product.orderDeadline && new Date(product.orderDeadline) < new Date();
  const isUnavailable = isOutOfStock || isExpired;
  
  const stockDisplay = availableStock;
  
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
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isUnavailable ? 'opacity-50' : ''}`}
          />
          
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">
                {isOutOfStock ? "Hết hàng" : "Hết hạn"}
              </Badge>
            </div>
          )}
          
          <div className="absolute top-1.5 left-1.5 flex items-start space-x-1"> 
            {/* Tag Status: Đã chỉnh sửa để đồng bộ màu sắc */}
            {product.status && !isUnavailable && (
              <Badge 
                // Sử dụng variant standard hoặc secondary thay vì custom color cứng
                variant={product.isUserListing ? "secondary" : "secondary"} 
                className="h-5 px-1.5 text-[10px] opacity-90 shadow-sm"
              >
                {product.status}
              </Badge>
            )}

            {product.artist && !isUnavailable && !product.isUserListing && (
              <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {product.artist}
              </Badge>
            )}
          </div>
          
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
