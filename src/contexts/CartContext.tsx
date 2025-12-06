import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// === DÁN URL APPS SCRIPT (ĐỌC SẢN PHẨM) CỦA BẠN VÀO ĐÂY ===
const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzMAcPL0WRqnTQXc3Os4U6EkCRWL-7nDyZtSaugY_MERdjhPFmxFMC80gspGSWgFS_8XA/exec";
// ===

// Định nghĩa kiểu Product mới (từ Google Sheet)
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string | string[];
  images: string[];
  category: string;
  subcategory?: string;
  artist: string;
  variants: { name: string; price: number; stock?: number }[];
  optionGroups?: { name: string; options: string[] }[];
  variantImageMap?: { [key: string]: number }; 
  feesIncluded?: boolean;
  master?: string;
  status?: string;
  orderDeadline?: string | null;
  stock?: number | null;
  priceDisplay: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, variant: string) => void;
  removeFromCart: (productId: number, variant: string) => void;
  updateQuantity: (productId: number, variant: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  
  // State cho sản phẩm
  products: Product[];
  isLoading: boolean;
  refetchProducts: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // State và useEffect để tải sản phẩm
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Thử lấy từ Supabase trước
      const { data: supabaseProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (!error && supabaseProducts && supabaseProducts.length > 0) {
        // Chuyển đổi từ định dạng Supabase sang định dạng Product
        const formattedProducts: Product[] = supabaseProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description ? p.description.split('\n') : [],
          images: (p.images as string[]) || [],
          category: p.category || '',
          artist: p.artist || '',
          variants: (Array.isArray(p.variants) ? p.variants : []) as { name: string; price: number }[],
          optionGroups: (Array.isArray(p.option_groups) ? p.option_groups : []) as { name: string; options: string[] }[],
          variantImageMap: (p.variant_image_map as { [key: string]: number }) || {},
          feesIncluded: p.fees_included || false,
          master: p.master || '',
          status: p.status || 'Sẵn',
          orderDeadline: p.order_deadline || null,
          stock: p.stock || null,
          priceDisplay: p.price.toLocaleString('vi-VN') + 'đ',
        }));
        setProducts(formattedProducts);
      } else {
        // Fallback to Google Sheet nếu Supabase không có dữ liệu
        const response = await fetch(GAS_PRODUCTS_URL);
        const data = await response.json();
        
        if (data.products) {
          setProducts(data.products);
        } else {
          console.error("Lỗi tải products:", data.error);
        }
      }
    } catch (error) {
      console.error("Không thể tải sản phẩm:", error);
      // Fallback to Google Sheet
      try {
        const response = await fetch(GAS_PRODUCTS_URL);
        const data = await response.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (fallbackError) {
        console.error("Không thể tải sản phẩm từ Google Sheet:", fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Tải 1 lần duy nhất

  // (Các hàm giỏ hàng đã sửa lỗi)
  const addToCart = (product: Product, quantity: number, variant: string) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => 
        item.id === product.id && item.selectedVariant === variant
      );
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id && item.selectedVariant === variant
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedVariant: variant }];
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
      refetchProducts: fetchProducts
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
