import React from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
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

    const productToAdd = { ...product, price: currentPrice, priceDisplay: `${currentPrice.toLocaleString('vi-VN')}đ` };
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 gap-1 pl-0 h-auto py-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> <span className="text-sm">Quay lại</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
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
                          <div className="relative overflow-hidden rounded-xl border flex items-center justify-center bg-muted/20 w-full aspect-square">
                              <img src={image} alt={`${product.name}`} className="w-full h-full object-contain" />
                              
                              {/* Overlay Phân loại và Giá */}
                              {variantName && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                  <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">Đang chọn phân loại</p>
                                  <p className="text-white text-lg font-bold truncate">{variantName}</p>
                                  <p className="text-primary-foreground text-xl font-black mt-1">
                                    {currentPrice.toLocaleString('vi-VN')}đ
                                  </p>
                                </div>
                              )}
                          </div>
                        </CarouselItem>
                      );
                    })}
                </CarouselContent>
                {product.images.length > 1 && (
                    <>
                    <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 bg-white/80 backdrop-blur-sm border-none shadow-md" />
                    <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 bg-white/80 backdrop-blur-sm border-none shadow-md" />
                    </>
                )}
                </Carousel>
                {count > 0 && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg font-bold z-10 shadow-sm border border-white/10">
                        {current}/{count}
                    </div>
                )}
            </div>
          </div>

          {/* CỘT THÔNG TIN */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-start gap-2">
                 <div className="space-y-1">
                    {product.status && <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 mb-1">{product.status}</Badge>}
                    <h1 className="text-xl md:text-2xl font-black leading-tight text-foreground tracking-tight">{product.name}</h1>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs pt-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{viewCount.toLocaleString('vi-VN')} lượt xem</span>
                    </div>

                    {product.master && (
                      <Link 
                        to={`/shop/${slugify(product.master)}`} 
                        className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-bold pt-2 group"
                      >
                        <Store className="h-4 w-4" />
                        <span>Master: {product.master}</span>
                      </Link>
                    )}
                 </div>
                 <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
                    <Share2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-muted/50 shadow-sm">
              <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-black tracking-tighter ${isExpired ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                    {currentPrice.toLocaleString('vi-VN')}<span className="text-lg font-bold underline ml-0.5">đ</span>
                  </p>
                  {isExpired 
                    ? <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">Hết hạn</span>
                    : <span className="text-[11px] font-medium text-muted-foreground">*{product.feesIncluded ? 'Full phí' : 'Chưa full phí'}</span>
                  }
              </div>
              {product.orderDeadline && <div className="mt-3"><OrderCountdown deadline={product.orderDeadline} onExpired={() => setIsExpired(true)} /></div>}
            </div>
            
            <div className="border rounded-xl overflow-hidden divide-y divide-border/40 bg-card">
              <div className="p-4 flex items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground w-24 flex-shrink-0">Mô tả</span>
                <span className="text-sm text-foreground/90 font-medium">{product.description || "—"}</span>
              </div>
              <div className="p-4 flex items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground w-24 flex-shrink-0">Kích thước</span>
                <span className="text-sm text-foreground/90 font-medium">{product.size || "—"}</span>
              </div>
              <div className="p-4 flex items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground w-24 flex-shrink-0">Thời gian SX</span>
                <span className="text-sm text-foreground/90 font-medium">{product.productionTime || "—"}</span>
              </div>
            </div>

            <div ref={variantRef} className={`space-y-4 pt-2 ${highlightVariant ? 'ring-2 ring-primary/50 rounded-xl p-3 animate-pulse bg-primary/5' : ''}`}>
              {product.optionGroups?.map((group) => (
                <div key={group.name} className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{group.name}</Label>
                  <Select value={selectedOptions[group.name]} onValueChange={(value) => handleOptionChange(group.name, value)}>
                    <SelectTrigger className="w-full h-11 rounded-lg border-muted-foreground/20 focus:ring-primary"><SelectValue placeholder={`Chọn ${group.name}`} /></SelectTrigger>
                    <SelectContent className="rounded-xl">{group.options.map((option) => <SelectItem key={option} value={option} className="rounded-md">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              {(!product.optionGroups || product.optionGroups.length === 0) && product.variants && product.variants.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phân loại</Label>
                  <Select value={selectedVariant} onValueChange={handleVariantChange}>
                    <SelectTrigger className="w-full h-12 rounded-lg"><SelectValue placeholder="Chọn phân loại" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                        {product.variants.map((variant) => (
                          <SelectItem key={variant.name} value={variant.name} disabled={variant.stock !== undefined && variant.stock <= 0} className="rounded-md">
                              <div className="flex items-center gap-3 py-1">
                                  {product.variantImageMap?.[variant.name] !== undefined && <img src={product.images[product.variantImageMap[variant.name]]} className="w-10 h-10 rounded-md object-cover border shadow-sm" />}
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold">{variant.name}</span>
                                    <span className="text-xs text-muted-foreground">{variant.price.toLocaleString('vi-VN')}đ</span>
                                  </div>
                              </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Số lượng mua</Label>
              <div className="flex items-center gap-4">
                {availableStock !== undefined && <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">{availableStock > 0 ? `Tồn kho: ${availableStock}` : <span className="text-red-500">Hết hàng</span>}</span>}
                <div className="flex items-center border rounded-lg h-10 bg-background shadow-sm overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={decrementQuantity} disabled={quantity <= 1} className="h-full rounded-none hover:bg-muted"><Minus className="h-3 w-3" /></Button>
                    <Input type="number" value={quantity} readOnly className="w-12 text-center border-0 h-full font-bold focus-visible:ring-0" />
                    <Button variant="ghost" size="icon" onClick={incrementQuantity} disabled={availableStock !== undefined && quantity >= availableStock} className="h-full rounded-none hover:bg-muted"><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleAddToCart} 
                className="w-full shadow-xl shadow-primary/20 h-14 text-base font-black text-white rounded-xl transition-all active:scale-[0.98]" 
                size="lg" 
                disabled={isExpired || availableStock === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2 text-white fill-white" /> 
                {isExpired ? "ĐÃ HẾT HẠN ORDER" : availableStock === 0 ? "HIỆN ĐÃ HẾT HÀNG" : "THÊM VÀO GIỎ HÀNG"}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 text-sm font-bold border-2 border-dashed border-primary/30 text-primary rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-colors"
                onClick={() => navigate("/products")}
              >
                TIẾP TỤC MUA HÀNG
              </Button>

              {(isExpired || availableStock === 0) && <ProductNotificationForm productId={product.id} productName={product.name} />}
            </div>
          </div>
        </div>

        {/* Sản phẩm liên quan (Cùng Master) */}
        {product.master && (() => {
          const related = products.filter(p => 
            p.id !== product.id && 
            p.master === product.master && 
            ['Sẵn', 'Đặt hàng', 'Order', 'Pre-order', 'Deal'].includes(p.status || '')
          );
          
          if (related.length === 0) return null;

          return (
            <div className="mt-20 pt-10 border-t border-border/60">
              <div className="flex items-end justify-between mb-8 px-1">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">Sản phẩm liên quan</h2>
                  <p className="text-sm text-muted-foreground font-medium">Bộ sưu tập khác từ Master <span className="text-primary font-bold">{product.master}</span></p>
                </div>
                <Link 
                  to={`/shop/${slugify(product.master)}`} 
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all"
                >
                  Xem shop <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative group/scroll">
                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
                  {related.map(p => (
                    <div 
                      key={p.id} 
                      className="flex-shrink-0 w-[170px] md:w-[240px] snap-start transition-transform duration-300 hover:-translate-y-1"
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
                {/* Hiệu ứng bóng mờ gợi ý cuộn tiếp trên mobile */}
                <div className="absolute right-0 top-0 bottom-8 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
