import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Fallback Google Sheet URL (optional)
const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzRmnozhdbiATR3APhnQvMQi4fIdDs6Fvr15gsfQO6sd7UoF8cs9yAOpMO2j1Re7P9V8A/exec";

// Định nghĩa kiểu Product mới (từ Google Sheet)
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string | string[];
  images: string[];
  category: string;
  subcategory?: string; // Phân loại nhỏ
  artist: string;
  variants: { name: string; price: number; stock?: number }[]; // Stock có thể có cho từng variant
  optionGroups?: { name: string; options: string[] }[];
  variantImageMap?: { [key: string]: number }; 
  feesIncluded?: boolean;
  master?: string;
  status?: string;
  orderDeadline?: string | null;
  stock?: number; // Stock chung cho tất cả variants (nếu không có stock riêng)
  priceDisplay: string; // Giữ lại trường này cho đỡ lỗi
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
        // Fetch từ backend Supabase
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // Transform data từ DB format sang Product format
          const transformedProducts = data.map((dbProduct: any) => ({
            id: dbProduct.id,
            name: dbProduct.name,
            price: dbProduct.price,
            description: dbProduct.description || '',
            images: Array.isArray(dbProduct.images) ? dbProduct.images : [],
            category: dbProduct.category || '',
            subcategory: dbProduct.subcategory || '',
            artist: dbProduct.artist || '',
            variants: Array.isArray(dbProduct.variants) ? dbProduct.variants : [],
            optionGroups: Array.isArray(dbProduct.option_groups) ? dbProduct.option_groups : [],
            variantImageMap: typeof dbProduct.variant_image_map === 'object' 
              ? dbProduct.variant_image_map 
              : {},
            feesIncluded: dbProduct.fees_included ?? true,
            master: dbProduct.master || '',
            status: dbProduct.status || 'Sẵn',
            orderDeadline: dbProduct.order_deadline,
            stock: dbProduct.stock,
            priceDisplay: `${dbProduct.price.toLocaleString('vi-VN')}đ`
          }));
          
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Không thể tải sản phẩm từ backend:", error);
        
        // Fallback to Google Sheet if backend fails
        try {
          const response = await fetch(GAS_PRODUCTS_URL);
          const data = await response.json();
          
          if (data.products) {
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
          }
        } catch (fallbackError) {
          console.error("Fallback Google Sheet cũng thất bại:", fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
      isLoading
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
