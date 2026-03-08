import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Minus, Plus, AlertTriangle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity, totalItems, totalPrice, products } = useCart();
  const [open, setOpen] = useState(false);

  // Check if a cart item is out of stock based on latest realtime data
  const getItemStockStatus = (item: typeof cartItems[0]) => {
    const latestProduct = products.find(p => p.id === item.id);
    if (!latestProduct) return { available: true, maxStock: undefined };
    
    const hasVariantStock = latestProduct.variants?.some((v: any) => v.stock !== undefined);
    if (hasVariantStock && item.selectedVariant) {
      const variant = latestProduct.variants?.find((v: any) => v.name === item.selectedVariant);
      if (variant && variant.stock !== undefined) {
        return { available: variant.stock > 0, maxStock: variant.stock };
      }
    }
    if (latestProduct.stock !== undefined && latestProduct.stock !== null) {
      return { available: latestProduct.stock > 0, maxStock: latestProduct.stock };
    }
    return { available: true, maxStock: undefined };
  };

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
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {totalItems}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-screen w-full flex-col bg-card sm:max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h2 className="text-lg font-semibold">Giỏ hàng của bạn</h2>
                  <p className="text-sm text-muted-foreground">
                    {totalItems > 0 ? `${totalItems} sản phẩm` : "Giỏ hàng trống"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  ✕
                </Button>
              </div>

              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/40" />
                  <p className="text-muted-foreground">Giỏ hàng của bạn đang trống</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="mt-4 h-[calc(100vh-280px)] flex-1 px-4">
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {cartItems.map((item) => {
                          const stockStatus = getItemStockStatus(item);
                          const isOverStock = stockStatus.maxStock !== undefined && item.quantity > stockStatus.maxStock;
                          return (
                          <motion.div
                            key={`${item.id}-${item.selectedVariant}`}
                            layout
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`flex gap-3 rounded-xl border p-3 ${!stockStatus.available ? 'opacity-60 border-destructive/30 bg-destructive/5' : isOverStock ? 'border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
                          >
                            <img
                              src={getVariantImage(item)}
                              alt={item.name}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                            <div className="flex-1 space-y-1.5">
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
                                <div className="flex items-center gap-1.5">
                                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full"
                                    onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity - 1)}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full"
                                    onClick={() => updateQuantity(item.id, item.selectedVariant, item.quantity + 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => removeFromCart(item.id, item.selectedVariant)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
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
                    <Link to="/checkout" onClick={() => setOpen(false)} className="block">
                      <Button className="w-full bg-gradient-primary rounded-xl" size="lg">
                        Đặt hàng ngay
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
