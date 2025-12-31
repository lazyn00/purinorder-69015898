import React from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, ArrowLeft, Share2, ExternalLink, MessageCircle } from "lucide-react";
import { LoadingPudding } from "@/components/LoadingPudding";
import { useCart, Product } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface UserListing {
  id: string;
  listing_code: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string;
  tag: string;
  price: number | null;
  images: string[];
  variants: { name: string; price: number; image?: string }[] | null; // Cập nhật interface variants
  seller_social: string;
  status: string;
  created_at: string;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const [listing, setListing] = useState<UserListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>(""); 
  const [highlightVariant, setHighlightVariant] = useState(false);
  const variantRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_listings')
          .select('*')
          .eq('id', id)
          .eq('status', 'approved')
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setListing(data as any);
          const variants = (data.variants as any) || [];
          if (variants.length > 0) {
            setCurrentPrice(Math.min(...variants.map((v: any) => v.price)));
          } else {
            setCurrentPrice(data.price || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  useEffect(() => {
    if (!carouselApi) return;
    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);
    carouselApi.on("select", () => setCurrent(carouselApi.selectedScrollSnap() + 1));
  }, [carouselApi]);
  
  const handleVariantChange = (variantName: string) => {
    setSelectedVariant(variantName);
    const variants = (listing?.variants as { name: string; price: number; image?: string }[]) || [];
    const variant = variants.find(v => v.name === variantName);
    
    if (variant) {
      setCurrentPrice(variant.price);
      
      // Logic tự động scroll tới ảnh của variant (nếu có)
      if (variant.image && listing?.images) {
        const imageIndex = listing.images.findIndex(img => img === variant.image);
        if (imageIndex !== -1 && carouselApi) {
          carouselApi.scrollTo(imageIndex);
        }
      }
    }
  };

  const handleAddToCart = () => {
    if (!listing) return;
    
    const variants = (listing.variants as { name: string; price: number }[]) || [];
    const hasVariants = variants.length > 0;
    const isReadyToAdd = !hasVariants || (hasVariants && selectedVariant);

    if (!isReadyToAdd) {
      toast({ title: "Vui lòng chọn phân loại", description: "Bạn cần chọn phân loại sản phẩm", variant: "destructive" });
      setHighlightVariant(true);
      variantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightVariant(false), 2000);
      return;
    }

    const productToAdd: Product = {
      id: -Math.abs(parseInt(listing.id.replace(/-/g, '').slice(0, 8), 16)),
      name: listing.name,
      price: currentPrice,
      description: listing.description || '',
      images: listing.images as string[],
      category: listing.category,
      subcategory: listing.subcategory,
      artist: '',
      variants: variants,
      optionGroups: [],
      feesIncluded: true,
      status: listing.tag,
      orderDeadline: null,
      stock: 1,
      priceDisplay: `${currentPrice.toLocaleString('vi-VN')}đ`,
    };
    
    addToCart(productToAdd, quantity, selectedVariant || listing.name);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${listing.name} x${quantity}` });
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${listing?.name} - ${currentPrice.toLocaleString('vi-VN')}đ`;
    if (navigator.share) {
      try { await navigator.share({ title: listing?.name, text: shareText, url: shareUrl }); } catch (error) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Đã copy link" });
    }
  };

  const handleContactSeller = () => {
    if (!listing?.seller_social) return;
    const url = listing.seller_social.startsWith('http') 
      ? listing.seller_social 
      : `https://${listing.seller_social}`;
    window.open(url, '_blank');
  };

  if (isLoading) return <Layout><div className="container mx-auto py-12 flex justify-center h-[50vh]"><LoadingPudding /></div></Layout>;
  if (!listing) return <Layout><div className="container mx-auto py-12 text-center"><h1 className="text-xl font-bold mb-4">Không tìm thấy sản phẩm</h1><Button onClick={() => navigate("/products")}>Quay lại</Button></div></Layout>;

  const variants = (listing.variants as { name: string; price: number }[]) || [];
  const images = listing.images as string[];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 gap-1 pl-0 h-auto py-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> <span className="text-sm">Quay lại</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          
          {/* --- CỘT ẢNH --- */}
          <div className="space-y-4">
            <div className="relative">
              <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                  {images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative overflow-hidden rounded-lg border flex items-center justify-center bg-muted/20 w-full">
                        <img
                          src={image}
                          alt={`${listing.name} - ${index + 1}`}
                          className="w-auto h-auto max-w-full max-h-[350px] md:max-h-[400px] object-contain"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 opacity-70 hover:opacity-100 h-8 w-8" />
                    <CarouselNext className="right-2 opacity-70 hover:opacity-100 h-8 w-8" />
                  </>
                )}
              </Carousel>
              {count > 0 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium pointer-events-none z-10">
                  {current}/{count}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`
                      flex-shrink-0 cursor-pointer rounded-md overflow-hidden border transition-all w-14 h-14 box-content
                      ${index + 1 === current ? 'border-primary opacity-100 ring-1 ring-primary' : 'border-transparent opacity-60 hover:opacity-100'}
                    `}
                    onClick={() => carouselApi?.scrollTo(index)}
                  >
                    <img src={image} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- CỘT THÔNG TIN --- */}
          <div className="space-y-5">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Badge đã được đồng bộ màu sắc ở ProductCard, ở đây dùng màu mặc định cho detail */}
                    <Badge variant={listing.tag === "Pass" ? "secondary" : "default"} className="text-[10px] px-2 py-0 h-5">
                      {listing.tag}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                      {listing.category}
                    </Badge>
                  </div>
                  <h1 className="text-lg md:text-2xl font-bold leading-tight text-foreground">{listing.name}</h1>
                  {/* [ĐÃ ẨN] Mã bài đăng theo yêu cầu */}
                </div>
                <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8 -mt-1 text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Giá tiền */}
            <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl md:text-3xl font-extrabold text-primary">
                  {currentPrice.toLocaleString('vi-VN')}<span className="text-base font-bold underline ml-0.5">đ</span>
                </p>
              </div>
            </div>
            
            {/* Mô tả */}
            {listing.description && (
              <div className="border rounded-lg p-3 md:p-4">
                <span className="font-medium text-sm text-muted-foreground block mb-2">Mô tả</span>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Phân loại */}
            {variants.length > 0 && (
              <div 
                ref={variantRef}
                className={`space-y-3 pt-2 transition-all duration-300 ${highlightVariant ? 'ring-2 ring-primary ring-offset-2 rounded-lg p-2 bg-primary/5 animate-pulse' : ''}`}
              >
                <div>
                  <Label className="text-sm font-medium mb-1.5 block text-muted-foreground">Phân loại</Label>
                  <Select value={selectedVariant} onValueChange={handleVariantChange}>
                    <SelectTrigger className="w-full h-11 text-sm">
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((variant) => (
                        <SelectItem key={variant.name} value={variant.name} className="text-sm">
                          <div className="flex justify-between items-center w-full">
                            <span>{variant.name}</span>
                            {/* [ĐÃ ẨN] Giá tiền trong dropdown theo yêu cầu */}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Số lượng & Actions */}
            <div className="pt-3 space-y-3 border-t">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-muted-foreground">Số lượng</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={decrementQuantity} className="h-9 w-9">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={incrementQuantity} className="h-9 w-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAddToCart} size="lg" className="flex-1 gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 gap-2"
                  onClick={handleContactSeller}
                >
                  <MessageCircle className="h-5 w-5" />
                  Liên hệ người bán
                </Button>
              </div>

              {/* Link MXH của người bán */}
              <a 
                href={listing.seller_social.startsWith('http') ? listing.seller_social : `https://${listing.seller_social}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{listing.seller_social}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
