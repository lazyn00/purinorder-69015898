// @/pages/Products.tsx

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
// (Đọc từ Context)
import { useCart } from "@/contexts/CartContext"; 
import { ProductCard } from "@/components/ProductCard"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, ArrowUpDown, Loader2, Search } from "lucide-react";

export default function Products() {
  const { products, isLoading } = useCart();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const artists = ["all", ...Array.from(new Set(products.map(p => p.artist)))];

  // Filter products
  let filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const artistMatch = selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && artistMatch && searchMatch;
  });

  // Sort products
  if (sortBy === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "name") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
  }

  // (Xử lý loading)
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </Layout>
    );
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

        {/* Search Bar */}
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
                  <SelectItem value="Merch">Merch</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Artist Filter (Đã sửa) */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nhóm nhạc/Artist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả artist</SelectItem>
                  {artists.slice(1).map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort (Đã sửa) */}
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
