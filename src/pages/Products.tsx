import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useCart, Product } from "@/contexts/CartContext";
import { CategoryPreview } from "@/components/CategoryPreview";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// --- IMPORT POPUP DIALOG VÀ FILE CHI TIẾT SẢN PHẨM ---
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetail from "@/pages/ProductDetail"; 

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

  // --- STATE LƯU ID ĐỂ MỞ POPUP XEM SẢN PHẨM ---
  const [popupProductId, setPopupProductId] = useState<string | null>(null);

  // Lắng nghe sự kiện click trên toàn bộ danh sách sản phẩm
  useEffect(() => {
    const handleProductCardClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Kiểm tra nếu click trúng thẻ Link dẫn đến trang sản phẩm chi tiết
      const productLink = target.closest('a[href^="/product/"]') as HTMLAnchorElement;
      
      if (productLink) {
        e.preventDefault(); // Ngăn trình duyệt chuyển hướng URL làm reload trang
        const segments = productLink.pathname.split("/");
        const idStr = segments[segments.length - 1];
        if (idStr) {
          setPopupProductId(idStr); // Gán ID để mở Bung lụa cửa sổ Dialog Popup
        }
      }
    };

    document.addEventListener("click", handleProductCardClick);
    return () => document.removeEventListener("click", handleProductCardClick);
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
            <CategoryPreview title="Tiệm in Purin" categorySlug="tiem-in-purin" products={tiemInPurin} />
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

      {/* --- CỬA SỔ POPUP DIALOG CHUẨN VITE KHÔNG LÀM NHẢY URL TRANG --- */}
      <Dialog 
        open={popupProductId !== null} 
        onOpenChange={(isOpen) => {!isOpen && setPopupProductId(null)}}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 rounded-xl">
          <button 
            onClick={() => setPopupProductId(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 z-50"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Dùng cổng Portal để nạp thẳng giao diện ProductDetail kèm ID custom */}
          {popupProductId && (
            <div className="pt-2">
              <ProductDetail overrideId={popupProductId} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
