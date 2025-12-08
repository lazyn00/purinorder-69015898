import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Fallback Google Sheet URL
const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzRmnozhdbiATR3APhnQvMQi4fIdDs6Fvr15gsfQO6sd7UoF8cs9yAOpMO2j1Re7P9V8A/exec";

// 1. CẬP NHẬT INTERFACE PRODUCT
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
  stock?: number;
  priceDisplay: string;
  productionTime?: string; 
  
  // --- HAI TRƯỜNG MỚI ---
  size?: string;      // Kích thước
  includes?: string;  // Bao gồm
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
  products: Product[];
  isLoading: boolean;
  refetchProducts: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    let supabaseProducts: Product[] = [];
    let googleSheetProducts: Product[] = [];

    // 1. Fetch từ Supabase
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) {
        supabaseProducts = data.map((dbProduct: any) => ({
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
          variantImageMap: typeof dbProduct.variant_image_map === 'object' ? dbProduct.variant_image_map : {},
          feesIncluded: dbProduct.fees_included ?? true,
          master: dbProduct.master || '',
          status: dbProduct.status || 'Sẵn',
          orderDeadline: dbProduct.order_deadline,
          stock: dbProduct.stock,
          priceDisplay: `${dbProduct.price.toLocaleString('vi-VN')}đ`,
          productionTime: dbProduct.production_time || '',
          
          // MAP DỮ LIỆU TỪ SUPABASE (Cần tạo cột 'size' và 'includes' trong DB trước)
          size: dbProduct.size || '',
          includes: dbProduct.includes || ''
        }));
      }
    } catch (error) {
      console.error("Không thể tải sản phẩm từ Supabase:", error);
    }

    // 2. Fetch từ Google Sheet
    try {
      const response = await fetch(GAS_PRODUCTS_URL);
      const data = await response.json();
      
      if (data.products) {
        googleSheetProducts = data.products.map((product: any) => {
          if (product.variantImageMap && typeof product.variantImageMap === 'string') {
            try {
              product.variantImageMap = JSON.parse(product.variantImageMap);
            } catch (e) {
              product.variantImageMap = {};
            }
          }
          
          // MAP DỮ LIỆU TỪ GOOGLE SHEET
          // Ưu tiên đọc key viết hoa (Size, Includes) thường thấy trong Sheet
          return {
            ...product,
            size: product.Size || product.size || '',
            includes: product.Includes || product.includes || ''
          };
        });
      }
    } catch (error) {
      console.error("Không thể tải sản phẩm từ Google Sheet:", error);
    }

    // 3. Merge: ưu tiên Supabase
    const supabaseIds = new Set(supabaseProducts.map(p => p.id));
    const uniqueGoogleProducts = googleSheetProducts.filter(p => !supabaseIds.has(p.id));
    
    const allProducts = [...supabaseProducts, ...uniqueGoogleProducts];
    setProducts(allProducts);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice, products, isLoading, refetchProducts: fetchProducts
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
