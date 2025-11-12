// @/pages/Products.tsx

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { productsData } from "@/data/products";
import { ProductCard } from "@/components/ProductCard"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  const artists = ["all", ...Array.from(new Set(productsData.map(p => p.artist)))];

  // Filter logic
  let filteredProducts = productsData.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const artistMatch = selectedArtist === "all" || product.artist === selectedArtist;
    return categoryMatch && artistMatch;
  });

  // Sort logic
  if (sortBy === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "name") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sản phẩm Pre-order</h1>
          <p className="text-muted-foreground">
            Order sản phẩm K-pop, C-pop, Anime từ Taobao, PDD, Douyin, XHS, 1688
          </p>
        </div>

        {/* === FILTERS AND SORT (ĐẦY ĐỦ) === */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="Outfit & Doll">Outfit & Doll</SelectItem>
                  <SelectItem value."Merch">Merch</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Artist Filter */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nhóm nhạc/Artist" />
                </Trigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả artist</SelectItem>
                  {artists.slice(1).map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sắp xếp" />
                </Trigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </Content>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          {(selectedCategory !== "all" || selectedArtist !== "all") && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              {selectedCategory !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  {selectedCategory} ✕
                </Button>
              )}
              {selectedArtist !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedArtist("all")}
                >
                  {selectedArtist} ✕
                </Button>
              )}
            </div>
          )}
        </div>
        {/* === KẾT THÚC FILTERS === */}


        {/* Layout "Shopee" (2-6 cột) */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
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
