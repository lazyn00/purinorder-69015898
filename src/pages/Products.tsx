import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useCart, Product } from "@/contexts/CartContext";
import { CategoryPreview } from "@/components/CategoryPreview";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// --- IMPORT COMPONENT POPUP DIALOG VÀ COMPONENT CHI TIẾT SẢN PHẨM ---
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetailComponent from "@/pages/ProductDetail"; 

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

const convertListingToProduct = (listing: UserListing): Product => {
  const variants = listing.variants || [];
  const minPrice = variants.length > 0 
    ? Math.min(...variants.map(v => v.price))
    : (listing.price || 0);
  
  return {
    id: -parseInt(listing.id.replace(/-/g, '').slice(0, 8), 16),
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
    status: listing.tag, 
    orderDeadline: null,
    stock: 1, 
    priceDisplay: `${minPrice.toLocaleString('vi-VN')}đ`,
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
  const [searchParams] = useSearchParams();

  // --- STATE QUẢN LÝ ĐÓNG MỞ POPUP XEM NHANH SẢN PHẨM ---
  const [selectedPopupProductId, setSelectedPopupProductId] = useState<number | null>(null);

  // Bắt sự kiện click toàn cục lên các thẻ ProductCard con để mở Popup thay vì chuyển trang
  useEffect(() => {
    const handleProductClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Tìm thẻ link hoặc thẻ div chứa đường dẫn chi tiết sản phẩm /product/
      const anchor = target.closest('a[href^="/product/"]') as HTMLAnchorElement;
      
      if (anchor) {
        e.preventDefault(); // Chặn hành vi chuyển trang mặc định của trình duyệt
        const urlParts = anchor.pathname.split("/");
        const productId = Number(urlParts[urlParts.length - 1]);
        
        if (!isNaN(productId)) {
          setSelectedPopupProductId(productId); // Kích hoạt mở Popup sản phẩm
        }
      }
    };

    document.addEventListener("click", handleProductClick);
    return () => document.removeEventListener("click", handleProductClick);
  }, []);

  // Capture referral code from URL and store in localStorage
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('purin_referral_code', refCode);
      localStorage.setItem('purin_referral_timestamp', Date.now().toString());
      console.log('Referral code captured:', refCode);
    }
  }, [searchParams]);

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

  const listingProducts = useMemo(() => {
    return userListings.map(convertListingToProduct);
  }, [userListings]);

  const allProducts = useMemo(() => {
    return [...products, ...listingProducts];
  }, [products, listingProducts]);

  const isProductAvailable = (product: any) => {
    if (product.isUserListing) return true;
    if (product.status === "Ẩn") return false;
    const notExpired = !product.orderDeadline || new Date(product.orderDeadline) > new Date();
    const hasVariantStock = product.variants?.some((v: any) => v.stock !== undefined);
    let hasStock = false;
    if (hasVariantStock) {
      const totalStock = product.variants
        .filter((v: any) => v.stock !== undefined)
        .reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
      hasStock = totalStock > 0;
    } else if (product.stock !== undefined && product.stock !== null) {
      hasStock = product.stock > 0;
    }
    return hasStock && notExpired;
  };

  const sortedProducts = [...allProducts].sort((a, b) => {
    const aAvailable = isProductAvailable(a);
    const bAvailable = isProductAvailable(b);
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    if ((a as any).isUserListing && !(b as any).isUserListing) return -1;
    if (!(a as any).isUserListing && (b as any).isUserListing) return 1;
    return Math.abs(b.id) - Math.abs(a.id);
  });

  const searchMatchedProducts = searchQuery
    ? sortedProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.status?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedProducts;

  const filteredProducts = searchQuery 
    ? searchMatchedProducts 
    : searchMatchedProducts.filter(isProductAvailable);

  const passGom = filteredProducts.filter(p => (p as any).isUserListing);
  const outfitDoll = filteredProducts.filter(p => p.category === "Outfit & Doll" && !(p as any).isUserListing);
  const merch = filteredProducts.filter(p => p.category === "Merch" && !(p as any).isUserListing);
  const linhtinhxinhxinh = filteredProducts.filter(p => p.category === "Linh tinh xinh xinh" && !(p as any).isUserListing);
  const packageitems = filteredProducts.filter(p => p.category === "Đồ gói" && !(p as any).isUserListing);
  const tiemInPurin = filteredProducts.filter(p => p.category === "Tiệm in Purin" && !(p as any).isUserListing);
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

        <div className="space-y-16">
          {tiemInPurin.length > 0 && (
            <CategoryPreview title="Tiệm in Purin" categorySlug="pass-gom" products={tiemInPurin} />
          )}
          {outfitDoll.length > 0 && (
            <CategoryPreview title="Outfit & Doll" categorySlug="outfit-doll" products={outfitDoll} />
          )}
          {merch.length > 0 && (
            <CategoryPreview title="Merch" categorySlug="merch" products={merch} />
          )}
          {linhtinhxinhxinh.length > 0 && (
            <CategoryPreview title="Linh tinh xinh xinh" categorySlug="linh-tinh-xinh-xinh" products={linhtinhxinhxinh} />
          )}
          {packageitems.length > 0 && (
            <CategoryPreview title="Đồ gói" categorySlug="package-items" products={packageitems} />
          )}
          {fashion.length > 0 && (
            <CategoryPreview title="Thời trang" categorySlug="thoi-trang" products={fashion} />
          )}
          {other.length > 0 && (
            <CategoryPreview title="Khác" categorySlug="khac" products={other} />
          )}
          {passGom.length > 0 && (
            <CategoryPreview title="Pass / Gom" categorySlug="pass-gom" products={passGom} />
          )}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Không tìm thấy sản phẩm nào {searchQuery && ' khớp với từ khóa của bạn'}
            </p>
          </div>
        )}
      </div>

      {/* --- CỬA SỔ POPUP DIALOG HIỂN THỊ CHI TIẾT SẢN PHẨM KHÔNG RELOAD TRANG --- */}
      <Dialog 
        open={selectedPopupProductId !== null} 
        onOpenChange={(isOpen) => {!isOpen && setSelectedPopupProductId(null)}}
      >
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
          {/* Nút đóng góc tùy chỉnh thủ công nếu cần */}
          <button 
            onClick={() => setSelectedPopupProductId(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {/* Render trực tiếp trang chi tiết sản phẩm dựa trên ID được hook vào Popup bằng cơ chế Hack Overriding useParams */}
          {selectedPopupProductId && (
            <div className="product-popup-container">
              <HookProductParams productId={selectedPopupProductId}>
                <ProductDetailComponent />
              </HookProductParams>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// Component phụ trợ thông minh giúp ép Inject tham số `id` ảo của react-router-dom vào ProductDetail mà không cần đổi URL thực tế
function HookProductParams({ productId, children }: { productId: number; children: React.ReactNode }) {
  React.useMemo(() => {
    const ReactRouterDom = require("react-router-dom");
    const originalUseParams = ReactRouterDom.useParams;
    ReactRouterDom.useParams = () => ({ id: String(productId) });
    return () => { ReactRouterDom.useParams = originalUseParams; };
  }, [productId]);

  return <>{children}</>;
}
