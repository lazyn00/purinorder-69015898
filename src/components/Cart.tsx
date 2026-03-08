// @/components/Cart.tsx

import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; variant: string } | null>(null);

  const getVariantImage = (item: typeof cartItems[0]) => {
    if (item.selectedVariant && item.variantImageMap) {
      const imageIndex = item.variantImageMap[item.selectedVariant];
      if (imageIndex !== undefined && item.images[imageIndex]) {
        return item.images[imageIndex];
      }
    }
    return item.images[0];
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
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

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60"
            onClick={() => setOpen(false)}
          />

          <div className="fixed right-0 top-0 z-50 flex h-screen w-full flex-col bg-card sm:max-w-lg shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Giỏ hàng của bạn</h2>
                <p className="text-sm text-muted-foreground">
                  {totalItems > 0 ? `${totalItems} sản phẩm` : "Giỏ hàng trống"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                ✕
              </Button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Giỏ hàng của bạn đang trống</p>
              </div>
            ) : (
              <>
                <ScrollArea className="mt-6 h-[calc(100vh-280px)] flex-1 px-4">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.id}-${item.selectedVariant}`}
                        className="flex gap-4 rounded-lg border p-3"
                      >
                        <img
                          src={getVariantImage(item)}
                          alt={item.name}
                          className="h-20 w-20 rounded object-cover"
                        />
                        <div className="flex-1 space-y-2">
                          <h4 className="line-clamp-1 text-sm font-semibold">
                            x{item.quantity} {item.name}
                          </h4>
                          {item.selectedVariant && (
                            <p className="text-xs text-muted-foreground">
                              Phân loại: {item.selectedVariant}
                            </p>
                          )}
                          <p className="text-sm font-bold text-primary">
                            {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    setDeleteConfirm({ id: item.id, variant: item.selectedVariant });
                                  } else {
                                    updateQuantity(item.id, item.selectedVariant, item.quantity - 1);
                                  }
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (isNaN(val) || val < 0) return;
                                  if (val === 0) {
                                    setDeleteConfirm({ id: item.id, variant: item.selectedVariant });
                                  } else {
                                    updateQuantity(item.id, item.selectedVariant, val);
                                  }
                                }}
                                className="w-12 h-6 text-center text-sm font-medium p-0 border-0 focus-visible:ring-0 shadow-none"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateQuantity(item.id, item.selectedVariant, item.quantity + 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                removeFromCart(item.id, item.selectedVariant)
                              }
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-4 border-t px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <Separator />

                  <Link
                    to="/checkout"
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    <Button className="w-full bg-gradient-primary" size="lg">
                      Đặt hàng ngay
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Dialog xác nhận xoá */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có muốn xoá sản phẩm này khỏi giỏ hàng không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  removeFromCart(deleteConfirm.id, deleteConfirm.variant);
                  setDeleteConfirm(null);
                }
              }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
