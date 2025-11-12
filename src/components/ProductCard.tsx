// @/components/ProductCard.tsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { productsData } from "@/data/products"; // Import kiểu dữ liệu

// Lấy kiểu Product từ file data (hoặc từ context nếu bạn có)
// Chúng ta cần định nghĩa rõ kiểu 'variants' để tính toán
type ProductVariant = {
  name: string;
  price: number;
};

// Giả sử kiểu Product của bạn trông như thế này
// (Bạn có thể cần điều chỉnh dựa trên file product.ts đầy đủ)
type Product = {
  id: number;
  name: string;
  price: number; // Giá gốc
  images: string[];
  status?: string; // Tag trạng thái
  variants: ProductVariant[]; // Mảng các phân loại
};


// Hàm helper để định dạng tiền
const formatPrice = (price: number) => {
  return `${price.toLocaleString('vi-VN')}đ`;
};

// Hàm helper để lấy khoảng giá
const getPriceRange = (variants: ProductVariant[], defaultPrice: number): string => {
  // Nếu không có variant, dùng giá gốc
  if (!variants || variants.length === 0) {
    return formatPrice(defaultPrice);
  }

  // Nếu chỉ có 1 variant, dùng giá đó
  if (variants.length === 1) {
    return formatPrice(variants[0].price);
  }

  // Tính min/max
  let minPrice = variants[0].price;
  let maxPrice = variants[0].price;

  for (const variant of variants) {
    if (variant.price < minPrice) minPrice = variant.price;
    if (variant.price > maxPrice) maxPrice = variant.price;
  }

  // Nếu min và max bằng nhau, hiển thị 1 giá
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  // Rút gọn (ví dụ: 48k - 230k)
  const minSimple = Math.round(minPrice / 1000);
  const maxSimple = Math.round(maxPrice / 1000);

  return `${minSimple}k - ${maxSimple}k`;
};


export function ProductCard({ product }: { product: Product }) {
  // Lấy ảnh đầu tiên làm thumbnail
  const thumbnail = product.images[0] || "https://i.imgur.com/placeholder.png";
  
  // Tự động tính toán khoảng giá
  const priceDisplay = getPriceRange(product.variants, product.price);

  return (
    // Toàn bộ card là 1 link (theo yêu cầu "bỏ nút xem chi tiết")
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-lg border transition-shadow hover:shadow-md">
        
        {/* Phần ảnh và Tag (dạng ô vuông) */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Đọc tag trạng thái động từ product.status */}
          {product.status && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2"
            >
              {product.status}
            </Badge>
          )}
        </div>

        {/* Phần Tên và Giá (Không có description, artist) */}
        <div className="p-3 md:p-4">
          <h3 className="truncate font-semibold text-sm">
            {product.name}
          </h3>
          <p className="mt-1 text-base font-bold text-primary">
            {priceDisplay}
          </p>
        </div>
      </div>
    </Link>
  );
}
