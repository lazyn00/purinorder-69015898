import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
// THAY ĐỔI DÒNG NÀY: Thêm ArrowUpWideNarrow và ArrowDownWideNarrow
import { Search, ChevronRight, ArrowLeft, SlidersHorizontal, ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Link, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Products() {
  const { products, isLoading } = useCart();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  // Get unique artists for filter
  const uniqueArtists = useMemo(() => {
    const artists = new Set<string>();
    products.forEach(p => {
      if (p.artist) artists.add(p.artist);
    });
    return Array.from(artists).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (searchQuery !== "") {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryParam) {
        if (categoryParam === 'outfit') {
          if (!(product.category?.toLowerCase().includes('outfit') || product.category?.toLowerCase().includes('doll'))) return false;
        } else if (categoryParam === 'merch') {
          if (!product.category?.toLowerCase().includes('merch')) return false;
        } else if (categoryParam === 'other') {
          if (product.category?.toLowerCase().includes('outfit') ||
              product.category?.toLowerCase().includes('doll') ||
              product.category?.toLowerCase().includes('merch')) return false;
        }
      }

      // Artist filter
      if (selectedArtist !== "all") {
        if (product.artist !== selectedArtist) return false;
      }

      return true;
    });

    // Sort products
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, searchQuery, categoryParam, selectedArtist, sortBy]);

  // Group products by main categories
  const outfitDoll = filteredProducts.filter(p =>
    p.category?.toLowerCase().includes('outfit') ||
    p.category?.toLowerCase().includes('doll')
  );
  const merch = filteredProducts.filter(p =>
    p.category?.toLowerCase().includes('merch')
  );
  const other = filteredProducts.filter(p =>
    !p.category?.toLowerCase().includes('outfit') &&
    !p.category?.toLowerCase().includes('doll') &&
    !p.category?.toLowerCase().includes('merch')
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  const CategorySection = ({ title, products, categoryKey }: { title: string; products: any[]; categoryKey: string }) => {
    if (products.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Link to={`/products?category=${categoryKey}`}>
            <Button variant="ghost" className="gap-2">
              Xem thêm <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {products.slice(0, 8).map((product) => (
              <div key={product.id} className="w-[250px] flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  };

  // Get category title
  const getCategoryTitle = () => {
    if (categoryParam === 'outfit') return 'Outfit & Doll';
    if (categoryParam === 'merch') return 'Merch';
    if (categoryParam === 'other') return 'Khác';
    return null;
  };

  // Hàm hiển thị icon sắp xếp
  const SortIcon = () => {
    if (sortBy === 'price-asc') {
        return <ArrowUpWideNarrow className="h-4 w-4" />;
    }
    if (sortBy === 'price-desc') {
        return <ArrowDownWideNarrow className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {categoryParam ? (
          <div className="mb-8">
            <Link to="/products">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
            </Link>
            <h1 className="text-4xl font-bold mb-4">{getCategoryTitle()}</h1>
          </div>
        ) : (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Sản phẩm</h1>
            <p className="text-muted-foreground">
              Order sản phẩm K-pop, C-pop, Anime từ Taobao, PDD, Douyin, XHS, 1688
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
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

        {/* Category Sections or Grid */}
        {searchQuery === "" && !categoryParam ? (
          <>
            <CategorySection title="Outfit & Doll" products={outfitDoll} categoryKey="outfit" />
            <CategorySection title="Merch" products={merch} categoryKey="merch" />
            <CategorySection title="Khác" products={other} categoryKey="other" />
          </>
        ) : (
          <>
            {/* Filter and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Tất cả nhóm nhạc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhóm nhạc</SelectItem>
                    {uniqueArtists.map((artist) => (
                      <SelectItem key={artist} value={artist}>
                        {artist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* THAY ĐỔI Ở KHỐI NÀY */}
              <div className="flex items-center gap-2">
                {/* Loại bỏ chữ "Sắp xếp:" và thay bằng icon nếu có sắp xếp */}
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {SortIcon()}
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Mặc định" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Mặc định</SelectItem>
                    <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                    <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* KẾT THÚC THAY ĐỔI */}

            </div>

            {/* Product Grid - Shopee style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
