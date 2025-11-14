// @/pages/Products.tsx

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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

// Imports cho Carousel
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Số lượng sản phẩm hiển thị trong carousel "lướt" ban đầu
const INITIAL_PRODUCTS_PER_CATEGORY = 6;

export default function Products() {
  const { products, isLoading } = useCart();

  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // LẤY LẠI: State để quản lý việc "Xem thêm"
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const artists = [
    "all",
    ...Array.from(new Set(products.map((p) => p.artist).filter(Boolean))),
  ];

  // Lọc chính (giữ nguyên)
  let filteredProducts = products.filter((product) => {
    const artistMatch =
      selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return artistMatch && searchMatch;
  });

  // Sort products (giữ nguyên)
  if (sortBy === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "name") {
    filteredProducts = [...filteredProducts].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

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

  // Danh mục cần hiển thị
  const categoriesToDisplay = ["Outfit & Doll", "Merch", "Khác"];

  // LẤY LẠI: Hàm để bật/tắt "Xem thêm"
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header và Filters (Giữ nguyên) */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sản phẩm</h1>
          <p className="text-muted-foreground">
            Order sản phẩm K-pop, C-pop, Anime từ Taobao, PDD, Douyin, XHS, 1688
          </p>
        </div>

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

        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
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

        {/* Cấu trúc render KẾT HỢP */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-12">
            {categoriesToDisplay.map((category) => {
              // Lọc sản phẩm cho từng danh mục
              const productsForCategory = filteredProducts.filter(
                (p) => p.category === category
              );

              if (productsForCategory.length === 0) {
                return null;
              }

              // Logic mới
              const isExpanded = expandedCategories.has(category);
              const showSeeMoreButton = productsForCategory.length > INITIAL_PRODUCTS_PER_CATEGORY;
              // Chỉ lấy 6 sản phẩm đầu tiên cho carousel
              const productsForCarousel = productsForCategory.slice(0, INITIAL_PRODUCTS_PER_CATEGORY);

              return (
                <section key={category}>
                  {/* Tiêu đề mục (Giữ nguyên) */}
                  <h2 className="text-2xl font-bold mb-6 pb-2 border-b">
                    {category}
                  </h2>

                  {/* THAY ĐỔI LỚN: Render Carousel hoặc Grid tùy state */}
                  {isExpanded ? (
                    // 1. Chế độ MỞ RỘNG (Grid)
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {productsForCategory.map((product) => ( // Render TẤT CẢ
                        <ProductCard
                          key={product.id}
                          product={product as any}
                        />
                      ))}
                    </div>
                  ) : (
                    // 2. Chế độ THU GỌN (Carousel)
                    <Carousel
                      opts={{
                        align: "start",
                        dragFree: true,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2">
                        {productsForCarousel.map((product) => ( // Chỉ render 6 SẢN PHẨM ĐẦU
                          <CarouselItem
                            key={product.id}
                            className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                          >
                            <ProductCard
                              product={product as any}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="hidden sm:flex" />
                      <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                  )}

                  {/* Nút "Xem thêm" / "Thu gọn" */}
                  {/* Chỉ hiển thị nút nếu tổng sản phẩm > số lượng ban đầu */}
                  {showSeeMoreButton && (
                    <div className="text-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => toggleCategoryExpansion(category)}
                      >
                        {isExpanded
                          ? "Thu gọn"
                          : `Xem tất cả (${productsForCategory.length} sản phẩm)`}
                      </Button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
