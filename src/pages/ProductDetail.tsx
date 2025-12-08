import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, CalendarOff, ArrowLeft, Share2 } from "lucide-react";
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

// Hàm helper để xác định stock khả dụng chính xác
const getVariantStock = (product: Product, variantName: string): number | undefined => {
    if (!product.variants || product.variants.length === 0) {
        return product.stock;
    }
    const variant = product.variants.find(v => v.name === variantName);
    if (variant && variant.stock !== undefined) {
        return variant.stock;
    }
    return product.stock;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, products, isLoading } = useCart();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  
  // --- STATE CHO CAROUSEL (SỐ TRANG) ---
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>(""); 
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isExpired, setIsExpired] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | undefined>(undefined);

  // 1. useEffect tìm sản phẩm
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const foundProduct = products.find(p => p.id == Number(id)); 
      setProduct(foundProduct);
    }
  }, [isLoading, products, id]);

  // 2. useEffect cập nhật state ban đầu
  useEffect(() => {
    if (product) {
      setCurrentPrice(product.price);
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) setIsExpired(true);
      } else if (product.status === "Sẵn") {
         setIsExpired(false);
      }
      
      if (product.optionGroups && product.optionGroups.length > 0) {
        const initialOptions = product.optionGroups.reduce((acc, group) => {
            acc[group.name] = "";
            return acc;
        }, {} as { [key: string]: string });
        setSelectedOptions(initialOptions);
        setAvailableStock(undefined);
      } 
      else if (product.variants && product.variants.length === 1) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant.name);
          setCurrentPrice(firstVariant.price);
          setAvailableStock(getVariantStock(product, firstVariant.name));
      } else {
        setAvailableStock(product.stock);
      }
    }
  }, [product]);

  // 3. useEffect logic phân loại
  useEffect(() => {
    if (!product || !product.optionGroups || product.optionGroups.length === 0) return;

    const allOptionsSelected = Object.values(selectedOptions).every(val => val !== "");

    if (allOptionsSelected) {
        const constructedName = product.optionGroups
            .map(group => selectedOptions[group.name])
            .join("-");
        
        const variant = product.variants.find(v => v.name === constructedName);
        
        if (variant) {
          setCurrentPrice(variant.price);
          setSelectedVariant(variant.name);
          setAvailableStock(getVariantStock(product, variant.name));
          
          if (carouselApi && product.variantImageMap) {
            const imageIndex = product.variantImageMap[variant.name];
            if (imageIndex !== undefined) {
                carouselApi.scrollTo(imageIndex);
            }
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

  // 4. useEffect cuộn ảnh variant đơn
  useEffect(() => {
    if (carouselApi && product?.variantImageMap && selectedVariant) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [selectedVariant, carouselApi, product]);

  // 5. useEffect xử lý SỐ TRANG (Indicator)
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);
  
  // --- HANDLERS ---
  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variant = product?.variants.find(v => v.name === variantName);
    if (variant) {
      setCurrentPrice(variant.price);
    }
    if (product) {
        setAvailableStock(getVariantStock(product, variantName));
    }
    if (carouselApi && product?.variantImageMap) {
      const imageIndex = product.variantImageMap[variantName];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  };

  const handleOptionChange = (groupName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: value,
    }));
  };
  
  const handleAddToCart = () => {
    if (!product) return; 
    const hasVariants = product.variants && product.variants.length > 0;
    const isReadyToAdd = !hasVariants || (hasVariants && selectedVariant);

    if (!isReadyToAdd) {
      toast({
        title: "Vui lòng chọn phân loại",
        description: "Bạn cần chọn phân loại sản phẩm trước khi thêm vào giỏ",
        variant: "destructive"
      });
      return;
    }
    
    if (availableStock !== undefined && quantity > availableStock) {
      toast({
        title: "Không đủ hàng",
        description: `Chỉ còn ${availableStock} sản phẩm`,
        variant: "destructive"
      });
      return;
    }

    const productToAdd = {
      ...product,
      price: currentPrice,
      priceDisplay: `${currentPrice.toLocaleString('vi-VN')}đ`
    };
    
    addToCart(productToAdd, quantity, selectedVariant || product.name);
    toast({
      title: "Đã thêm vào giỏ hàng!",
      description: selectedVariant 
        ? `${product.name} (${selectedVariant}) x${quantity}`
        : `${product.name} x${quantity}`,
    });
  };

  const incrementQuantity = () => {
        setQuantity(prev => {
            if (availableStock !== undefined && prev + 1 > availableStock) {
                return prev;
            }
            return prev + 1;
        });
    }

  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${product?.name} - ${currentPrice.toLocaleString('vi-VN')}đ`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Đã copy link" });
    }
  };

  if (isLoading) return <Layout><div className="container mx-auto py-12 flex justify-center h-[50vh]"><LoadingPudding /></div></Layout>;
  if (!product) return <Layout><div className="container mx-auto py-12 text-center"><h1 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h1><Button onClick={() => navigate("/products")}>Quay lại</Button></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* --- CAROUSEL ẢNH (SIZE NHỎ GỌN NHƯ TAOBAO) --- */}
          <div className="space-y-4">
            <div className="relative">
                <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                    {product.images.map((image, index) => (
                    <CarouselItem key={index}>
                        {/* - Bỏ aspect-square, dùng max-h-[400px] để giới hạn chiều cao (nhỏ hơn 500px cũ).
                           - Giữ flex center để căn giữa ảnh.
                        */}
                        <div className="relative overflow-hidden rounded-lg border flex items-center justify-center bg-muted/20 w-full">
                            <img
                                src={image}
                                alt={`${product.name} - ${index + 1}`}
                                // Giới hạn chiều cao 400px, ảnh tự co giãn theo tỷ lệ gốc
                                className="w-auto h-auto max-w-full max-h-[400px] object-contain"
                            />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                {product.images.length > 1 && (
                    <>
                    <CarouselPrevious className="left-4 opacity-70 hover:opacity-100" />
                    <CarouselNext className="right-4 opacity-70 hover:opacity-100" />
                    </>
                )}
                </Carousel>
                
                {/* --- SỐ TRANG (1/5) --- */}
                {count > 0 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-medium pointer-events-none z-10">
                        {current}/{count}
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`
                        flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all w-16 h-16 box-content
                        ${index + 1 === current ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}
                    `}
                    onClick={() => carouselApi?.scrollTo(index)}
                  >
                    <img src={image} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- PRODUCT INFO --- */}
          <div className="space-y-6">
            <div>
              {product.status && <Badge variant="secondary" className="mb-2">{product.status}</Badge>}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{product.name}</h1>
                  {product.master && <p className="text-muted-foreground text-sm">Master: {product.master}</p>}
                </div>
                <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className={`text-3xl font-bold ${isExpired ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                {currentPrice.toLocaleString('vi-VN')}đ
              </p>
              {isExpired 
                ? <p className="text-base font-bold text-red-500 mt-1">ĐÃ HẾT HẠN ORDER</p>
                : <p className="text-xs text-muted-foreground mt-1">*{product.feesIncluded ? 'Đã full phí dự kiến' : 'Chưa full phí'}</p>
              }
            </div>

            {product.orderDeadline && <OrderCountdown deadline={product.orderDeadline} onExpired={() => setIsExpired(true)} />}
            
            {product.description && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Mô tả sản phẩm</h3>
                <ul className="text-foreground/90 space-y-1 list-disc list-inside text-sm md:text-base">
                  {(typeof product.description === 'string' ? product.description.split(/\r?\n|\\n/).filter(line => line.trim()) : product.description).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* --- THỜI GIAN SẢN XUẤT (Luôn hiện) --- */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Thời gian sản xuất</h3>
              <p className="text-foreground/90 text-sm md:text-base">
                {product.productionTime ? product.productionTime : "Đang cập nhật"}
              </p>
            </div>

            {/* --- PHÂN LOẠI (Dropdown có ảnh) --- */}
            <div className="border-t pt-4 space-y-4">
              {product.optionGroups && product.optionGroups.length > 0 && (
                product.optionGroups.map((group) => (
                  <div key={group.name}>
                    <Label className="text-base font-semibold block mb-2">{group.name} *</Label>
                    <Select value={selectedOptions[group.name]} onValueChange={(value) => handleOptionChange(group.name, value)}>
                      <SelectTrigger className="w-full h-12 text-base"><SelectValue placeholder={`Chọn ${group.name}`} /></SelectTrigger>
                      <SelectContent>
                        {group.options.map((option) => <SelectItem key={option} value={option} className="py-3">{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}

              {(!product.optionGroups || product.optionGroups.length === 0) && product.variants && product.variants.length > 1 && (
                <div>
                  <Label className="text-base font-semibold block mb-3">Phân loại *</Label>
                  <Select value={selectedVariant} onValueChange={(value) => handleVariantChange(value)}>
                    <SelectTrigger className="w-full h-12 text-base">
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
                                 className="cursor-pointer py-3"
                               >
                                   <div className="flex items-center gap-3">
                                       {variantImage && (
                                           <img src={variantImage} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />
                                       )}
                                       <span className="font-medium">{variant.name}</span>
                                       {isOutOfStock && <span className="ml-2 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">HẾT HÀNG</span>}
                                   </div>
                               </SelectItem>
                           )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold block mb-2">Số lượng</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" onClick={decrementQuantity} disabled={quantity <= 1 || availableStock === 0} className="h-10 w-10 rounded-none"><Minus className="h-4 w-4" /></Button>
                    <Input 
                        type="number" 
                        min="1" 
                        max={availableStock} 
                        value={quantity} 
                        onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setQuantity(availableStock !== undefined ? Math.min(val, availableStock) : val);
                        }}
                        className="w-14 text-center border-0 h-10 focus-visible:ring-0 rounded-none px-0" 
                    />
                    <Button variant="ghost" size="icon" onClick={incrementQuantity} disabled={availableStock !== undefined && quantity >= availableStock} className="h-10 w-10 rounded-none"><Plus className="h-4 w-4" /></Button>
                </div>
                {availableStock !== undefined && (
                    <span className="text-sm text-muted-foreground">
                        {availableStock > 0 ? `Còn ${availableStock} sản phẩm` : <span className="text-red-500 font-medium">Hết hàng</span>}
                    </span>
                )}
              </div>
            </div>

            <div className="border-t pt-6 space-y-3">
              {(isExpired || availableStock === 0) ? (
                <>
                  <Button disabled className="w-full bg-slate-200 text-slate-500 gap-2" size="lg">
                    {isExpired ? <CalendarOff className="h-5 w-4" /> : <ShoppingCart className="h-5 w-5" />}
                    {isExpired ? "Đã hết hạn order" : "Đã hết hàng"}
                  </Button>
                  <ProductNotificationForm productId={product.id} productName={product.name} />
                </>
              ) : (
                <Button 
                  onClick={handleAddToCart} 
                  className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20" 
                  size="lg"
                  disabled={product.variants.length > 0 && !selectedVariant}
                >
                  <ShoppingCart className="h-5 w-5" /> Thêm vào giỏ hàng
                </Button>
              )}
              <Button onClick={() => navigate("/products")} variant="outline" className="w-full" size="lg">Tiếp tục mua sắm</Button>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {product.master && products.filter(p => p.master === product.master && p.id !== product.id).length > 0 && (
          <div className="border-t pt-12 mt-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {products.filter(p => p.master === product.master && p.id !== product.id).map((related) => (
                    <div key={related.id} className="flex-shrink-0 w-[180px] md:w-[220px] snap-start"><ProductCard product={related} /></div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
