import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react"; // Thêm useMemo
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, ArrowUpDown, Search, ArrowLeft } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useParams, useNavigate } from "react-router-dom";
// 1. Thêm import supabase
import { supabase } from "@/integrations/supabase/client";

// Interface Product
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
    isUserListing?: boolean;
    listingId?: string; // Thêm trường này
    listingCode?: string; // Thêm trường này
}

// 2. Định nghĩa Interface cho User Listing từ Supabase
interface UserListing {
  id: string;
  listing_code: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string;
  tag: string;
  price: number | null;
  images: string[];
  variants: { name: string; price: number }[] | null;
  status: string;
  created_at: string;
}

const CATEGORY_MAP: { [key: string]: string } = {
  "outfit-doll": "Outfit & Doll",
  "merch": "Merch",
  "fashion": "Thời Trang",
  "khac": "Khác",
};

const CATEGORY_TITLES: { [key: string]: string } = {
  "outfit-doll": "Outfit & Doll",
  "merch": "Merch",
  "fashion": "Thời Trang",
  "khac": "Khác",
  "pass-gom": "Mua bán trao đổi"
};

// 3. Hàm chuyển đổi User Listing thành Product (Copy từ Products.tsx)
const convertListingToProduct = (listing: UserListing): Product => {
  const variants = listing.variants || [];
  const minPrice = variants.length > 0 
    ? Math.min(...variants.map(v => v.price))
    : (listing.price || 0);
  
  return {
    id: -parseInt(listing.id.replace(/-/g, '').slice(0, 8), 16),
    name: listing.name,
    price: listing.price || minPrice,
    images: listing.images as string[],
    category: listing.category,
    subcategory: listing.subcategory,
    artist: '',
    variants: variants.map(v => ({ name: v.name, price: v.price })),
    status: listing.tag, 
    orderDeadline: null,
    stock: 1, 
    isUserListing: true,
    listingId: listing.id,
    listingCode: listing.listing_code,
  } as Product;
};

const getAvailableStock = (product: Product): number => {
    if (product.isUserListing) return 1;

    const hasVariantStock = product.variants?.some(v => v.stock !== undefined);
    if (hasVariantStock) {
        return product.variants
            ?.filter(v => v.stock !== undefined)
            .reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    } 
    if (product.stock === undefined || product.stock === null) return 999999;
    return product.stock;
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { products: contextProducts, isLoading: isContextLoading } = useCart(); // Đổi tên biến để tránh nhầm lẫn
  
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 50;
  
  // 4. State để lưu user listings fetched từ Supabase
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const categoryName = category ? CATEGORY_MAP[category] : "";
  
  // 5. Fetch User Listings từ Supabase
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        // Chỉ fetch nếu đang ở trang Pass/Gom hoặc muốn hiển thị chung (tùy logic, ở đây fetch hết cho chắc)
        const { data, error } = await supabase
          .from('user_listings')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUserListings((data as any) || []);
      } catch (error) {
        console.error('Error fetching user listings:', error);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchUserListings();
  }, []);

  // 6. Gộp Context Products và User Listings
  const allProducts = useMemo(() => {
    const convertedListings = userListings.map(convertListingToProduct);
    return [...contextProducts, ...convertedListings];
  }, [contextProducts, userListings]);

  // === LOGIC LỌC SẢN PHẨM ===
  const categoryProducts = allProducts.filter((p: any) => {
    if (category === 'pass-gom') {
        return p.isUserListing === true;
    }
    // Lọc theo category thường VÀ loại trừ user listing (để tránh trùng lặp nếu logic khác thay đổi)
    return p.category === categoryName && !p.isUserListing;
  });

  const subcategories = ["all", ...Array.from(new Set(categoryProducts.map((p: any) => p.subcategory).filter(Boolean)))];
  const artists = ["all", ...Array.from(new Set(categoryProducts.map((p: any) => p.artist).filter(Boolean)))];

  const isProductAvailable = (product: Product) => {
    const availableStock = getAvailableStock(product);
    const hasStock = availableStock > 0;
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    return hasStock && notExpired;
  };

  let filteredProducts = categoryProducts.filter((product: any) => {
    const subcategoryMatch = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
    const artistMatch = selectedArtist === "all" || product.artist === selectedArtist;
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    return subcategoryMatch && artistMatch && searchMatch;
  });

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
    return Math.abs(b.id) - Math.abs(a.id);
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Check loading của cả 2 nguồn
  if (isContextLoading || loadingListings) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

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
                ? "Khám phá các sản phẩm đang tìm chủ"
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
