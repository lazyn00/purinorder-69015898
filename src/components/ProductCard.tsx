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
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isUnavailable ? 'opacity-60 grayscale-[30%]' : ''
            }`}
          />
          
          {/* Nhãn trạng thái (Góc trên bên trái): Status & Artist */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start"> 
            {product.status && !isUnavailable && (
              <Badge 
                variant="secondary" 
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
          
          {/* Nhãn thông tin quan trọng (Góc dưới bên phải): Hết hàng / Hết hạn / Số lượng ít */}
          <div className="absolute bottom-1.5 right-1.5">
            {isOutOfStock ? (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider">
                Hết hàng
              </Badge>
            ) : isExpired ? (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider">
                Hết hạn
              </Badge>
            ) : (!product.isUserListing && availableStock !== undefined && availableStock < 10) ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-background/80 backdrop-blur-sm">
                Còn {availableStock}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="p-2">
          <h3 className="h-10 text-sm font-semibold line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          
          <p className={`mt-1 truncate text-sm font-bold md:text-base ${
            isUnavailable ? 'text-muted-foreground' : 'text-primary'
          }`}>
            {priceDisplay}
          </p>
        </div>
        
      </div>
    </Link>
  );
}
