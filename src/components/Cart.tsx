// @/components/Cart.tsx

import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();

  // === HÀM HELPER: LẤY ẢNH THEO VARIANT ===
  const getVariantImage = (item: typeof cartItems[0]) => {
    if (item.selectedVariant && item.variantImageMap) {
      const imageIndex = item.variantImageMap[item.selectedVariant];
      if (imageIndex !== undefined && item.images[imageIndex]) {
        return item.images[imageIndex];
      }
    }
    return item.images[0]; // Trả về ảnh đầu tiên nếu không tìm thấy
  };
  // === KẾT THÚC HÀM HELPER ===

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Giỏ hàng của bạn</SheetTitle>
          <SheetDescription>
            {totalItems > 0 ? `${totalItems} sản phẩm` : 'Giỏ hàng trống'}
          </SheetDescription>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Giỏ hàng của bạn đang trống</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 h-[calc(100vh-280px)] mt-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.selectedVariant}`} className="flex gap-4 border rounded-lg p-3">
                    <img 
                      src={getVariantImage(item)} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      {item.selectedVariant && (
                        <p className="text-xs text-muted-foreground">
                          Phân loại: {item.selectedVariant}
                        </p>
                      )}
                      {/* Sửa lại: hiển thị tổng tiền của line item */}
                      <p className="text-sm font-bold text-primary">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.id, item.selectedVariant)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-primary">
                  {totalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <Separator />
              
              {/* === DÙNG LINK VỚI BUTTON BÊN TRONG === */}
              <SheetClose asChild>
                <Button 
                  className="w-full bg-gradient-primary"
                  size="lg"
                  asChild
                >
                  <Link to="/checkout">
                    Đặt hàng ngay
                  </Link>
                </Button>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
