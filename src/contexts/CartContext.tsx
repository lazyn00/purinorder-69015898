import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';



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
  const CART_STORAGE_KEY = 'pu_cart_items_v1';
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch (e) {
      console.warn('Cart restore failed', e);
    }
    return [];
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Cart persist failed', e);
    }
  }, [cartItems]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });
      if (!error && data) {
        setProducts(data.map(mapSupabaseProduct));
      }
    } catch (error) {
      console.error("Không thể tải sản phẩm từ database:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();

    // Subscribe to realtime changes on products table for live stock updates
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseProduct(payload.new);
            setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
          } else if (payload.eventType === 'INSERT') {
            const newProduct = mapSupabaseProduct(payload.new);
            setProducts(prev => [newProduct, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
