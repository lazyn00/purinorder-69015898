import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, ArrowUpDown, Search } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useParams } from "react-router-dom";

const CATEGORY_MAP: { [key: string]: string } = {
  "outfit-doll": "Outfit & Doll",
  "merch": "Merch",
  "khac": "Khác"
};

const CATEGORY_TITLES: { [key: string]: string } = {
  "outfit-doll": "Outfit & Doll",
  "merch": "Merch",
  "khac": "Khác"
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { products, isLoading } = useCart();
  
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 24;

  const categoryName = category ? CATEGORY_MAP[category] : "";
  
  // Filter products by main category
  const categoryProducts = products.filter(p => p.category === categoryName);

  // Get unique subcategories and artists for this category
  const subcategories = ["all", ...Array.from(new Set(categoryProducts.map(p => p.subcategory).filter(Boolean)))];
  const artists = ["all", ...Array.from(new Set(categoryProducts.map(p => p.artist).filter(Boolean)))];

  // Check if product is available
  const isProductAvailable = (product: any) => {
    const hasStock = !product.stock || product.stock > 0;
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    return hasStock && notExpired;
  };

  // Filter products
  let filteredProducts = categoryProducts.filter(product => {
    const subcategoryMatch = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
    const artistMatch = selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    return subcategoryMatch && artistMatch && searchMatch;
  });

  // Sort products - Available products first
  filteredProducts = [...filteredProducts].sort((a, b) => {
    const aAvailable = isProductAvailable(a);
    const bAvailable = isProductAvailable(b);
    
    // Push unavailable products to the end
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    
    // Then apply user's sort preference
    if (sortBy === "price-asc") {
      return a.price - b.price;
    } else if (sortBy === "price-desc") {
      return b.price - a.price;
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{CATEGORY_TITLES[category || ""]}</h1>
          <p className="text-muted-foreground">
            Khám phá các sản phẩm {CATEGORY_TITLES[category || ""].toLowerCase()}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm, artist, phân loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            
            {/* Subcategory Dropdown */}
            {subcategories.length > 1 && (
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedSubcategory} onValueChange={(value) => { setSelectedSubcategory(value); handleFilterChange(); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Phân loại nhỏ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phân loại</SelectItem>
                    {subcategories.slice(1).map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Artist Filter */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedArtist} onValueChange={(value) => { setSelectedArtist(value); handleFilterChange(); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Artist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả Artist</SelectItem>
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
          {(selectedSubcategory !== "all" || selectedArtist !== "all") && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              {selectedSubcategory !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setSelectedSubcategory("all"); handleFilterChange(); }}
                >
                  {selectedSubcategory} ✕
                </Button>
              )}
              {selectedArtist !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setSelectedArtist("all"); handleFilterChange(); }}
                >
                  {selectedArtist} ✕
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
