import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, ArrowUpDown, Search, ArrowLeft } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useParams, useNavigate } from "react-router-dom";

// Định nghĩa kiểu Product để truy cập 'variants'
interface Product {
    id: number;
    name: string;
    price: number;
    images: string[];
    category: string;
    subcategory?: string;
    artist?: string;
    variants: { name: string; price: number; stock?: number }[];
    status?: string;
    orderDeadline?: string | null;
    stock?: number;
}


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

// === HÀM HELPER MỚI: KIỂM TRA TỒN KHO BAO GỒM CẢ VARIANT STOCK ===
const getAvailableStock = (product: Product): number => {
    const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
    
    if (hasVariantStock) {
        // Tính TỔNG stock từ các variant có stock riêng
        return product.variants
            ?.filter(v => v.stock !== undefined)
            .reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    } 

    // Nếu không có thông tin stock, coi là không giới hạn (trả về số lớn)
    // Chỉ trả về 0 nếu stock = 0 (hết hàng rõ ràng)
    if (product.stock === undefined || product.stock === null) {
        return 999999; // Không giới hạn
    }
    
    return product.stock;
}
// === KẾT THÚC HÀM HELPER MỚI ===


export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { products, isLoading } = useCart();
  
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 50;

  const categoryName = category ? CATEGORY_MAP[category] : "";
  
  // Filter products by main category
  const categoryProducts = products.filter(p => p.category === categoryName);

  // Get unique subcategories and artists for this category
  const subcategories = ["all", ...Array.from(new Set(categoryProducts.map(p => p.subcategory).filter(Boolean)))];
  const artists = ["all", ...Array.from(new Set(categoryProducts.map(p => p.artist).filter(Boolean)))];

  // Check if product is available (ĐÃ SỬA DỤNG HÀM MỚI)
  const isProductAvailable = (product: Product) => {
    const availableStock = getAvailableStock(product); // Sử dụng stock tổng
    const hasStock = availableStock > 0;
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    return hasStock && notExpired;
  };

  // Filter products - LUÔN lọc sản phẩm hết hàng/hết hạn
  let filteredProducts = categoryProducts.filter((product: Product) => {
    const subcategoryMatch = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
    const artistMatch = selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    const availableMatch = isProductAvailable(product); // Chỉ hiển thị sản phẩm còn hàng/còn hạn
    return subcategoryMatch && artistMatch && searchMatch && availableMatch;
  });

  // Sort products - Available products first (ĐÃ SỬ DỤNG HÀM MỚI)
  filteredProducts = [...filteredProducts].sort((a, b) => {
    const aAvailable = isProductAvailable(a as Product);
    const bAvailable = isProductAvailable(b as Product);
    
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
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang sản phẩm
        </Button>

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

        {/* Filters and Sort - 2 rows layout */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Subcategory Dropdown */}
            {subcategories.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={selectedSubcategory} onValueChange={(value) => { setSelectedSubcategory(value); handleFilterChange(); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Phân loại nhỏ" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">Tất cả phân loại</SelectItem>
                    {subcategories.slice(1).map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Artist Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={selectedArtist} onValueChange={(value) => { setSelectedArtist(value); handleFilterChange(); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Thuộc tính" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">Tất cả Thuộc tính</SelectItem>
                  {artists.slice(1).map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
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
            <div className="flex gap-2 items-center mt-4">
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
