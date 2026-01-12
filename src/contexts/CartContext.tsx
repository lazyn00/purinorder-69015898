import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

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
  deposit_allowed?: boolean;
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

// Helper function to format price display
const formatPriceDisplay = (price: number, variants: { name: string; price: number }[]): string => {
  if (variants && variants.length > 0) {
    const prices = variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice !== maxPrice) {
      return `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
    }
    return `${minPrice.toLocaleString('vi-VN')}đ`;
  }
  return `${price.toLocaleString('vi-VN')}đ`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error("Lỗi tải products từ Supabase:", error);
        return;
      }

      if (data) {
        const formattedProducts: Product[] = data.map((p: any) => {
          // Parse variants
          const variants = Array.isArray(p.variants) ? p.variants : [];
          
          // Parse option_groups
          const optionGroups = Array.isArray(p.option_groups) ? p.option_groups : [];
          
          // Parse variant_image_map
          let variantImageMap = {};
          if (p.variant_image_map) {
            if (typeof p.variant_image_map === 'string') {
              try {
                variantImageMap = JSON.parse(p.variant_image_map);
              } catch (e) {
                console.error(`Lỗi parse variantImageMap cho sản phẩm ${p.id}:`, e);
              }
            } else if (typeof p.variant_image_map === 'object') {
              variantImageMap = p.variant_image_map;
            }
          }
          
          // Parse images
          const images = Array.isArray(p.images) ? p.images : [];
          
          // Parse description - có thể là string hoặc array
          let description: string | string[] = p.description || '';
          if (typeof p.description === 'string' && p.description.includes('|')) {
            description = p.description.split('|');
          }

          return {
            id: p.id,
            name: p.name || '',
            price: p.price || 0,
            description: description,
            images: images,
            category: p.category || '',
            subcategory: p.subcategory || '',
            artist: p.artist || '',
            variants: variants,
            optionGroups: optionGroups,
            variantImageMap: variantImageMap,
            feesIncluded: p.fees_included ?? true,
            master: p.master || '',
            status: p.status || 'Sẵn',
            orderDeadline: p.order_deadline || null,
            stock: p.stock,
            priceDisplay: formatPriceDisplay(p.price || 0, variants),
            productionTime: p.production_time || '',
            deposit_allowed: p.deposit_allowed ?? true,
          };
        });
        
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error("Không thể tải sản phẩm từ Supabase:", error);
    } finally {
      setIsLoading(false);
    }
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
