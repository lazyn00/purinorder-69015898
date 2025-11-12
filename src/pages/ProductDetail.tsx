import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, CalendarOff } from "lucide-react"; // <- Thêm CalendarOff
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

  // === THÊM MỚI: state cho giá và trạng thái hết hạn ===
  const [currentPrice, setCurrentPrice] = useState(product?.price || 0);
  const [isExpired, setIsExpired] = useState(false);
  // === KẾT THÚC THÊM MỚI ===

  useEffect(() => {
    if (carouselApi && selectedVariant && product?.variantImageMap) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [selectedVariant, carouselApi, product]);

  // === THÊM MỚI: useEffect để kiểm tra hạn order ===
  useEffect(() => {
    if (product) {
      // 1. Đặt giá mặc định khi tải trang
      setCurrentPrice(product.price);
      
      // 2. Kiểm tra hạn order
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) {
          setIsExpired(true);
        }
      } else if (product.status === "Sẵn") {
         // Nếu là hàng "Sẵn", không hết hạn
         setIsExpired(false);
      }
      
      // 3. Tự động chọn variant đầu tiên nếu chỉ có 1 variant
      if (product.variants && product.variants.length === 1) {
          setSelectedVariant(product.variants[0].name);
          setCurrentPrice(product.variants[0].price);
      }
    }
  }, [product]); // <- chạy khi product tải xong
  // === KẾT THÚC THÊM MỚI ===

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

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: "Vui lòng chọn phân loại",
        description: "Bạn cần chọn phân loại sản phẩm trước khi thêm vào giỏ hàng",
        variant: "destructive"
      });
      return;
    }

    addToCart(product, quantity, selectedVariant);
    toast({
      title: "Đã thêm vào giỏ hàng!",
      description: `${product.name}${selectedVariant ? ` (${selectedVariant})` : ''} x${quantity}`,
    });
  };

  // === THÊM MỚI: hàm xử lý khi đổi variant ===
  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    
    // Tìm variant object trong mảng
    const variant = product.variants.find(v => v.name === variantName);
    
    // Cập nhật giá hiển thị
    if (variant) {
      setCurrentPrice(variant.price);
    }
  };
  // === KẾT THÚC THÊM MỚI ===

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
                    {/* SỬA ĐỔI: Gỡ bỏ aspect-square để giữ ảnh gốc */}
                    <div className="relative overflow-hidden rounded-lg border">
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-contain" // <- Đổi từ object-cover
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
                  // SỬA ĐỔI: Thêm onClick để scroll tới ảnh
                  <div 
                    key={index} 
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => carouselApi?.scrollTo(index)} // <- Thêm dòng này
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
              {/* SỬA ĐỔI: đọc status động */}
              {product.status && (
                <Badge variant="secondary" className="mb-3">
                  {product.status}
                </Badge>
              )}
              {/* KẾT THÚC SỬA ĐỔI */}
              
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {/* ĐÃ XÓA: thông tin artist */}
            </div>

            <div className="border-t pt-4">
              {/* SỬA ĐỔI: hiển thị giá động (currentPrice) */}
              <p className="text-4xl font-bold text-primary">
                {currentPrice.toLocaleString('vi-VN')}đ
              </p>
              {/* KẾT THÚC SỬA ĐỔI */}

              <p className="text-sm text-muted-foreground mt-2">
                *{product.feesIncluded ? 'Đã full phí dự kiến' : 'Chưa full phí'}
              </p>

              {/* THÊM MỚI: hiển thị hạn order */}
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
              {/* KẾT THÚC THÊM MỚI */}
            </div>

            {/* ĐÃ XÓA: phần Mô tả sản phẩm và Master */}

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="border-t pt-4">
                <Label htmlFor="variant" className="text-base font-semibold">
                  Phân loại *
                </Label>
                {/* SỬA ĐỔI: dùng handleVariantChange */}
                <Select 
                  value={selectedVariant} 
                  onValueChange={handleVariantChange} // <- thay đổi ở đây
                >
                {/* KẾT THÚC SỬA ĐỔI */}
                  <SelectTrigger id="variant" className="mt-2">
                    <SelectValue placeholder="Chọn phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* SỬA ĐỔI: lặp qua mảng object mới */}
                    {product.variants.map((variant) => (
                      <SelectItem key={variant.name} value={variant.name}>
                      {/* KẾT THÚC SỬA ĐỔI */}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {product.variantImageMap && product.variantImageMap[variant.name] !== undefined && (
                              <img 
                                src={product.images[product.variantImageMap[variant.name]]} 
                                alt={variant.name}
                                className="w-8 h-8 object-cover rounded border"
                              />
                            )}
                            {/* SỬA ĐỔI: đọc variant.name */}
                            <span>{variant.name}</span>
                            {/* KẾT THÚC SỬA ĐỔI */}
                          </div>
                          {/* THÊM MỚI: hiển thị giá của riêng variant đó */}
                          <span className="text-sm font-medium text-muted-foreground">
                            {variant.price.toLocaleString('vi-VN')}đ
                          </span>
                          {/* KẾT THÚC THÊM MỚI */}
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
              {/* SỬA ĐỔI: thêm logic disable khi hết hạn */}
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-gradient-primary gap-2"
                size="lg"
                disabled={isExpired} // <- thêm dòng này
              >
                {isExpired ? <CalendarOff className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                {isExpired ? "Đã hết hạn order" : "Thêm vào giỏ hàng"}
              </Button>
              {/* KẾT THÚC SỬA ĐỔI */}

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
