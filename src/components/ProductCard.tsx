import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ImageSkeleton } from "@/components/ImageSkeleton";

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

const formatPrice = (price: number) => `${price.toLocaleString('vi-VN')}đ`;

const getMinPrice = (variants: ProductVariant[], defaultPrice: number): number => {
  if (!variants || variants.length === 0) return defaultPrice;
  return Math.min(...variants.map(v => v.price));
};

export function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  const minPriceValue = getMinPrice(product.variants, product.price);
  const priceDisplay = formatPrice(minPriceValue);

  let availableStock: number | undefined;
  let isOutOfStock = false;

  if (product.isUserListing) {
    availableStock = undefined;
  } else {
    const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
    if (hasVariantStock) {
      availableStock = product.variants?.filter(v => v.stock !== undefined).reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      isOutOfStock = availableStock <= 0;
    } else if (product.stock !== undefined && product.stock !== null) {
      availableStock = product.stock;
      isOutOfStock = availableStock <= 0;
    } else {
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
      <div className="overflow-hidden rounded-xl bg-card border border-border/40 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">

        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <ImageSkeleton
            src={thumbnail}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isUnavailable ? 'opacity-50' : ''}`}
          />

          {isUnavailable && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">
                {isOutOfStock ? "Hết hàng" : "Hết hạn"}
              </Badge>
            </div>
          )}

          <div className="absolute top-1.5 left-1.5 flex items-start gap-1">
            {product.status && !isUnavailable && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] opacity-90 shadow-sm backdrop-blur-sm">
                {product.status}
              </Badge>
            )}
            {product.artist && !isUnavailable && !product.isUserListing && (
              <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground backdrop-blur-sm">
                {product.artist}
              </Badge>
            )}
          </div>

          {!isUnavailable && stockDisplay !== undefined && stockDisplay < 10 && (
            <div className="absolute bottom-1.5 right-1.5">
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] backdrop-blur-sm">
                Còn {stockDisplay}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-2.5">
          <h3 className="h-10 text-sm font-medium line-clamp-2 leading-5">
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
