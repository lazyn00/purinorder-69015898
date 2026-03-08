import React from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, CalendarOff, ArrowLeft, Share2, Eye, Copy, Facebook } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const getVariantStock = (product: Product, variantName: string): number | undefined => {
    if (!product.variants || product.variants.length === 0) return product.stock;
    const variant = product.variants.find(v => v.name === variantName);
    if (variant && variant.stock !== undefined) return variant.stock;
    return product.stock;
};

// Emoji mapping by category/subcategory
const getCategoryEmoji = (category?: string, subcategory?: string): string => {
  const text = `${category || ''} ${subcategory || ''}`.toLowerCase();
  if (text.includes('chó') || text.includes('dog') || text.includes('puppy')) return '🐶';
  if (text.includes('mèo') || text.includes('cat') || text.includes('kitty')) return '🐱';
  if (text.includes('gấu') || text.includes('bear')) return '🐻';
  if (text.includes('thỏ') || text.includes('bunny') || text.includes('rabbit')) return '🐰';
  if (text.includes('gà') || text.includes('chicken')) return '🐔';
  if (text.includes('vịt') || text.includes('duck')) return '🦆';
  if (text.includes('cáo') || text.includes('fox')) return '🦊';
  if (text.includes('heo') || text.includes('pig')) return '🐷';
  if (text.includes('bò') || text.includes('cow')) return '🐮';
  if (text.includes('cừu') || text.includes('sheep')) return '🐑';
  if (text.includes('sư tử') || text.includes('lion')) return '🦁';
  if (text.includes('khủng long') || text.includes('dino')) return '🦕';
  if (text.includes('cá') || text.includes('fish')) return '🐟';
  if (text.includes('bướm') || text.includes('butterfly')) return '🦋';
  if (text.includes('ong') || text.includes('bee')) return '🐝';
  if (text.includes('hoa') || text.includes('flower')) return '🌸';
  if (text.includes('trái cây') || text.includes('fruit')) return '🍓';
  if (text.includes('bánh') || text.includes('cake')) return '🍰';
  return '💛'; // default
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, products, isLoading } = useCart();
  const { toast } = useToast();
  
  // Capture referral code từ URL nếu có
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

  // Reset all state when product id changes
  useEffect(() => {
    setQuantity(1);
    setSelectedVariant("");
    setSelectedOptions({});
    setCurrentPrice(0);
    setAvailableStock(undefined);
    setCurrent(0);
    setIsExpired(false);
    setHighlightVariant(false);
  }, [id]);

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
      const { error } = await supabase.from('product_views').insert({ product_id: productId });
      if (error) console.error("Error recording view:", error);
    };
    
    const fetchViewCount = async () => {
      const { count, error } = await supabase
        .from('product_views')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);
      
      if (!error) {
        setViewCount(count || 0);
      }
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
    if (carouselApi && product?.variantImageMap && selectedVariant) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) carouselApi.scrollTo(imageIndex);
    }
  }, [selectedVariant, carouselApi, product]);

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
      toast({ title: "Vui lòng chọn phân loại", description: "Bạn cần chọn phân loại sản phẩm", variant: "destructive" });
      setHighlightVariant(true);
      variantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightVariant(false), 2000);
      return;
    }
    if (availableStock !== undefined && quantity > availableStock) {
      toast({ title: "Không đủ hàng", description: `Chỉ còn ${availableStock} sản phẩm`, variant: "destructive" });
      return;
    }

    const productToAdd = {
      ...product,
      price: currentPrice,
      priceDisplay: `${currentPrice.toLocaleString('vi-VN')}đ`
    };
    
    addToCart(productToAdd, quantity, selectedVariant || product.name);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${product.name} x${quantity}` });
  };

  const incrementQuantity = () => setQuantity(prev => (availableStock !== undefined && prev + 1 > availableStock) ? prev : prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${product?.name} - ${currentPrice.toLocaleString('vi-VN')}đ`;
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, text: shareText, url: shareUrl }); } catch (error) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Đã copy link" });
    }
  };

  const emoji = getCategoryEmoji(product?.category, product?.subcategory);

  // --- CẬP NHẬT: Format bài Facebook mới ---
  const generateFacebookPost = (customCta?: string) => {
    if (!product) return "";
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const statusPrefix = product.status ? `[${product.status.toLowerCase()}] ` : "";
    const title = product.name;

    // Cụm 1: Thông tin chi tiết (Master, Artist, Size)
    const details = [
      product.master ? `Master: ${product.master}` : null,
      product.artist ? `Thuộc tính: ${product.artist}` : null,
      product.size ? `Kích thước: ${product.size}` : null
    ].filter(Boolean).join('\n');

    // Cụm 2: Giá và Bao gồm
    const priceInfo = [
      `Giá: ${currentPrice.toLocaleString('vi-VN')}k ${product.feesIncluded ? 'ff' : 'chưa ff'}`,
      product.includes ? `Bao gồm: ${product.includes}` : null
    ].filter(Boolean).join('\n');

    // Cụm 3: Deadline
    const deadlineText = product.orderDeadline 
      ? `🔚 Deadline: ${new Date(product.orderDeadline).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric', year: 'numeric' }).replace(',', '')}`
      : null;

    // Cụm 4: Lưu ý
    let notes = "";
    if (product.productionTime) {
        notes = `❗️Lưu ý:\n• Thời gian sản xuất: ${product.productionTime}\n• Only ck, có nhận cọc 50% hoàn trong 1 tháng`;
    }

    const cta = customCta || "Order ngay tại link hoặc ib Purin hỗ trợ nhaa 💖";
    
    // Ghép tất cả các cụm lại, cách nhau 2 dòng (\n\n) để tạo khoảng trống
    return [
      `${statusPrefix}${title} ${emoji}`,
      `🍮 Link order: ${productUrl}`,
      details,
      priceInfo,
      deadlineText,
      notes,
      cta,
      "#plushdoll #purin_doll #order #purin_order #doll"
    ].filter(Boolean).join('\n\n');
  };

  const generateThreadsPost = (customCta?: string) => {
    if (!product) return "";
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const title = product.name;
    const priceText = `${currentPrice.toLocaleString('vi-VN')} VND ${product.feesIncluded ? '(ff)' : '+ phí nđ'}`;
    const deadlineInfo = product.orderDeadline 
      ? `\n\n🔚 Deadline: ${new Date(product.orderDeadline).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' }).replace(',', '')}`
      : "";
    const productionInfo = product.productionTime ? `\n\n❗️Sản xuất ${product.productionTime}, only ck, có cọc 50%` : "";
    const cta = customCta || "Xinh đẹp 10 điểm, chấm";
    
    return `${title} ${emoji}

🏷️ ${priceText}${deadlineInfo}${productionInfo}

${cta} ${productUrl}`;
  };

  const handleCopyFacebookPost = () => {
    const post = generateFacebookPost();
    navigator.clipboard.writeText(post);
    toast({ title: "Đã copy bài Facebook", description: "Dán vào bài đăng của bạn" });
  };

  const handleCopyThreadsPost = () => {
    const post = generateThreadsPost();
    navigator.clipboard.writeText(post);
    toast({ title: "Đã copy bài Threads", description: "Dán vào bài đăng của bạn" });
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
          
          {/* --- CỘT ẢNH --- */}
          <div className="space-y-4">
            <div className="relative">
                <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                    {product.images.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="relative overflow-hidden rounded-lg border flex items-center justify-center bg-muted/20 w-full">
                            <img
                                src={image}
                                alt={`${product.name} - ${index + 1}`}
                                className="w-auto h-auto max-w-full max-h-[350px] md:max-h-[400px] object-contain"
                            />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                {product.images.length > 1 && (
                    <>
                    <CarouselPrevious className="left-2 opacity-70 hover:opacity-100 h-8 w-8" />
                    <CarouselNext className="right-2 opacity-70 hover:opacity-100 h-8 w-8" />
                    </>
                )}
                </Carousel>
                {count > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium pointer-events-none z-10">
                        {current}/{count}
                    </div>
                )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`
                        flex-shrink-0 cursor-pointer rounded-md overflow-hidden border transition-all w-14 h-14 box-content
                        ${index + 1 === current ? 'border-primary opacity-100 ring-1 ring-primary' : 'border-transparent opacity-60 hover:opacity-100'}
                    `}
                    onClick={() => carouselApi?.scrollTo(index)}
                  >
                    <img src={image} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- CỘT THÔNG TIN --- */}
          <div className="space-y-5">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-start gap-2">
                 <div className="space-y-1">
                    {product.status && <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 mb-1">{product.status}</Badge>}
                    <h1 className="text-lg md:text-2xl font-bold leading-tight text-foreground">{product.name}</h1>
                    
                    <div className="flex items-center gap-1 text-muted-foreground text-sm pt-1">
                      <Eye className="h-4 w-4" />
                      <span>{viewCount.toLocaleString('vi-VN')} lượt xem</span>
                    </div>

                    {product.master && <p className="text-muted-foreground text-xs pt-1">Master: {product.master}</p>}
                 </div>
                 <div className="flex items-center gap-1 -mt-1">
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                         <Copy className="h-4 w-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={handleCopyFacebookPost} className="gap-2 cursor-pointer">
                         <Facebook className="h-4 w-4 text-blue-600" />
                         <span>Xuất bài Facebook</span>
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={handleCopyThreadsPost} className="gap-2 cursor-pointer">
                         <span className="h-4 w-4 flex items-center justify-center text-xs font-bold">@</span>
                         <span>Xuất bài Threads</span>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                   <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8 text-muted-foreground"><Share2 className="h-4 w-4" /></Button>
                 </div>
              </div>
            </div>

            {/* Giá tiền */}
            <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
              <div className="flex items-baseline gap-2">
                  <p className={`text-2xl md:text-3xl font-extrabold ${isExpired ? 'text-muted-foreground line-through decoration-2' : 'text-primary'}`}>
                    {currentPrice.toLocaleString('vi-VN')}<span className="text-base font-bold underline ml-0.5">đ</span>
                  </p>
                  {isExpired 
                    ? <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">HẾT HẠN</span>
                    : <span className="text-[11px] text-muted-foreground">*{product.feesIncluded ? 'Full phí' : 'Chưa full phí'}</span>
                  }
              </div>
              {product.orderDeadline && <div className="mt-2"><OrderCountdown deadline={product.orderDeadline} onExpired={() => setIsExpired(true)} /></div>}
            </div>
            
            {/* --- KHUNG THÔNG TIN CỐ ĐỊNH (Always Show - Fill "Không" if empty) --- */}
            <div className="border rounded-lg divide-y divide-border/60">
              
              {/* 1. MÔ TẢ SẢN PHẨM */}
              <div className="p-3 md:p-4 flex items-baseline">
                <span className="font-medium text-sm text-muted-foreground w-32 flex-shrink-0">Mô tả</span>
                <span className="text-sm text-foreground/90">
                  {product.description ? (
                    typeof product.description === 'string' 
                      ? product.description.split(/\r?\n|\\n/).filter(line => line.trim()).join(' ')
                      : product.description.join(' ') 
                  ) : "Không"}
                </span>
              </div>

              {/* 2. KÍCH THƯỚC */}
              <div className="p-3 md:p-4 flex items-baseline">
                <span className="font-medium text-sm text-muted-foreground w-32 flex-shrink-0">Kích thước</span>
                <span className="text-sm text-foreground/90">{product.size || "Không"}</span>
              </div>

              {/* 3. BAO GỒM */}
              <div className="p-3 md:p-4 flex items-baseline">
                <span className="font-medium text-sm text-muted-foreground w-32 flex-shrink-0">Bao gồm</span>
                <span className="text-sm text-foreground/90">{product.includes || "Không"}</span>
              </div>

              {/* 4. THỜI GIAN SẢN XUẤT */}
              <div className="p-3 md:p-4 flex items-baseline">
                <span className="font-medium text-sm text-muted-foreground w-32 flex-shrink-0">Thời gian SX</span>
                <span className="text-sm text-foreground/90">{product.productionTime || "Không"}</span>
              </div>
            </div>

            {/* Phân loại */}
            <div 
              ref={variantRef}
              className={`space-y-3 pt-2 transition-all duration-300 ${highlightVariant ? 'ring-2 ring-primary ring-offset-2 rounded-lg p-2 bg-primary/5 animate-pulse' : ''}`}
            >
              {product.optionGroups && product.optionGroups.length > 0 && (
                product.optionGroups.map((group) => (
                  <div key={group.name}>
                    <Label className="text-sm font-medium mb-1.5 block text-muted-foreground">{group.name}</Label>
                    <Select value={selectedOptions[group.name]} onValueChange={(value) => handleOptionChange(group.name, value)}>
                      <SelectTrigger className="w-full h-10 text-sm"><SelectValue placeholder={`Chọn ${group.name}`} /></SelectTrigger>
                      <SelectContent>
                        {group.options.map((option) => <SelectItem key={option} value={option} className="text-sm">{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}

              {(!product.optionGroups || product.optionGroups.length === 0) && product.variants && product.variants.length > 1 && (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block text-muted-foreground">Phân loại</Label>
                  <Select value={selectedVariant} onValueChange={(value) => handleVariantChange(value)}>
                    <SelectTrigger className="w-full h-11 text-sm">
                        <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                    <SelectContent>
                        {product.variants.map((variant) => {
                           const variantImageIndex = product.variantImageMap?.[variant.name];
                           const variantImage = variantImageIndex !== undefined ? product.images[variantImageIndex] : null;
                           const isOutOfStock = variant.stock !== undefined && variant.stock <= 0;
                           return (
                               <SelectItem 
                                 key={variant.name} 
                                 value={variant.name} 
                                 disabled={isOutOfStock}
                                 className="cursor-pointer py-2"
                               >
                                   <div className="flex items-center gap-2">
                                       {variantImage && (
                                           <img src={variantImage} alt="" className="w-8 h-8 rounded object-cover border border-slate-100" />
                                       )}
                                       <span className="text-sm font-medium">{variant.name}</span>
                                       {isOutOfStock && <span className="ml-auto text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">HẾT</span>}
                                   </div>
                               </SelectItem>
                           )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Số lượng */}
            <div className="flex items-center justify-between border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">Số lượng</Label>
              <div className="flex items-center gap-3">
                {availableStock !== undefined && (
                    <span className="text-xs text-muted-foreground text-right">
                        {availableStock > 0 ? `Kho: ${availableStock}` : <span className="text-red-500 font-medium">Hết hàng</span>}
                    </span>
                )}
                <div className="flex items-center border rounded-md h-9">
                    <Button variant="ghost" size="icon" onClick={decrementQuantity} disabled={quantity <= 1 || availableStock === 0} className="h-full w-8 rounded-none"><Minus className="h-3 w-3" /></Button>
                    <Input 
                        type="number" 
                        min="1" 
                        max={availableStock} 
                        value={quantity} 
                        onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setQuantity(availableStock !== undefined ? Math.min(val, availableStock) : val);
                        }}
                        className="w-12 text-center border-0 h-full focus-visible:ring-0 rounded-none px-0 text-sm font-medium" 
                    />
                    <Button variant="ghost" size="icon" onClick={incrementQuantity} disabled={availableStock !== undefined && quantity >= availableStock} className="h-full w-8 rounded-none"><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>

            {/* Nút Mua - Luôn hiện */}
            <div className="space-y-2">
              <Button 
                onClick={handleAddToCart} 
                className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20 h-11 text-base font-semibold" 
                size="lg"
                disabled={isExpired || availableStock === 0}
              >
                <ShoppingCart className="h-5 w-5" /> 
                {isExpired ? "Đã hết hạn order" : availableStock === 0 ? "Hết hàng tạm thời" : "Thêm vào giỏ"}
              </Button>
              
              {(isExpired || availableStock === 0) && (
                <ProductNotificationForm productId={product.id} productName={product.name} />
              )}
              
              <Button onClick={() => navigate("/products")} variant="ghost" className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">Xem thêm sản phẩm khác</Button>
            </div>
          </div>
        </div>

        {/* Sản phẩm liên quan (cùng master) */}
        {product.master && (() => {
          const validStatuses = ['Sẵn', 'Đặt hàng', 'Sắp đóng order'];
          const relatedProducts = products.filter(p => 
            p.id !== product.id && 
            p.master === product.master &&
            p.status && validStatuses.includes(p.status)
          );
          if (relatedProducts.length === 0) return null;
          return (
            <div className="mt-10 border-t pt-8">
              <h2 className="text-lg font-bold mb-4 text-foreground">Sản phẩm cùng master</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
