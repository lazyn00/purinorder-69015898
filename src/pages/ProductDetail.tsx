import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// (Thêm 2 icon này)
import { ShoppingCart, Minus, Plus, CalendarOff, ArrowLeft } from "lucide-react"; 
// (Đọc từ file .ts)
import { productsData } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // (Đọc từ productsData)
  const product = productsData.find(p => p.id === Number(id));

  // (Thêm các state mới)
  const [currentPrice, setCurrentPrice] = useState(product?.price || 0);
  const [selectedVariant, setSelectedVariant] = useState<string>(""); 
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    if (carouselApi && selectedVariant && product?.variantImageMap) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [selectedVariant, carouselApi, product]);

  // (useEffect mới để xử lý logic khi product tải xong)
  useEffect(() => {
    if (product) {
      setCurrentPrice(product.price);
      
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) setIsExpired(true);
      } else if (product.status === "Sẵn") {
         setIsExpired(false);
      }
      
      // (Logic đọc 2 phân loại)
      if (product.optionGroups && product.optionGroups.length > 0) {
        const initialOptions = product.optionGroups.reduce((acc, group) => {
            acc[group.name] = "";
            return acc;
        }, {} as { [key: string]: string });
        setSelectedOptions(initialOptions);
      } 
      // (Logic 1 phân loại)
      else if (product.variants && product.variants.length === 1) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant.name);
          setCurrentPrice(firstVariant.price);
      }
    }
  }, [product]);

  // (useEffect mới để xử lý khi chọn 2 phân loại)
  useEffect(() => {
    if (product?.optionGroups && product.optionGroups.length > 0) {
      const allOptionsSelected = Object.values(selectedOptions).every(val => val !== "");

      if (allOptionsSelected) {
        const constructedName = product.optionGroups
            .map(group => selectedOptions[group.name])
            .join("-");
        
        const variant = product.variants.find(v => v.name === constructedName);
        
        if (variant) {
          setCurrentPrice(variant.price);
          setSelectedVariant(variant.name);
          
          if (carouselApi && product.variantImageMap) {
            const imageIndex = product.variantImageMap[variant.name];
            if (imageIndex !== undefined) {
                carouselApi.scrollTo(imageIndex);
            }
          }
        } else {
          setSelectedVariant("");
          setCurrentPrice(product.price);
          console.warn("Tổ hợp không hợp lệ:", constructedName);
        }
      }
    }
  }, [selectedOptions, product, carouselApi]);
  
  // (Sửa lại handleAddToCart)
  const handleAddToCart = () => {
    if (!product) return;

    const hasVariants = product.variants && product.variants.length > 0;

    // (Kiểm tra selectedVariant)
    if (hasVariants && !selectedVariant) {
      toast({
        title: "Vui lòng chọn đủ phân loại",
        description: "Bạn cần chọn tất cả các phân loại sản phẩm",
        variant: "destructive"
      });
      return;
    }

    const correctPrice = currentPrice; // (Lấy giá động)

    const productToAdd = {
      ...product,
      price: correctPrice, // (Ghi đè giá)
      priceDisplay: `${correctPrice.toLocaleString('vi-VN')}đ`
    };
    
    addToCart(productToAdd, quantity, selectedVariant);

    toast({
      title: "Đã thêm vào giỏ hàng!",
      description: `${product.name}${selectedVariant ? ` (${selectedVariant})` : ''} x${quantity}`,
    });
  };

  // (Thêm 2 hàm xử lý chọn phân loại mới)
  const handleOptionChange = (groupName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: value,
    }));
  };

  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variant = product?.variants.find(v => v.name === variantName);
    if (variant) {
      setCurrentPrice(variant.price);
    }
  };
  
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

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

  // (Render JSX với đầy đủ tính năng)
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        
        {/* Nút quay lại */}
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang sản phẩm
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
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            </div>

            <div className="border-t pt-4">
              {/* (Đọc giá động) */}
              <p className="text-4xl font-bold text-primary">
                {currentPrice.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                *{product.feesIncluded ? 'Đã full phí dự kiến' : 'Chưa full phí'}
              </p>
              {/* (Đọc hạn order động) */}
              {product.orderDeadline && !isExpired && (
                 <p className="text-sm text-amber-600 mt-2">
                   Hạn order: {new Date(product.orderDeadline).toLocaleString('vi-VN')}
                 </p>
              )}
              {isExpired && (
                 <p className="text-sm text-destructive mt-2">
                   Đã hết hạn order
                 </p>
              )}
            </div>
            
            {/* (Khôi phục mô tả và master) */}
            {(product.description && product.description.length > 0) || product.master ? (
              <div className="border-t pt-4 space-y-4">
                
                {product.description && product.description.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                    <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                      {product.description.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.master && (
                  <div>
                    <h3 className="font-semibold mb-1">Master</h3>
                    <p className="text-muted-foreground">{product.master}</p>
                  </div>
                )}

              </div>
            ) : null}

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
                  <Select 
                    value={selectedVariant} 
                    onValueChange={handleVariantChange}
                  >
                    <SelectTrigger id="variant" className="mt-2">
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.name} value={variant.name}>
                          <div className="flex items-center gap-2">
                            {product.variantImageMap && product.variantImageMap[variant.name] !== undefined && (
                              <img 
                                src={product.images[product.variantImageMap[variant.name]]} 
                                alt={variant.name}
                                className="w-8 h-8 object-cover rounded border"
                              />
                            )}
                            <span>{variant.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* (Quantity) */}
            <div className="border-t pt-4">
              <Label htmlFor="quantity" className="text-base font-semibold">
                Số lượng
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button variant="outline" size="icon" onClick={incrementQuantity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* (Action Buttons) */}
            <div className="border-t pt-4 space-y-3">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-gradient-primary gap-2"
                size="lg"
                disabled={isExpired}
              >
                {isExpired ? <CalendarOff className="h-5 w-4" /> : <ShoppingCart className="h-5 w-5" />}
                {isExpired ? "Đã hết hạn order" : "Thêm vào giỏ hàng"}
              </Button>
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
      </div>
    </Layout>
  );
}
