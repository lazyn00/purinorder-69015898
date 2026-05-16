import React from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, ArrowLeft, Share2, Eye, Store, ChevronRight } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { OrderCountdown } from "@/components/OrderCountdown";
import { useCart, Product } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";
import { ProductNotificationForm } from "@/components/ProductNotificationForm";
import { MasterShippingProgress } from "@/components/MasterShippingProgress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

const slugify = (s: string) => {
  if (!s) return "shop";
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
};

const getVariantStock = (product: Product, variantName: string): number | undefined => {
    if (!product.variants || product.variants.length === 0) return product.stock;
    const variant = product.variants.find(v => v.name === variantName);
    if (variant && variant.stock !== undefined) return variant.stock;
    return product.stock;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, products, isLoading } = useCart();
  const { toast } = useToast();
  
  useReferralCapture();
  
  const [quantity, setQuantity] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>(""); 
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isExpired, setIsExpired] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | undefined>(undefined);
  const [viewCount, setViewCount] = useState(0);
  const [highlightVariant, setHighlightVariant] = useState(false);
  const variantRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuantity(1);
    setSelectedVariant("");
    setSelectedOptions({});
    setCurrentPrice(0);
    setAvailableStock(undefined);
    setCurrent(0);
    if (carouselApi) carouselApi.scrollTo(0);
    setIsExpired(false);
    setHighlightVariant(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id, carouselApi]);

  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const foundProduct = products.find(p => p.id == Number(id)); 
      setProduct(foundProduct);
    }
  }, [isLoading, products, id]);

  useEffect(() => {
    if (!id) return;
    const productId = Number(id);
    const recordView = async () => {
      await supabase.from('product_views').insert({ product_id: productId });
    };
    const fetchViewCount = async () => {
      const { count: total } = await supabase
        .from('product_views')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);
      setViewCount(total || 0);
    };
    recordView();
    fetchViewCount();
  }, [id]);

  useEffect(() => {
    if (product) {
      setCurrentPrice(product.price);
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) setIsExpired(true);
      } else if (product.status === "Sẵn") setIsExpired(false);
      
      if (product.optionGroups && product.optionGroups.length > 0) {
        const initialOptions = product.optionGroups.reduce((acc, group) => {
            acc[group.name] = "";
            return acc;
        }, {} as { [key: string]: string });
        setSelectedOptions(initialOptions);
        setAvailableStock(undefined);
      } else if (product.variants && product.variants.length === 1) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant.name);
          setCurrentPrice(firstVariant.price);
          setAvailableStock(getVariantStock(product, firstVariant.name));
      } else {
        setAvailableStock(product.stock);
      }
    }
  }, [product]);

  useEffect(() => {
    if (!product || !product.optionGroups || product.optionGroups.length === 0) return;
    const allOptionsSelected = Object.values(selectedOptions).every(val => val !== "");
    if (allOptionsSelected) {
        const constructedName = product.optionGroups.map(group => selectedOptions[group.name]).join("-");
        const variant = product.variants.find(v => v.name === constructedName);
        if (variant) {
          setCurrentPrice(variant.price);
          setSelectedVariant(variant.name);
          setAvailableStock(getVariantStock(product, variant.name));
          if (carouselApi && product.variantImageMap) {
            const imageIndex = product.variantImageMap[variant.name];
            if (imageIndex !== undefined) carouselApi.scrollTo(imageIndex);
          }
        } else {
          setSelectedVariant("");
          setCurrentPrice(product.price);
          setAvailableStock(undefined);
        }
    } else {
        setSelectedVariant("");
        setAvailableStock(undefined);
    }
  }, [selectedOptions, product, carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);
    carouselApi.on("select", () => setCurrent(carouselApi.selectedScrollSnap() + 1));
  }, [carouselApi]);
  
  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variant = product?.variants.find(v => v.name === variantName);
    if (variant) setCurrentPrice(variant.price);
    if (product) setAvailableStock(getVariantStock(product, variantName));
    
    if (carouselApi && product?.variantImageMap) {
        const imageIndex = product.variantImageMap[variantName];
        if (imageIndex !== undefined) carouselApi.scrollTo(imageIndex);
    }
  };

  const handleOptionChange = (groupName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [groupName]: value }));
  };
  
  const handleAddToCart = () => {
    if (!product) return; 
    const hasVariants = product.variants && product.variants.length > 0;
    const isReadyToAdd = !hasVariants || (hasVariants && selectedVariant);

    if (!isReadyToAdd) {
      toast({ title: "Vui lòng chọn phân loại", variant: "destructive" });
      setHighlightVariant(true);
      variantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightVariant(false), 2000);
      return;
    }
    if (availableStock !== undefined && quantity > availableStock) {
      toast({ title: "Không đủ hàng", description: `Chỉ còn ${availableStock} sản phẩm`, variant: "destructive" });
      return;
    }

    // Tính giá chính xác tại thời điểm add
    let finalPrice = currentPrice;
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.name === selectedVariant);
      if (variant && variant.price > 0) finalPrice = variant.price;
    }
    if (finalPrice === 0) finalPrice = product.price;

    const productToAdd = { ...product, price: finalPrice, priceDisplay: `${finalPrice.toLocaleString('vi-VN')}đ` };
    addToCart(productToAdd, quantity, selectedVariant || product.name);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${product.name} x${quantity}` });
  };

  const incrementQuantity = () => setQuantity(prev => (availableStock !== undefined && prev + 1 > availableStock) ? prev : prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, url: shareUrl }); } catch (error) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Đã copy link" });
    }
  };

  if (isLoading) return <Layout><div className="container mx-auto py-12 flex justify-center h-[50vh]"><LoadingPudding /></div></Layout>;
  if (!product) return <Layout><div className="container mx-auto py-12 text-center"><h1 className="text-xl font-bold mb-4">Không tìm thấy sản phẩm</h1><Button onClick={() => navigate("/products")}>Quay lại</Button></div></Layout>;

  const renderPrice = () => {
  if (product.price === 0 && (!product.variants || product.variants.length === 0)) return "Liên hệ";
  if (product.variants && product.variants.every(v => v.price === 0)) return "Liên hệ";
  if (selectedVariant && currentPrice > 0) return `${currentPrice.toLocaleString('vi-VN')}đ`;
  if (selectedVariant && currentPrice === 0) return "Liên hệ";
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return minPrice === 0 ? "Liên hệ" : `${minPrice.toLocaleString('vi-VN')}đ`;
    return `Từ ${minPrice.toLocaleString('vi-VN')}đ`;
  }
  return `${product.price.toLocaleString('vi-VN')}đ`;
};

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-5 py-4 md:py-10 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 gap-1 pl-0 h-auto py-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> <span className="text-sm">Quay lại</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 lg:gap-12">
          {/* CỘT ẢNH */}
          <div className="space-y-4">
            <div className="relative group">
                <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                    {product.images.map((image, index) => {
                      const variantName = product.variantImageMap 
                        ? Object.keys(product.variantImageMap).find(key => product.variantImageMap![key] === index)
                        : null;

                      return (
                        <CarouselItem key={index}>
                          <div className="relative overflow-hidden rounded-lg border flex items-center justify-center bg-muted/20 w-full">
                              <img src={image} alt={`${product.name}`} className="w-auto h-auto max-w-full max-h-[350px] md:max-h-[400px] object-contain" />
                              {variantName && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                  <p className="text-white text-xs font-medium opacity-80 uppercase tracking-wider line-clamp-1">{variantName}</p>
                                  <p className="text-white text-lg font-bold">{currentPrice > 0 ? currentPrice.toLocaleString('vi-VN') : product.price.toLocaleString('vi-VN')}đ</p>
                                </div>
                              )}
                          </div>
                        </CarouselItem>
                      );
                    })}
                </CarouselContent>
                {product.images.length > 1 && (
                    <>
                    <CarouselPrevious className="left-2 opacity-70 h-8 w-8" />
                    <CarouselNext className="right-2 opacity-70 h-8 w-8" />
                    </>
                )}
                </Carousel>
                {count > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium z-10">
                        {current}/{count}
                    </div>
                )}
            </div>
          </div>

          {/* CỘT THÔNG TIN */}
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                 <div className="space-y-1">
                    {product.status && <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 mb-1">{product.status}</Badge>}
                    <h1 className="text-xl md:text-2xl font-bold leading-tight text-foreground">{product.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm pt-1">
                      <div className="flex items-center gap-1"><Eye className="h-4 w-4" /> <span>{viewCount}</span></div>
                      {product.master && (
                        <Link to={`/shop/${slugify(product.master)}`} className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                          <Store className="h-4 w-4" /> <span>{product.master}</span>
                        </Link>
                      )}
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9 text-muted-foreground flex-shrink-0 border">
                    <Share2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>

            {product.master && (
              <MasterShippingProgress masterName={product.master} />
            )}

            <div className="bg-muted/30 p-4 rounded-lg border border-muted/50">
              <div className="flex items-baseline gap-2">
                  <p className={`text-2xl md:text-3xl font-extrabold ${isExpired ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                    {renderPrice()}
                  </p>
                  {isExpired && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase">Hết hạn</span>}
              </div>
              {product.orderDeadline && <div className="mt-2"><OrderCountdown deadline={product.orderDeadline} onExpired={() => setIsExpired(true)} /></div>}
            </div>
            
            <div className="border rounded-lg divide-y divide-border/60">
              <div className="p-3 md:p-4 flex gap-4"><span className="font-medium text-sm text-muted-foreground w-24 flex-shrink-0">Mô tả</span><span className="text-sm text-foreground/90">{product.description || "—"}</span></div>
              <div className="p-3 md:p-4 flex gap-4"><span className="font-medium text-sm text-muted-foreground w-24 flex-shrink-0">Kích thước</span><span className="text-sm text-foreground/90">{product.size || "—"}</span></div>
              <div className="p-3 md:p-4 flex gap-4">
  <span className="font-medium text-sm text-muted-foreground w-24 flex-shrink-0">Bao gồm</span>
  <span className="text-sm text-foreground/90">{product.includes || "—"}</span>
</div>
              <div className="p-3 md:p-4 flex gap-4"><span className="font-medium text-sm text-muted-foreground w-24 flex-shrink-0">Thời gian SX</span><span className="text-sm text-foreground/90">{product.productionTime || "—"}</span></div>
            </div>

            <div ref={variantRef} className={`space-y-4 ${highlightVariant ? 'ring-2 ring-primary rounded-lg p-2 animate-pulse' : ''}`}>
              {product.optionGroups?.map((group) => (
                <div key={group.name} className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">{group.name}</Label>
                  <Select value={selectedOptions[group.name]} onValueChange={(value) => handleOptionChange(group.name, value)}>
                    <SelectTrigger className="w-full h-11"><SelectValue placeholder={`Chọn ${group.name}`} /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {group.options.map((option) => (
                        <SelectItem key={option} value={option} className="py-3 whitespace-normal">
                          <span className="leading-snug block">{option}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {(!product.optionGroups || product.optionGroups.length === 0) && product.variants && product.variants.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Phân loại</Label>
                  <Select value={selectedVariant} onValueChange={handleVariantChange}>
                    <SelectTrigger className="w-full h-11"><SelectValue placeholder="Chọn phân loại" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {product.variants.map((variant) => (
                          <SelectItem key={variant.name} value={variant.name} disabled={variant.stock !== undefined && variant.stock <= 0} className="py-3 whitespace-normal">
                              <div className="flex items-center gap-3">
                                  {product.variantImageMap?.[variant.name] !== undefined && <img src={product.images[product.variantImageMap[variant.name]]} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                                  <span className="leading-snug block flex-1">{variant.name}</span>
                              </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-5">
              <Label className="text-sm font-semibold text-muted-foreground">Số lượng mua</Label>
              <div className="flex items-center gap-4">
                {availableStock !== undefined && <span className="text-xs font-medium text-muted-foreground">{availableStock > 0 ? `Kho: ${availableStock}` : <span className="text-red-500">Hết hàng</span>}</span>}
                <div className="flex items-center border rounded-md h-10 bg-background">
                    <Button variant="ghost" size="icon" onClick={decrementQuantity} disabled={quantity <= 1} className="h-full"><Minus className="h-3 w-3" /></Button>
                    <Input type="number" value={quantity} readOnly className="w-12 text-center border-0 h-full focus-visible:ring-0 font-bold" />
                    <Button variant="ghost" size="icon" onClick={incrementQuantity} disabled={availableStock !== undefined && quantity >= availableStock} className="h-full"><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button onClick={handleAddToCart} className="w-full shadow-lg h-12 text-base font-bold text-white uppercase tracking-wide" size="lg" disabled={isExpired || availableStock === 0}>
                <ShoppingCart className="h-5 w-5 mr-2" /> 
                {isExpired ? "Đã hết hạn order" : availableStock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
              </Button>
              <Button variant="outline" className="w-full h-12 text-sm font-bold border-dashed border-primary/40 text-primary hover:bg-primary/5 uppercase tracking-wide" onClick={() => navigate("/products")}>
                Tiếp tục mua hàng
              </Button>
              {(isExpired || availableStock === 0) && <ProductNotificationForm productId={product.id} productName={product.name} />}
            </div>
          </div>
        </div>

        {product.master && (() => {
          const related = products.filter(p => p.id !== product.id && p.master === product.master && ['Sẵn', 'Đặt hàng', 'Order', 'Pre-order', 'Deal'].includes(p.status || ''));
          if (related.length === 0) return null;
          return (
            <div className="mt-16 pt-8 border-t">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-bold text-foreground">Sản phẩm liên quan</h2>
                <Link to={`/shop/${slugify(product.master)}`} className="text-sm font-bold text-primary hover:underline">Xem tất cả</Link>
              </div>
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x scroll-smooth -mx-5 px-5 md:mx-0 md:px-0">
                  {related.map(p => <div key={p.id} className="flex-shrink-0 w-[160px] md:w-[220px] snap-start"><ProductCard product={p} /></div>)}
                </div>
                <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
