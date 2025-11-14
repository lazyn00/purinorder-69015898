import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// === DÁN URL APPS SCRIPT (ĐỌC SẢN PHẨM) CỦA BẠN VÀO ĐÂY ===
const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzMAcPL0WRqnTQXc3Os4U6EkCRWL-7nDyZtSaugY_MERdjfPFmxFMC80gspGSWgFS_8XA/exec";
// ===

// Định nghĩa kiểu Product mới (từ Google Sheet)
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string[];
  images: string[];
  category: string;
  artist: string;
  // BỔ SUNG: Thêm trường stock? number vào variant
  variants: { name: string; price: number; stock?: number }[]; 
  optionGroups?: { name: string; options: string[] }[];
  variantImageMap?: { [key: string]: number }; 
  feesIncluded?: boolean;
  master?: string;
  status?: string;
  orderDeadline?: string | null;
  priceDisplay: string;
}
export interface CartItem extends Product {
  quantity: number;
  selectedVariant: string;
  // BỔ SUNG: Lưu trữ tồn kho của biến thể đã chọn
  variantStock?: number; 
}

interface CartContextType {
  cartItems: CartItem[];
  // BỔ SUNG: Thêm variantStock vào hàm addToCart
  addToCart: (product: Product, quantity: number, variant: string, variantStock?: number) => void; 
  removeFromCart: (productId: number, variant: string) => void;
  updateQuantity: (productId: number, variant: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  
  // State cho sản phẩm
  products: Product[];
  isLoading: boolean;
  // BỔ SUNG: Hàm lấy tồn kho của một biến thể cụ thể
  getVariantStock: (productId: number, variantName: string) => number | undefined; 
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // State và useEffect để tải sản phẩm
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(GAS_PRODUCTS_URL);
        const data = await response.json();
        
        if (data.products) {
          // Parse variantImageMap nếu nó là string
          const parsedProducts = data.products.map((product: any) => {
            if (product.variantImageMap && typeof product.variantImageMap === 'string') {
              try {
                product.variantImageMap = JSON.parse(product.variantImageMap);
              } catch (e) {
                console.error(`Lỗi parse variantImageMap cho sản phẩm ${product.id}:`, e);
                product.variantImageMap = {};
              }
            }
            return product;
          });
          setProducts(parsedProducts);
        } else {
          console.error("Lỗi tải products:", data.error);
        }
      } catch (error) {
        console.error("Không thể tải sản phẩm từ Google Sheet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []); // Tải 1 lần duy nhất
  
  // BỔ SUNG: Hàm tìm số lượng tồn kho của biến thể
  const getVariantStock = (productId: number, variantName: string): number | undefined => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return undefined;
    
    const variant = product.variants.find(v => v.name === variantName);
    // Trả về stock nếu có, nếu không trả về undefined (không áp dụng tồn kho)
    return variant?.stock; 
  };


  // SỬA: Thêm variantStock và logic giới hạn số lượng theo stock
  const addToCart = (product: Product, quantity: number, variant: string, variantStock?: number) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => 
        item.id === product.id && item.selectedVariant === variant
      );
      
      let newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      // Kiểm tra giới hạn tồn kho
      const stockLimit = variantStock !== undefined ? variantStock : Infinity;
      if (newQuantity > stockLimit) {
          newQuantity = stockLimit; // Giới hạn ở mức tồn kho
      }
      // Không thêm vào nếu tồn kho là 0 và số lượng mới cũng là 0 (tránh lỗi)
      if (newQuantity === 0 && stockLimit === 0) {
          return prev; 
      }

      if (existingItem) {
        return prev.map(item =>
          item.id === product.id && item.selectedVariant === variant
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      // Lần đầu thêm vào giỏ hàng
      return [...prev, { ...product, quantity: newQuantity, selectedVariant: variant, variantStock }]; 
    });
  };

  const removeFromCart = (productId: number, variant: string) => {
    setCartItems(prev => prev.filter(item => 
      !(item.id === productId && item.selectedVariant === variant)
    ));
  };

  const updateQuantity = (productId: number, variant: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCartItems(prev =>
      prev.map(item => 
        (item.id === productId && item.selectedVariant === variant) 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // (Hết các hàm giỏ hàng)

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      products, 
      isLoading,
      getVariantStock // Thêm hàm mới
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
