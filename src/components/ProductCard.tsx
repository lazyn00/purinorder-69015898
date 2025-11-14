// @/components/ProductCard.tsx

// ... (Các phần import và type giữ nguyên) ...

export function ProductCard({ product }: { product: Product }) {
  // ... (Logic component giữ nguyên) ...

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-sm bg-card shadow-sm transition-shadow hover:shadow-md">
        
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* CONTAINER CHO CÁC TAG - ĐÃ SỬA: Đổi sang flex-row và space-x-1 */}
          <div className="absolute top-1.5 left-1.5 flex **items-start space-x-1**">
            {/* TAG STATUS */}
            {product.status && (
              <Badge 
                variant="secondary" 
                className="h-5 px-1.5 text-[10px]"
              >
                {product.status}
              </Badge>
            )}

            {/* TAG ARTIST (HỒNG) */}
            {product.artist && (
              <Badge 
                variant="default"
                className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/80" 
              >
                {product.artist}
              </Badge>
            )}
          </div>
          {/* ... (Phần hình ảnh và chi tiết khác) ... */}
        </div>

        <div className="p-2">
          {/* ... (Các phần còn lại giữ nguyên) ... */}
        </div>
      </div>
    </Link>
  );
}
