import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, CalendarOff, ArrowLeft } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { OrderCountdown } from "@/components/OrderCountdown";
import { useCart, Product } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";
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
  // SỬA: Lấy thêm getVariantStock từ context
  const { addToCart, products, isLoading, getVariantStock } = useCart(); 
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>(""); 
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isExpired, setIsExpired] = useState(false);
  
  // BỔ SUNG: State cho số lượng tồn kho của biến thể hiện tại
  const [currentStock, setCurrentStock] = useState<number | undefined>(undefined); 
  
  // useEffect để tìm sản phẩm khi 'products' tải xong
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      // Dùng == vì id từ sheet có thể là string, id từ url là string
      const foundProduct = products.find(p => p.id == Number(id)); 
      setProduct(foundProduct);
    }
  }, [isLoading, products, id]);

  // SỬA: useEffect để cập nhật state, bao gồm currentStock
  useEffect(() => {
    if (product) {
      setCurrentPrice(product.price);
      
      // === (SỬA 1: HẠN ORDER) ===
      if (product.orderDeadline) {
        const deadline = new Date(product.orderDeadline);
        if (deadline < new Date()) setIsExpired(true);
      } else if (product.status === "Sẵn") {
          setIsExpired(false);
      }
      
      // BỔ SUNG: Logic tìm tồn kho ban đầu
      const hasVariants = product.variants && product.variants.length > 0;
      
      if (product.optionGroups && product.optionGroups.length > 0) {
        const initialOptions = product.optionGroups.reduce((acc, group) => {
            acc[group.name] = "";
            return acc;
        }, {} as { [key: string]: string });
        setSelectedOptions(initialOptions);
        setCurrentStock(undefined); // Reset stock khi có nhiều option
      }
      else if (hasVariants && product.variants.length === 1) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant.name);
          setCurrentPrice(firstVariant.price);
          setCurrentStock(firstVariant.stock); // Lấy stock cho 1 variant duy nhất
          if (firstVariant.stock !== undefined && quantity > firstVariant.stock) {
             setQuantity(firstVariant.stock > 0 ? firstVariant.stock : 1);
          }
      } else if (!hasVariants) {
        // Sản phẩm không có variants, stock mặc định là undefined (vô hạn)
        setCurrentStock(undefined);
      } else {
        // Có variants nhưng chưa chọn (ví dụ: > 1 variant, chưa có optionGroup)
        setCurrentStock(undefined);
      }
    }
  }, [product]);


  // === (SỬA 2: QUAY LẠI LOGIC GỐC "-" và cập nhật Stock/Price) ===
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
          setCurrentStock(variant.stock); // Cập nhật stock
          
          if (variant.stock !== undefined && quantity > variant.stock) {
              setQuantity(variant.stock > 0 ? variant.stock : 1);
          }

          if (carouselApi && product.variantImageMap) {
            const imageIndex = product.variantImageMap[variant.name];
            if (imageIndex !== undefined) {
                carouselApi.scrollTo(imageIndex);
            }
          }
        } else {
          setSelectedVariant("");
          setCurrentPrice(product.price);
          setCurrentStock(undefined);
          console.warn("Tổ hợp không hợp lệ:", constructedName);
        }
      } else {
        // Nếu chưa chọn đủ option
        setCurrentStock(undefined); 
        setSelectedVariant("");
        setCurrentPrice(product.price);
      }
    }
  }, [selectedOptions, product, carouselApi, quantity]);

  // useEffect xử lý cuộn ảnh cho 1 phân loại đơn giản
  useEffect(() => {
    if (carouselApi && product?.variantImageMap && selectedVariant) {
      const imageIndex = product.variantImageMap[selectedVariant];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [selectedVariant, carouselApi, product]);
  
  const handleAddToCart = () => {
    if (!product) return; 

    const hasVariants = product.variants && product.variants.length > 0;

    if (hasVariants && !selectedVariant) {
      toast({
        title: "Vui lòng chọn đủ phân loại",
        description: "Bạn cần chọn tất cả các phân loại sản phẩm",
        variant: "destructive"
      });
      return;
    }
    
    // BỔ SUNG: Kiểm tra tồn kho
    if (currentStock !== undefined && currentStock === 0) {
        toast({
            title: "Sản phẩm đã hết hàng",
            description: "Phân loại bạn chọn hiện không còn hàng.",
            variant: "destructive"
        });
        return;
    }
    
    // Kiểm tra số lượng mua so với tồn kho
    const stockLimit = currentStock !== undefined ? currentStock : Infinity;
    if (quantity > stockLimit) {
        toast({
            title: "Vượt quá số lượng tồn kho",
            description: `Chỉ còn ${stockLimit} sản phẩm cho phân loại này.`,
            variant: "destructive"
        });
        setQuantity(stockLimit);
        return;
    }


    const correctPrice = currentPrice; 

    const productToAdd = {
      ...product,
      price: correctPrice,
      priceDisplay: `${correctPrice.toLocaleString('vi-VN')}đ`
    };
    
    // SỬA: Thêm currentStock vào hàm addToCart
    addToCart(productToAdd, quantity, selectedVariant, currentStock);

    toast({
      title: "Đã thêm vào giỏ hàng!",
      description: `${product.name}${selectedVariant ? ` (${selectedVariant})` : ''} x${quantity}`,
    });
  };

  const handleOptionChange = (groupName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: value,
    }));
  };

  // SỬA: Cập nhật currentStock khi handleVariantChange được gọi
  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variant = product?.variants.find(v => v.name === variantName);
    if (variant) {
      setCurrentPrice(variant.price);
      setCurrentStock(variant.stock); // Cập nhật stock
      
      // Giới hạn quantity nếu cần
      if (variant.stock !== undefined && quantity > variant.stock) {
        setQuantity(variant.stock > 0 ? variant.stock : 1);
      }
    }
    
    // Thêm logic cuộn ảnh
    if (carouselApi && product?.variantImageMap) {
      const imageIndex = product.variantImageMap[variantName];
      if (imageIndex !== undefined) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  };
  
  // SỬA: Giới hạn quantity khi tăng theo currentStock
  const incrementQuantity = () => {
    setQuantity(prev => {
      const max = currentStock !== undefined ? currentStock : Infinity;
      return Math.min(prev + 1, max);
    });
  };
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

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
              {product.master && (
                <p className="text-muted-foreground text-sm">
                  Master: {product.master}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-4xl font-bold text-primary">
                {currentPrice.toLocaleString('vi-VN')}đ
              </p>
              
              {/* BỔ SUNG: HIỂN THỊ TỒN KHO */}
              {(product.variants && product.variants.length > 0) && (
                <p className={`text-lg font-semibold mt-2 ${currentStock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {currentStock === undefined && selectedVariant === ""
                        ? "Vui lòng chọn phân loại" 
                        : currentStock === 0 
                            ? "Hết hàng!" 
                            : `Kho: ${currentStock}`}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground mt-2">
                *{product.feesIncluded ? 'Đã full phí dự kiến' : 'Chưa full phí'}
              </p>
            </div>

            {/* Countdown Timer */}
            {product.orderDeadline && (
              <OrderCountdown 
                deadline={product.orderDeadline} 
                onExpired={() => setIsExpired(true)} 
              />
            )}
            
            
            {product.description && product.description.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  {product.description.map((item, index) => (
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
                  <Select 
                    value={selectedVariant} 
                    onValueChange={handleVariantChange}
                  >
                    <SelectTrigger id="variant" className="mt-2">
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                    {/* (Sửa lỗi typo TSelectTrigger) */}
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.name} value={variant.name}>
                          {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="quantity" className="text-base font-semibold">
                Số lượng
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={decrementQuantity} 
                    // Vô hiệu hóa nếu quantity <= 1 HOẶC hết hàng
                    disabled={quantity <= 1 || currentStock === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  // SỬA: Giới hạn theo currentStock
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const max = currentStock !== undefined ? currentStock : Infinity;
                    setQuantity(Math.max(1, Math.min(value, max)));
                  }}
                  className="w-20 text-center"
                />
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={incrementQuantity}
                    // Vô hiệu hóa nếu hết hàng HOẶC đã đạt giới hạn tồn kho
                    disabled={currentStock !== undefined && (currentStock === 0 || quantity >= currentStock)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-gradient-primary gap-2"
                size="lg"
                // SỬA: Vô hiệu hóa nếu hết hạn order HOẶC hết hàng
                disabled={isExpired || (currentStock !== undefined && currentStock === 0)}
              >
                {isExpired || currentStock === 0 
                    ? <CalendarOff className="h-5 w-4" /> 
                    : <ShoppingCart className="h-5 w-5" />}
                {isExpired 
                    ? "Đã hết hạn order" 
                    : currentStock === 0 
                        ? "Hết hàng"
                        : "Thêm vào giỏ hàng"}
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
