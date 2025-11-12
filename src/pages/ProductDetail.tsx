import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus } from "lucide-react";
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

  const product = productsData.find(p => p.id === Number(id));

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
    if (product.variants && !selectedVariant) {
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
      description: `${product.name} x${quantity}`,
    });
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Carousel */}
          <div className="space-y-4">
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
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
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={image}
                      alt={`Thumb ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border cursor-pointer hover:border-primary transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">Pre-order</Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">🎤 {product.artist}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-4xl font-bold text-primary">{product.priceDisplay}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Variant Selection */}
            {product.variants && (
              <div className="border-t pt-4">
                <Label htmlFor="variant" className="text-base font-semibold">
                  Phân loại *
                </Label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger id="variant" className="mt-2">
                    <SelectValue placeholder="Chọn phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant} value={variant}>
                        {variant}
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
              >
                <ShoppingCart className="h-5 w-5" />
                Thêm vào giỏ hàng
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
