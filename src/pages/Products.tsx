import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useCart, Product } from "@/contexts/CartContext";
import { CategoryPreview } from "@/components/CategoryPreview";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// Interface cho user listing từ Supabase
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

// Chuyển đổi UserListing thành Product format
const convertListingToProduct = (listing: UserListing): Product => {
  const variants = listing.variants || [];
  const minPrice = variants.length > 0 
    ? Math.min(...variants.map(v => v.price))
    : (listing.price || 0);
  
  return {
    id: -parseInt(listing.id.replace(/-/g, '').slice(0, 8), 16), // Negative ID để phân biệt với products thường
    name: listing.name,
    price: listing.price || minPrice,
    description: listing.description || '',
    images: listing.images as string[],
    category: listing.category,
    subcategory: listing.subcategory,
    artist: '',
    variants: variants.map(v => ({ name: v.name, price: v.price })),
    optionGroups: [],
    feesIncluded: true,
    status: listing.tag, // Pass hoặc Gom
    orderDeadline: null,
    stock: 1, // Mặc định còn hàng
    priceDisplay: `${minPrice.toLocaleString('vi-VN')}đ`,
    // Thêm thông tin để route đúng
    listingId: listing.id,
    listingCode: listing.listing_code,
    isUserListing: true,
  } as Product & { listingId: string; listingCode: string; isUserListing: boolean };
};

export default function Products() {
  const { products, isLoading } = useCart();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Fetch approved user listings
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_listings')
          .select('id, listing_code, name, description, category, subcategory, tag, price, images, variants, status, created_at')
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

  // Chuyển đổi user listings thành products
  const listingProducts = useMemo(() => {
    return userListings.map(convertListingToProduct);
  }, [userListings]);

  // Kết hợp products từ Google Sheet và user listings
  const allProducts = useMemo(() => {
    return [...products, ...listingProducts];
  }, [products, listingProducts]);

  // === HÀM KIỂM TRA TÍNH KHẢ DỤNG CỦA SẢN PHẨM ===
  const isProductAvailable = (product: any) => {
    // User listings luôn available nếu đã approved
    if (product.isUserListing) return true;
    
    // Kiểm tra deadline
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    
    // Kiểm tra stock: nếu không có thông tin stock, coi là có hàng
    let hasStock = true;
    if (product.stock !== undefined && product.stock !== null) {
      hasStock = product.stock > 0;
    } else if (product.variants?.some((v: any) => v.stock !== undefined)) {
      // Nếu có variant với stock, tính tổng
      const totalStock = product.variants
        .filter((v: any) => v.stock !== undefined)
        .reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
      hasStock = totalStock > 0;
    }
    // Nếu không có thông tin stock nào, coi là có hàng (hasStock = true)
    
    return hasStock && notExpired;
  };

  // === SẮP XẾP SẢN PHẨM: CÒN HÀNG LÊN TRƯỚC, SAU ĐÓ THEO ID GIẢM DẦN ===
  const sortedProducts = [...allProducts].sort((a, b) => {
    const aAvailable = isProductAvailable(a);
    const bAvailable = isProductAvailable(b);
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    // User listings đứng trước (ID âm)
    if ((a as any).isUserListing && !(b as any).isUserListing) return -1;
    if (!(a as any).isUserListing && (b as any).isUserListing) return 1;
    // Default: sort by ID descending (newest first)
    return Math.abs(b.id) - Math.abs(a.id);
  });

  // === BƯỚC LỌC 1: Lọc theo từ khóa tìm kiếm (Áp dụng trên danh sách đã sắp xếp) ===
  const searchMatchedProducts = searchQuery
    ? sortedProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.status?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedProducts;

  // === BƯỚC LỌC 2: LUÔN ẨN SẢN PHẨM HẾT HÀNG/HẾT HẠN ===
  const filteredProducts = searchMatchedProducts.filter(isProductAvailable);

  // === NHÓM SẢN PHẨM THEO DANH MỤC LỚN ===
  const passGom = filteredProducts.filter(p => (p as any).isUserListing);
  const outfitDoll = filteredProducts.filter(p => p.category === "Outfit & Doll" && !(p as any).isUserListing);
  const merch = filteredProducts.filter(p => p.category === "Merch" && !(p as any).isUserListing);
  const fashion = filteredProducts.filter(p => p.category === "Thời trang" && !(p as any).isUserListing);
  const other = filteredProducts.filter(p => p.category === "Khác" && !(p as any).isUserListing);

  const isPageLoading = isLoading || loadingListings;

  if (isPageLoading) {
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
          {/* Pass/Gom từ người dùng */}
          {passGom.length > 0 && (
            <CategoryPreview
              title="Pass / Gom"
              categorySlug="pass-gom"
              products={passGom}
            />
          )}
          
          {outfitDoll.length > 0 && (
            <CategoryPreview
              title="Outfit & Doll"
              categorySlug="outfit-doll"
              products={outfitDoll}
            />
          )}
          {merch.length > 0 && (
            <CategoryPreview
              title="Merch"
              categorySlug="merch"
              products={merch}
            />
          )}
          {fashion.length > 0 && (
            <CategoryPreview
              title="Thời trang"
              categorySlug="thoi-trang"
              products={fashion}
            />
          )}
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
            <p className="text-muted-foreground">
              Không tìm thấy sản phẩm nào
              {searchQuery && ' khớp với từ khóa của bạn'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
