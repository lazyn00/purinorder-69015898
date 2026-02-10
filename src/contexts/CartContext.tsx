import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GAS_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbzRmnozhdbiATR3APhnQvMQi4fIdDs6Fvr15gsfQO6sd7UoF8cs9yAOpMO2j1Re7P9V8A/exec";

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
  size?: string;
  includes?: string;
  cong?: number;
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

// Map Supabase product to frontend Product interface
const mapSupabaseProduct = (p: any): Product => {
  let variantImageMap = p.variant_image_map || {};
  if (typeof variantImageMap === 'string') {
    try { variantImageMap = JSON.parse(variantImageMap); } catch { variantImageMap = {}; }
  }
  let optionGroups = p.option_groups || [];
  if (typeof optionGroups === 'string') {
    try { optionGroups = JSON.parse(optionGroups); } catch { optionGroups = []; }
  }
  let variants = p.variants || [];
  if (typeof variants === 'string') {
    try { variants = JSON.parse(variants); } catch { variants = []; }
  }
  let images = p.images || [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }

  return {
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description || '',
    images: images,
    category: p.category || '',
    subcategory: p.subcategory || '',
    artist: p.artist || '',
    variants: variants,
    optionGroups: optionGroups,
    variantImageMap: variantImageMap,
    feesIncluded: p.fees_included ?? true,
    master: p.master || '',
    status: p.status || '',
    orderDeadline: p.order_deadline || null,
    stock: p.stock ?? undefined,
    priceDisplay: p.price_display || `${(p.price || 0).toLocaleString('vi-VN')}đ`,
    productionTime: p.production_time || '',
    size: p.size || '',
    includes: p.includes || '',
    cong: p.cong ?? undefined,
  };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    let gasProducts: Product[] = [];
    let dbProducts: Product[] = [];

    // 1. Fetch from Google Sheets (with timeout)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(GAS_PRODUCTS_URL, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await response.json();
      
      if (data.products) {
        gasProducts = data.products.map((product: any) => {
          if (product.variantImageMap && typeof product.variantImageMap === 'string') {
            try { product.variantImageMap = JSON.parse(product.variantImageMap); } catch { product.variantImageMap = {}; }
          }
          return product;
        });
      }
    } catch (error) {
      console.warn("Google Sheets không khả dụng, dùng dữ liệu từ database:", error);
    }

    // 2. Fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });
      if (!error && data) {
        dbProducts = data.map(mapSupabaseProduct);
      }
    } catch (error) {
      console.error("Không thể tải sản phẩm từ database:", error);
    }

    // 3. Merge: Supabase takes priority for duplicate IDs
    const mergedMap = new Map<number, Product>();
    
    // Add GAS products first
    gasProducts.forEach(p => mergedMap.set(p.id, p));
    
    // Override with Supabase products (priority)
    dbProducts.forEach(p => mergedMap.set(p.id, p));

    const mergedProducts = Array.from(mergedMap.values());
    setProducts(mergedProducts);
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
