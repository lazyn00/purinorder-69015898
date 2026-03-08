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
      <div className="overflow-hidden rounded-sm bg-card border border-border/30 transition-all duration-200 hover:shadow-sm">

        <div className="relative aspect-square overflow-hidden bg-muted/20">
          <ImageSkeleton
            src={thumbnail}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${isUnavailable ? 'opacity-50' : ''}`}
          />

          {isUnavailable && (
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
                {isOutOfStock ? "Hết hàng" : "Hết hạn"}
              </Badge>
            </div>
          )}

          <div className="absolute top-1 left-1 flex items-start gap-0.5">
            {product.status && !isUnavailable && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] opacity-90">
                {product.status}
              </Badge>
            )}
            {product.artist && !isUnavailable && !product.isUserListing && (
              <Badge variant="default" className="h-4 px-1 text-[9px] bg-primary text-primary-foreground">
                {product.artist}
              </Badge>
            )}
          </div>

          {!isUnavailable && stockDisplay !== undefined && stockDisplay < 10 && (
            <div className="absolute bottom-1 right-1">
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                Còn {stockDisplay}
              </Badge>
            </div>
          )}
        </div>

        <div className="px-1.5 py-1.5">
          <h3 className="text-xs font-semibold line-clamp-2 leading-4 min-h-[32px] text-foreground/90">
            {product.name}
          </h3>
          <p className={`mt-0.5 truncate text-sm font-semibold ${isUnavailable ? 'text-muted-foreground' : 'text-primary'}`}>
            {priceDisplay}
          </p>
        </div>
      </div>
    </Link>
  );
}
