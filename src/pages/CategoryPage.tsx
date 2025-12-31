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

// Cập nhật interface Product để bao gồm isUserListing
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
    isUserListing?: boolean; // Thêm trường này
}

const CATEGORY_MAP: { [key: string]: string } = {
  "outfit-doll": "Outfit & Doll",
  "merch": "Merch",
  "fashion": "Thời Trang",
  "khac": "Khác",
  // Không cần map pass-gom ở đây vì logic lọc sẽ xử lý riêng
};

const CATEGORY_TITLES: { [key: string]: string } = {
  "outfit-doll": "Outfit & Doll",
  "merch": "Merch",
  "fashion": "Thời Trang",
  "khac": "Khác",
  "pass-gom": "Pass / Gom" // Thêm tiêu đề cho trang Pass/Gom
};

// === HÀM HELPER: KIỂM TRA TỒN KHO ===
const getAvailableStock = (product: Product): number => {
    // User listing luôn available nếu được hiển thị (đã lọc approved ở context/fetching)
    if (product.isUserListing) return 1;

    const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
    
    if (hasVariantStock) {
        return product.variants
            ?.filter(v => v.stock !== undefined)
            .reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    } 

    if (product.stock === undefined || product.stock === null) {
        return 999999; 
    }
    
    return product.stock;
}

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
  
  // === LOGIC LỌC SẢN PHẨM THEO DANH MỤC ===
  const categoryProducts = products.filter((p: any) => {
    if (category === 'pass-gom') {
        // Nếu đang ở trang Pass/Gom, lọc các sản phẩm là User Listing
        return p.isUserListing === true;
    }
    // Ngược lại lọc theo tên danh mục thông thường, và LOẠI TRỪ user listing (để không bị trùng)
    return p.category === categoryName && !p.isUserListing;
  });

  // Get unique subcategories and artists based on the filtered list
  const subcategories = ["all", ...Array.from(new Set(categoryProducts.map((p: any) => p.subcategory).filter(Boolean)))];
  const artists = ["all", ...Array.from(new Set(categoryProducts.map((p: any) => p.artist).filter(Boolean)))];

  const isProductAvailable = (product: Product) => {
    const availableStock = getAvailableStock(product);
    const hasStock = availableStock > 0;
    // User listing không check deadline theo cách thông thường, hoặc deadline null
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    return hasStock && notExpired;
  };

  // Filter products by user selection (Subcategory, Artist, Search)
  let filteredProducts = categoryProducts.filter((product: any) => {
    const subcategoryMatch = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
    const artistMatch = selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    return subcategoryMatch && artistMatch && searchMatch;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
    const aAvailable = isProductAvailable(a as Product);
    const bAvailable = isProductAvailable(b as Product);
    
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    
    if (sortBy === "price-asc") {
      return a.price - b.price;
    } else if (sortBy === "price-desc") {
      return b.price - a.price;
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return Math.abs(b.id) - Math.abs(a.id); // User listing IDs are negative, using abs for magnitude comparison if needed, or just standard sort
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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

  // Tiêu đề hiển thị
  const displayTitle = category ? CATEGORY_TITLES[category] : "";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="mb-6 gap-2 pl-0 hover:pl-2 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang sản phẩm
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{displayTitle}</h1>
          <p className="text-muted-foreground">
            {category === 'pass-gom' 
                ? "Sản phẩm được đăng bán/gom bởi cộng đồng"
                : `Khám phá các sản phẩm ${displayTitle.toLowerCase()}`
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-xl mx-auto">
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
                    {subcategories.slice(1).map((sub: any) => (
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
                  <SelectValue placeholder="Artist / Nhóm" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">Tất cả Artist</SelectItem>
                  {artists.slice(1).map((artist: any) => (
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
                  <SelectItem value="default">Mặc định (Mới nhất)</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          {(selectedSubcategory !== "all" || selectedArtist !== "all") && (
            <div className="flex gap-2 items-center mt-4 justify-center md:justify-start">
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              {selectedSubcategory !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setSelectedSubcategory("all"); handleFilterChange(); }}
                  className="h-7 text-xs"
                >
                  {selectedSubcategory} ✕
                </Button>
              )}
              {selectedArtist !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setSelectedArtist("all"); handleFilterChange(); }}
                  className="h-7 text-xs"
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
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
          <div className="text-center py-20 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm nào</p>
            <Button variant="link" onClick={() => navigate('/products')}>Xem tất cả sản phẩm</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
