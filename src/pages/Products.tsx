// @/pages/Products.tsx

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
// (Đọc từ Context)
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, ArrowUpDown, Search } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";

export default function Products() {
  const { products, isLoading } = useCart();

  // Xoá: state cho selectedCategory và pagination
  // const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const productsPerPage = 24;

  const artists = [
    "all",
    ...Array.from(new Set(products.map((p) => p.artist).filter(Boolean))),
  ];
  
  // Thay đổi: Lọc chính chỉ còn theo artist và search
  let filteredProducts = products.filter((product) => {
    // Xoá: categoryMatch
    const artistMatch =
      selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return artistMatch && searchMatch;
  });

  // Sort products (Giữ nguyên)
  if (sortBy === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "name") {
    filteredProducts = [...filteredProducts].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  // Xoá: Logic pagination
  // const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  // const startIndex = (currentPage - 1) * productsPerPage;
  // const endIndex = startIndex + productsPerPage;
  // const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Xoá: handleFilterChange vì không còn phân trang
  // const handleFilterChange = () => {
  //   setCurrentPage(1);
  // };
  
  // (Xử lý loading - Giữ nguyên)
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  // Thay đổi: Định nghĩa các danh mục bạn muốn hiển thị
  const categoriesToDisplay = ["Outfit & Doll", "Merch", "Khác"];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sản phẩm</h1>
          <p className="text-muted-foreground">
            Order sản phẩm K-pop, C-pop, Anime từ Taobao, PDD, Douyin, XHS, 1688
          </p>
        </div>

        {/* Search Bar (Giữ nguyên) */}
        <div className="mb-6">
          <div className="relative">
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

        {/* Filters and Sort */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            
            {/* Xoá: Dropdown lọc Category */}

            {/* Artist Filter (Giữ nguyên) */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {/* Thay đổi: Bỏ handleFilterChange */}
              <Select
                value={selectedArtist}
                onValueChange={(value) => {
                  setSelectedArtist(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Artist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả Artist</SelectItem>
                  {artists.slice(1).map((artist) => (
                    <SelectItem key={artist} value={artist}>
                      {artist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort (Giữ nguyên) */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          {/* Thay đổi: Chỉ hiển thị filter của Artist */}
          {selectedArtist !== "all" && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedArtist("all");
                }}
              >
                {selectedArtist} ✕
              </Button>
            </div>
          )}
        </div>

        {/* Thay đổi LỚN: Cấu trúc render grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-12">
            {categoriesToDisplay.map((category) => {
              // Lọc sản phẩm cho từng danh mục từ danh sách đã lọc (theo artist/search) và đã sort
              const productsForCategory = filteredProducts.filter(
                (p) => p.category === category
              );

              // Chỉ hiển thị mục nếu có sản phẩm
              if (productsForCategory.length === 0) {
                return null;
              }

              return (
                <section key={category}>
                  {/* Tiêu đề cho từng mục */}
                  <h2 className="text-2xl font-bold mb-6 pb-2 border-b">
                    {category}
                  </h2>
                  
                  {/* Lưới sản phẩm cho mục này */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {productsForCategory.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product as any}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}

        {/* Xoá: Nút điều khiển pagination */}
      </div>
    </Layout>
  );
}
