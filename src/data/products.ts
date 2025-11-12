import { useState, useEffect } from "react";
import type { carouselapi } from "@/components/ui/carousel";
import { useparams, usenavigate } from "react-router-dom";
import { layout } from "@/components/layout";
import { button } from "@/components/ui/button";
import { input } from "@/components/ui/input";
import { label } from "@/components/ui/label";
import { select, selectcontent, selectitem, selecttrigger, selectvalue } from "@/components/ui/select";
import { badge } from "@/components/ui/badge";
// (thêm 2 icon này)
import { shoppingcart, minus, plus, calendaroff, arrowleft } from "lucide-react"; 
// (đọc từ file .ts)
import { productsdata } from "@/data/products";
import { usecart } from "@/contexts/cartcontext";
import { usetoast } from "@/hooks/use-toast";
import {
  carousel,
  carouselcontent,
  carouselitem,
  carouselnext,
  carouselprevious,
} from "@/components/ui/carousel";

export default function productdetail() {
  const { id } = useparams();
  const navigate = usenavigate();
  const { addtocart } = usecart();
  const { toast } = usetoast();
  const [quantity, setquantity] = usestate(1);
  const [carouselapi, setcarouselapi] = usestate<carouselapi>();

  // (đọc từ productsdata)
  const product = productsdata.find(p => p.id === number(id));

  // (thêm các state mới)
  const [currentprice, setcurrentprice] = usestate(product?.price || 0);
  const [selectedvariant, setselectedvariant] = usestate<string>(""); 
  const [selectedoptions, setselectedoptions] = usestate<{ [key: string]: string }>({});
  const [isexpired, setisexpired] = usestate(false);
  
  useeffect(() => {
    if (carouselapi && selectedvariant && product?.variantimagemap) {
      const imageindex = product.variantimagemap[selectedvariant];
      if (imageindex !== undefined) {
        carouselapi.scrollto(imageindex);
      }
    }
  }, [selectedvariant, carouselapi, product]);

  // (useeffect mới để xử lý logic khi product tải xong)
  useeffect(() => {
    if (product) {
      setcurrentprice(product.price);
      
      if (product.orderdeadline) {
        const deadline = new date(product.orderdeadline);
        if (deadline < new date()) setisexpired(true);
      } else if (product.status === "sẵn") {
         setisexpired(false);
      }
      
      // (logic đọc 2 phân loại)
      if (product.optiongroups && product.optiongroups.length > 0) {
        const initialoptions = product.optiongroups.reduce((acc, group) => {
            acc[group.name] = "";
            return acc;
        }, {} as { [key: string]: string });
        setselectedoptions(initialoptions);
      } 
      // (logic 1 phân loại)
      else if (product.variants && product.variants.length === 1) {
          const firstvariant = product.variants[0];
          setselectedvariant(firstvariant.name);
          setcurrentprice(firstvariant.price);
      }
    }
  }, [product]);

  // (useeffect mới để xử lý khi chọn 2 phân loại)
  useeffect(() => {
    if (product?.optiongroups && product.optiongroups.length > 0) {
      const alloptionsselected = object.values(selectedoptions).every(val => val !== "");

      if (alloptionsselected) {
        const constructedname = product.optiongroups
            .map(group => selectedoptions[group.name])
            .join("-");
        
        const variant = product.variants.find(v => v.name === constructedname);
        
        if (variant) {
          setcurrentprice(variant.price);
          setselectedvariant(variant.name);
          
          if (carouselapi && product.variantimagemap) {
            const imageindex = product.variantimagemap[variant.name];
            if (imageindex !== undefined) {
                carouselapi.scrollto(imageindex);
            }
          }
        } else {
          setselectedvariant("");
          setcurrentprice(product.price);
          console.warn("tổ hợp không hợp lệ:", constructedname);
        }
      }
    }
  }, [selectedoptions, product, carouselapi]);
  
  // (sửa lại handleaddtocart)
  const handleaddtocart = () => {
    if (!product) return;

    const hasvariants = product.variants && product.variants.length > 0;

    // (kiểm tra selectedvariant)
    if (hasvariants && !selectedvariant) {
      toast({
        title: "vui lòng chọn đủ phân loại",
        description: "bạn cần chọn tất cả các phân loại sản phẩm",
        variant: "destructive"
      });
      return;
    }

    const correctprice = currentprice; // (lấy giá động)

    const producttoadd = {
      ...product,
      price: correctprice, // (ghi đè giá)
      pricedisplay: `${correctprice.tolocalestring('vi-vn')}đ`
    };
    
    addtocart(producttoadd, quantity, selectedvariant);

    toast({
      title: "đã thêm vào giỏ hàng!",
      description: `${product.name}${selectedvariant ? ` (${selectedvariant})` : ''} x${quantity}`,
    });
  };

  // (thêm 2 hàm xử lý chọn phân loại mới)
  const handleoptionchange = (groupname: string, value: string) => {
    setselectedoptions(prev => ({
      ...prev,
      [groupname]: value,
    }));
  };

  const handlevariantchange = (variantname: string) => {
    setselectedvariant(variantname);
    const variant = product?.variants.find(v => v.name === variantname);
    if (variant) {
      setcurrentprice(variant.price);
    }
  };
  
  const incrementquantity = () => setquantity(prev => prev + 1);
  const decrementquantity = () => setquantity(prev => math.max(1, prev - 1));

  if (!product) {
    return (
      <layout>
        <div classname="container mx-auto px-4 py-12 text-center">
          <h1 classname="text-2xl font-bold mb-4">không tìm thấy sản phẩm</h1>
          <button onclick={() => navigate("/products")}>quay lại</button>
        </div>
      </layout>
    );
  }

  // (render jsx với đầy đủ tính năng)
  return (
    <layout>
      <div classname="container mx-auto px-4 py-12">
        
        {/* nút quay lại */}
        <button
          variant="ghost"
          onclick={() => navigate("/products")}
          classname="mb-6 gap-2"
        >
          <arrowleft classname="h-4 w-4" />
          quay lại trang sản phẩm
        </button>

        <div classname="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* image carousel (giữ định dạng ảnh gốc, giới hạn 500px) */}
          <div classname="space-y-4">
            <carousel classname="w-full" setapi={setcarouselapi}>
              <carouselcontent>
                {product.images.map((image, index) => (
                  <carouselitem key={index}>
                    <div classname="relative overflow-hidden rounded-lg border flex items-center justify-center bg-muted/20">
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        classname="w-auto h-auto max-w-full max-h-[500px] object-contain"
                      />
                    </div>
                  </carouselitem>
                ))}
              </carouselcontent>
              {product.images.length > 1 && (
                <>
                  <carouselprevious classname="left-4" />
                  <carouselnext classname="right-4" />
                </>
              )}
            </carousel>
            {product.images.length > 1 && (
              <div classname="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    classname="flex-shrink-0 cursor-pointer"
                    onclick={() => carouselapi?.scrollto(index)}
                  >
                    <img
                      src={image}
                      alt={`thumb ${index + 1}`}
                      classname="w-20 h-20 object-cover rounded border hover:border-primary transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* product info */}
          <div classname="space-y-6">
            <div>
              {/* (đọc tag động) */}
              {product.status && (
                <badge variant="secondary" classname="mb-3">
                  {product.status}
                </badge>
              )}
              <h1 classname="text-3xl font-bold mb-2">{product.name}</h1>
            </div>

            <div classname="border-t pt-4">
              {/* (đọc giá động) */}
              <p classname="text-4xl font-bold text-primary">
                {currentprice.tolocalestring('vi-vn')}đ
              </p>
              <p classname="text-sm text-muted-foreground mt-2">
                *{product.feesincluded ? 'đã full phí dự kiến' : 'chưa full phí'}
              </p>
              {/* (đọc hạn order động) */}
              {product.orderdeadline && !isexpired && (
                 <p classname="text-sm text-amber-600 mt-2">
                   hạn order: {new date(product.orderdeadline).tolocalestring('vi-vn')}
                 </p>
              )}
              {isexpired && (
                 <p classname="text-sm text-destructive mt-2">
                   đã hết hạn order
                 </p>
              )}
            </div>
            
            {/* (khôi phục mô tả và master) */}
            {(product.description && product.description.length > 0) || product.master ? (
              <div classname="border-t pt-4 space-y-4">
                
                {product.description && product.description.length > 0 && (
                  <div>
                    <h3 classname="font-semibold mb-2">mô tả sản phẩm</h3>
                    <ul classname="text-muted-foreground space-y-1 list-disc list-inside">
                      {product.description.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.master && (
                  <div>
                    <h3 classname="font-semibold mb-1">master</h3>
                    <p classname="text-muted-foreground">{product.master}</p>
                  </div>
                )}

              </div>
            ) : null}

            {/* (logic 1 hoặc 2 phân loại) */}
            <div classname="border-t pt-4 space-y-4">
              {/* (trường hợp 2+ phân loại - id 4) */}
              {product.optiongroups && product.optiongroups.length > 0 && (
                product.optiongroups.map((group) => (
                  <div key={group.name}>
                    <label htmlfor={`variant-${group.name}`} classname="text-base font-semibold">
                      {group.name} *
                    </label>
                    <select 
                      value={selectedoptions[group.name]} 
                      onvaluechange={(value) => handleoptionchange(group.name, value)}
                    >
                      <selecttrigger id={`variant-${group.name}`} classname="mt-2">
                        <selectvalue placeholder={`chọn ${group.name.tolowercase()}`} />
                      </selecttrigger>
                      <selectcontent>
                        {group.options.map((option) => (
                          <selectitem key={option} value={option}>
                            {option}
                          </selectitem>
                        ))}
                      </selectcontent>
                    </select>
                  </div>
                ))
              )}

              {/* (trường hợp 1 phân loại - id 3) */}
              {(!product.optiongroups || product.optiongroups.length === 0) && product.variants && product.variants.length > 1 && (
                <div>
                  <label htmlfor="variant" classname="text-base font-semibold">
                    phân loại *
                  </label>
                  <select 
                    value={selectedvariant} 
                    onvaluechange={handlevariantchange}
                  >
                    <selecttrigger id="variant" classname="mt-2">
                      <selectvalue placeholder="chọn phân loại" />
                    </selecttrigger>
                    <selectcontent>
                      {product.variants.map((variant) => (
                        <selectitem key={variant.name} value={variant.name}>
                          <div classname="flex items-center gap-2">
                            {product.variantimagemap && product.variantimagemap[variant.name] !== undefined && (
                              <img 
                                src={product.images[product.variantimagemap[variant.name]]} 
                                alt={variant.name}
                                classname="w-8 h-8 object-cover rounded border"
                              />
                            )}
                            <span>{variant.name}</span>
                          </div>
                        </selectitem>
                      ))}
                    </selectcontent>
                  </select>
                </div>
              )}
            </div>

            {/* (quantity) */}
            <div classname="border-t pt-4">
              <label htmlfor="quantity" classname="text-base font-semibold">
                số lượng
              </label>
              <div classname="flex items-center gap-4 mt-2">
                <button variant="outline" size="icon" onclick={decrementquantity} disabled={quantity <= 1}>
                  <minus classname="h-4 w-4" />
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onchange={(e) => setquantity(math.max(1, parseint(e.target.value) || 1))}
                  classname="w-20 text-center"
                />
                <button variant="outline" size="icon" onclick={incrementquantity}>
                  <plus classname="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* (action buttons) */}
            <div classname="border-t pt-4 space-y-3">
              <button 
                onclick={handleaddtocart}
                classname="w-full bg-gradient-primary gap-2"
                size="lg"
                disabled={isexpired}
              >
                {isexpired ? <calendaroff classname="h-5 w-4" /> : <shoppingcart classname="h-5 w-5" />}
                {isexpired ? "đã hết hạn order" : "thêm vào giỏ hàng"}
              </button>
              <button 
                onclick={() => navigate("/products")}
                variant="outline"
                classname="w-full"
                size="lg"
              >
                tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      </div>
    </layout>
  );
}
