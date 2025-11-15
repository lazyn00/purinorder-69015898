import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useCart } from "@/contexts/CartContext";
import { CategoryPreview } from "@/components/CategoryPreview";
import { useState } from "react";

export default function Products() {
  // Lấy dữ liệu sản phẩm và trạng thái tải từ CartContext
  const { products, isLoading } = useCart();
  const [searchQuery, setSearchQuery] = useState<string>("");

  // === HÀM KIỂM TRA TÍNH KHẢ DỤNG CỦA SẢN PHẨM ===
  const isProductAvailable = (product: any) => {
    // 1. Kiểm tra tồn kho: Có tồn kho hoặc tồn kho > 0
    const hasStock = !product.stock || product.stock > 0;
    
    // 2. Kiểm tra hạn đặt hàng: Không có hạn hoặc ngày hiện tại < ngày hết hạn
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    
    return hasStock && notExpired;
  };

  // === SẮP XẾP SẢN PHẨM: CÒN HÀNG LÊN TRƯỚC ===
  const sortedProducts = [...products].sort((a, b) => {
    const aAvailable = isProductAvailable(a);
    const bAvailable = isProductAvailable(b);
    
    // Sản phẩm còn hàng (true) sẽ được sắp xếp lên trước sản phẩm hết hàng (false)
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    
    // Giữ nguyên thứ tự nếu cùng trạng thái (hoặc có thể thêm logic sắp xếp phụ ở đây)
    return 0;
  });

  // === LỌC SẢN PHẨM THEO TỪ KHÓA TÌM KIẾM ===
  const filteredProducts = searchQuery
    ? sortedProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedProducts; // Sử dụng sản phẩm đã sắp xếp nếu không có tìm kiếm

  // === NHÓM SẢN PHẨM THEO DANH MỤC LỚN ===
  const outfitDoll = filteredProducts.filter(p => p.category === "Outfit & Doll");
  const merch = filteredProducts.filter(p => p.category === "Merch");
  const other = filteredProducts.filter(p => p.category === "Khác");

  // Hiển thị màn hình tải
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  // === GIAO DIỆN CHÍNH ===
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sản phẩm</h1>
          <p className="text-muted-foreground">
            Order sản phẩm K-pop, C-pop, Anime từ Taobao, PDD, Douyin, XHS, 1688
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm, artist, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Previews */}
        <div className="space-y-16">
          {/* Hiển thị Outfit & Doll nếu có sản phẩm */}
          {outfitDoll.length > 0 && (
            <CategoryPreview
              title="Outfit & Doll"
              categorySlug="outfit-doll"
              products={outfitDoll}
            />
          )}

          {/* Hiển thị Merch nếu có sản phẩm */}
          {merch.length > 0 && (
            <CategoryPreview
              title="Merch"
              categorySlug="merch"
              products={merch}
            />
          )}

          {/* Hiển thị Khác nếu có sản phẩm */}
          {other.length > 0 && (
            <CategoryPreview
              title="Khác"
              categorySlug="khac"
              products={other}
            />
          )}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
