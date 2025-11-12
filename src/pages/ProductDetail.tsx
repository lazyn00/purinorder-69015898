import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, CalendarOff } from "lucide-react";
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
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const product = productsData.find(p => p.id === Number(id));

  const [currentPrice, setCurrentPrice] = useState(product?.price || 0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (carouselApi && selectedVariant && product?.variantImageMap) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [selectedVariant, carouselApi, product]);

  useEffect(() => {
    if (product) {
      setCurrentPrice(product.price);
      
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) {
          setIsExpired(true);
        }
      } else if (product.status === "Sẵn") {
         setIsExpired(false);
      }
      
      if (product.variants && product.variants.length === 1) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant.name);
          setCurrentPrice(firstVariant.price);
      }
    }
  }, [product]);

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

  // === (QUAN TRỌNG) SỬA LỖI GIÁ TIỀN TRONG GIỎ HÀNG ===
  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: "Vui lòng chọn phân loại",
        description: "Bạn cần chọn phân loại sản phẩm trước khi thêm vào giỏ hàng",
        variant: "destructive"
      });
      return;
    }

    // 1. Tìm giá đúng (từ state currentPrice đã cập nhật)
    const selectedVariantObj = product.variants.find(v => v.name === selectedVariant);
    
    // 2. Xác định giá chính xác để thêm vào giỏ
    // Nếu tìm thấy variant đã chọn, dùng giá của nó
    // Nếu không (ví dụ sản phẩm không có variant), dùng giá mặc định (currentPrice)
    const correctPrice = selectedVariantObj ? selectedVariantObj.price : currentPrice;

    // 3. Tạo một bản sao "product" để gửi vào giỏ hàng
    // Ghi đè giá mặc định bằng giá của variant đã chọn
    const productToAdd = {
      ...product,
      price: correctPrice, // <- Ghi đè giá (số)
      priceDisplay: `${correctPrice.toLocaleString('vi-VN')}đ` // <- Ghi đè giá (chuỗi)
    };
    
    // 4. Gửi object "productToAdd" đã chỉnh sửa, thay vì "product" gốc
    addToCart(productToAdd, quantity, selectedVariant);

    toast({
      title: "Đã thêm vào giỏ hàng!",
      description: `${product.name}${selectedVariant ? ` (${selectedVariant})` : ''} x${quantity}`,
    });
  };
  // === KẾT THÚC SỬA LỖI ===

  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variant = product.variants.find(v => v.name === variantName);
    
    if (variant) {
      setCurrentPrice(variant.price);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Carousel */}
          <div className="space-y-4">
            <Carousel className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative overflow-hidden rounded-lg border">
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-contain"
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
            
            {/* Thumbnail */}
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
              {product.status && (
                <Badge variant="secondary" className="mb-3">
                  {product.status}
                </Badge>
              )}
              
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            </div>

            <div className="border-t pt-4">
              <p className="text-4xl font-bold text-primary">
                {currentPrice.toLocaleString('vi-VN')}đ
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                *{product.feesIncluded ? 'Đã full phí dự kiến' : 'Chưa full phí'}
              </p>

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

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="border-t pt-4">
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
                        <div className="flex items-center justify-between w-full">
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
                          <span className="text-sm font-medium text-muted-foreground">
                            {variant.price.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="border-t pt-4">
              <Label htmlFor="quantity" className="text-base font-semibold">
                Số lượng
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-4 space-y-3">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-gradient-primary gap-2"
                size="lg"
                disabled={isExpired}
              >
                {isExpired ? <CalendarOff className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
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
