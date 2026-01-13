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
        .order('id', { ascending: false });

      if (error) {
        console.error("Lỗi tải products từ Supabase:", error);
        return;
      }

      if (data) {
        const formattedProducts: Product[] = data.map((product: any) => {
          // Parse variantImageMap nếu là string
          let variantImageMap = product.variant_image_map || {};
          if (typeof variantImageMap === 'string') {
            try {
              variantImageMap = JSON.parse(variantImageMap);
            } catch (e) {
              console.error(`Lỗi parse variantImageMap cho sản phẩm ${product.id}:`, e);
              variantImageMap = {};
            }
          }

          // Parse images
          let images = product.images || [];
          if (typeof images === 'string') {
            try {
              images = JSON.parse(images);
            } catch (e) {
              images = [];
            }
          }

          // Parse variants
          let variants = product.variants || [];
          if (typeof variants === 'string') {
            try {
              variants = JSON.parse(variants);
            } catch (e) {
              variants = [];
            }
          }

          // Parse optionGroups
          let optionGroups = product.option_groups || [];
          if (typeof optionGroups === 'string') {
            try {
              optionGroups = JSON.parse(optionGroups);
            } catch (e) {
              optionGroups = [];
            }
          }

          // Parse description
          let description = product.description || '';
          if (typeof description === 'string' && description.startsWith('[')) {
            try {
              description = JSON.parse(description);
            } catch (e) {
              // Keep as string
            }
          }

          return {
            id: product.id,
            name: product.name,
            price: product.price,
            description,
            images,
            category: product.category || '',
            subcategory: product.subcategory || '',
            artist: product.artist || '',
            variants,
            optionGroups,
            variantImageMap,
            feesIncluded: product.fees_included ?? true,
            master: product.master || '',
            status: product.status || 'Sẵn',
            orderDeadline: product.order_deadline,
            stock: product.stock,
            priceDisplay: `${product.price.toLocaleString('vi-VN')}đ`,
            productionTime: product.production_time || '',
            deposit_allowed: product.deposit_allowed ?? true,
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
