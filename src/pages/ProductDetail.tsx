import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
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
        // Không có variants, dùng stock chung
        return product.stock;
    }

    const variant = product.variants.find(v => v.name === variantName);
    
    if (variant) {
        // Ưu tiên stock riêng của variant
        if (variant.stock !== undefined) {
            return variant.stock;
        }
    }
    
    // Nếu variant không có stock riêng, dùng stock chung
    return product.stock;
};


export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, products, isLoading } = useCart();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>(""); 
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isExpired, setIsExpired] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | undefined>(undefined);

  // 1. useEffect để tìm sản phẩm khi 'products' tải xong
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const foundProduct = products.find(p => p.id == Number(id)); 
      setProduct(foundProduct);
    }
  }, [isLoading, products, id]);

  // 2. useEffect để cập nhật state ban đầu khi 'product' được tìm thấy
  useEffect(() => {
    if (product) {
      setCurrentPrice(product.price);
      
      // Cập nhật trạng thái hết hạn order
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) setIsExpired(true);
      } else if (product.status === "Sẵn") {
         setIsExpired(false);
      }
      
      // Khởi tạo selectedOptions cho 2+ phân loại
      if (product.optionGroups && product.optionGroups.length > 0) {
        const initialOptions = product.optionGroups.reduce((acc, group) => {
            acc[group.name] = "";
            return acc;
        }, {} as { [key: string]: string });
        setSelectedOptions(initialOptions);
        setAvailableStock(undefined); // Reset stock vì cần chọn đủ options

      } 
      // Trường hợp 1 variant (hoặc 0 variant)
      else if (product.variants && product.variants.length === 1) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant.name);
          setCurrentPrice(firstVariant.price);
          // Set stock cho variant duy nhất
          setAvailableStock(getVariantStock(product, firstVariant.name));
      } else {
        // Không có variants (>1 variant được chọn qua dropdown), dùng stock chung
        setAvailableStock(product.stock);
      }
    }
  }, [product]);

  // 3. useEffect xử lý 2+ phân loại (optionGroups) - TÌM VARIANT & CẬP NHẬT STOCK
  useEffect(() => {
    if (!product || !product.optionGroups || product.optionGroups.length === 0) return;

    const allOptionsSelected = Object.values(selectedOptions).every(val => val !== "");

    if (allOptionsSelected) {
        // Xây dựng tên variant từ options đã chọn (ví dụ: Màu-Đỏ)
        const constructedName = product.optionGroups
            .map(group => selectedOptions[group.name])
            .join("-");
        
        const variant = product.variants.find(v => v.name === constructedName);
        
        if (variant) {
          setCurrentPrice(variant.price);
          setSelectedVariant(variant.name);

            // CẬP NHẬT AVAILABLE STOCK KHI CHỌN ĐỦ OPTIONS
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
          setAvailableStock(undefined); // Không tìm thấy variant, reset stock
          console.warn("Tổ hợp không hợp lệ:", constructedName);
        }
    } else {
        setSelectedVariant(""); // Chưa chọn đủ, không có variant nào được chọn
        setAvailableStock(undefined);
    }
  }, [selectedOptions, product, carouselApi]);

  // 4. useEffect xử lý cuộn ảnh cho 1 phân loại đơn giản
  useEffect(() => {
    if (carouselApi && product?.variantImageMap && selectedVariant) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [selectedVariant, carouselApi, product]);
  
  // --- HÀM XỬ LÝ ---

  // Xử lý khi chọn variant đơn (1 phân loại) - CẬP NHẬT STOCK
  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variant = product?.variants.find(v => v.name === variantName);
    if (variant) {
      setCurrentPrice(variant.price);
    }

    // CẬP NHẬT AVAILABLE STOCK KHI CHỌN VARIANT
    if (product) {
        setAvailableStock(getVariantStock(product, variantName));
    }
    
    // Logic cuộn ảnh (giữ nguyên)
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
        title: "Vui lòng chọn đủ phân loại",
        description: "Bạn cần chọn tất cả các phân loại sản phẩm",
        variant: "destructive"
      });
      return;
    }
    
    // Kiểm tra stock chỉ khi đã chọn variant (hoặc không có variant) và stock được xác định
    if (availableStock !== undefined && quantity > availableStock) {
      toast({
        title: "Không đủ hàng",
        description: `Chỉ còn ${availableStock} sản phẩm`,
        variant: "destructive"
      });
      return;
    }

    const correctPrice = currentPrice;

    const productToAdd = {
      ...product,
      price: correctPrice,
      priceDisplay: `${correctPrice.toLocaleString('vi-VN')}đ`
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
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Đã copy link",
        description: "Link sản phẩm đã được copy vào clipboard",
      });
    }
  };

  // --- RENDER ---

  // (Xử lý loading)
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
          <LoadingPudding />
        </div>
      </Layout>
    );
  }

  // (Xử lý không tìm thấy)
  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
          <Button onClick={() => navigate("/products")}>Quay lại</Button>
        </div>
      </Layout>
    );
  }

  // (Render khi đã có 'product')
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Carousel (Giữ định dạng ảnh gốc, giới hạn 500px) */}
          <div className="space-y-4">
            <Carousel className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative overflow-hidden rounded-lg border flex items-center justify-center bg-muted/20">
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-auto h-auto max-w-full max-h-[500px] object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {product.images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => carouselApi?.scrollTo(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumb ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border hover:border-primary transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {/* (Đọc tag động) */}
              {product.status && (
                <Badge variant="secondary" className="mb-3">
                  {product.status}
                </Badge>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                  {product.master && (
                    <p className="text-muted-foreground text-sm">
                      Master: {product.master}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="flex-shrink-0"
                  title="Chia sẻ sản phẩm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className={`text-4xl font-bold ${isExpired ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                {currentPrice.toLocaleString('vi-VN')}đ
              </p>
              {isExpired ? (
                    <p className="text-lg font-bold text-red-500 mt-2">ĐÃ HẾT HẠN ORDER</p>
                ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                  *{product.feesIncluded ? 'Đã full phí dự kiến' : 'Chưa full phí'}
                </p>
                )}
            </div>

            {/* Countdown Timer */}
            {product.orderDeadline && (
              <OrderCountdown 
                deadline={product.orderDeadline} 
                onExpired={() => setIsExpired(true)} 
              />
            )}
            
            
            {product.description && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  {(typeof product.description === 'string' 
                    ? product.description.split('\n').filter(line => line.trim()) 
                    : product.description
                  ).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* (Logic 1 hoặc 2 phân loại) */}
            <div className="border-t pt-4 space-y-4">
              {/* (Trường hợp 2+ phân loại - ID 4) */}
              {product.optionGroups && product.optionGroups.length > 0 && (
                product.optionGroups.map((group) => (
                  <div key={group.name}>
                    <Label htmlFor={`variant-${group.name}`} className="text-base font-semibold">
                      {group.name} *
                    </Label>
                    <Select 
                      value={selectedOptions[group.name]} 
                      onValueChange={(value) => handleOptionChange(group.name, value)}
                    >
                      <SelectTrigger id={`variant-${group.name}`} className="mt-2">
                        <SelectValue placeholder={`Chọn ${group.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {group.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}

              {/* (Trường hợp 1 phân loại - ID 3) */}
              {(!product.optionGroups || product.optionGroups.length === 0) && product.variants && product.variants.length > 1 && (
                <div>
                  <Label htmlFor="variant" className="text-base font-semibold">
                    Phân loại *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {product.variants.map((variant) => {
                      const variantImageIndex = product.variantImageMap?.[variant.name];
                      const variantImage = variantImageIndex !== undefined ? product.images[variantImageIndex] : null;
                      const isOutOfStock = variant.stock !== undefined && variant.stock <= 0;
                      const isSelected = selectedVariant === variant.name;
                      
                      return (
                        <div key={variant.name} className="relative">
                          <button
                            type="button"
                            onClick={() => !isOutOfStock && handleVariantChange(variant.name)}
                            disabled={isOutOfStock}
                            className={`
                              relative flex flex-col items-center p-2 rounded-lg border-2 transition-all w-full
                              ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                              ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {variantImage && (
                              <div className="relative group">
                                <img
                                  src={variantImage}
                                  alt={variant.name}
                                  className="w-16 h-16 object-cover rounded mb-1"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(variantImage, '_blank');
                                  }}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
                                >
                                  <span className="text-white text-xs">🔍 Zoom</span>
                                </button>
                              </div>
                            )}
                            <span className={`text-sm text-center ${isSelected ? 'font-semibold' : ''}`}>
                              {variant.name}
                            </span>
                            {isOutOfStock && (
                              <span className="text-xs text-red-500">Hết hàng</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="quantity" className="text-base font-semibold">
                Số lượng
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1 || availableStock === 0}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={availableStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setQuantity(availableStock !== undefined ? Math.min(val, availableStock) : val);
                  }}
                  className="w-20 text-center"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={incrementQuantity}
                  disabled={availableStock !== undefined && quantity >= availableStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {availableStock !== undefined && (
                <p className="text-sm mt-2 font-medium">
                  {availableStock > 0 ? (
                        <span className="text-green-600">Còn {availableStock} sản phẩm</span>
                    ) : (
                        <span className="text-red-600">Đã hết hàng</span>
                    )}
                </p>
              )}
              {availableStock === undefined && product.variants.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">Vui lòng chọn phân loại để xem số lượng tồn kho.</p>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              {/* Hiển thị form đăng ký thông báo nếu hết hàng hoặc hết hạn */}
              {(isExpired || availableStock === 0) ? (
                <>
                  <Button 
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-primary gap-2"
                    size="lg"
                    disabled={true}
                  >
                    {isExpired ? <CalendarOff className="h-5 w-4" /> : <ShoppingCart className="h-5 w-5" />}
                    {isExpired ? "Đã hết hạn order" : "Đã hết hàng"}
                  </Button>
                  <ProductNotificationForm 
                    productId={product.id} 
                    productName={product.name}
                  />
                </>
              ) : (
                <Button 
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-primary gap-2"
                  size="lg"
                  disabled={product.variants.length > 0 && !selectedVariant}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ hàng
                </Button>
              )}
              <Button 
                onClick={() => navigate("/products")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {product.master && products.filter(p => p.master === product.master && p.id !== product.id).length > 0 && (
          <div className="border-t pt-12 mt-12">
            <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {products
                  .filter(p => p.master === product.master && p.id !== product.id)
                  .map((relatedProduct) => (
                    <div key={relatedProduct.id} className="flex-shrink-0 w-[200px] snap-start">
                      <ProductCard product={relatedProduct} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
