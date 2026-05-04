import { useState, useRef } from "react";
import { toJpeg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
}

interface ExportProps {
  masterName: string;
  products: Product[];
}

export default function MasterExport({ masterName, products }: ExportProps) {
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!exportRef.current) return;
    setExporting(true);

    try {
      // Chờ một chút để ảnh kịp load
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const dataUrl = await toJpeg(exportRef.current, {
        quality: 0.95,
        backgroundColor: "#fff5f7", // Màu nền hồng nhạt tone Purin
      });

      const link = document.createElement("a");
      link.download = `Purin-Order-${masterName}.jpg`;
      link.href = dataUrl;
      link.click();

      toast({ title: "Thành công", description: "Đã xuất ảnh preview." });
    } catch (err) {
      toast({ title: "Lỗi", description: "Không thể xuất ảnh.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleExport} disabled={exporting} className="w-full md:w-auto">
        {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
        Xuất ảnh Preview tổng hợp
      </Button>

      {/* VÙNG CHỨA ẢNH - CHỈ HIỂN THỊ ĐỂ CHỤP */}
      <div className="overflow-hidden h-0 w-0 opacity-0 absolute"> 
        <div 
          ref={exportRef} 
          className="p-8 w-[800px] font-sans text-[#4a4a4a]"
          style={{ backgroundColor: "#fff5f7" }}
        >
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-dashed border-pink-200 pb-6">
            <h1 className="text-3xl font-black text-pink-500 mb-2 uppercase tracking-tighter">Purin Order</h1>
            <p className="text-xl font-bold bg-pink-100 inline-block px-4 py-1 rounded-full">
              Bảng giá: {masterName}
            </p>
            <p className="text-sm mt-3 text-pink-400 font-medium italic">
              ✨ Website: purinorder.vercel.app | Chốt đơn nhanh chóng ✨
            </p>
          </div>

          {/* Grid sản phẩm - 4 cột giống ảnh mẫu */}
          <div className="grid grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white p-2 rounded-xl shadow-sm flex flex-col border border-pink-50">
                <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted flex items-center justify-center">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <ImageIcon className="text-pink-100 h-8 w-8" />
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-[11px] font-bold line-clamp-2 leading-tight mb-1 h-7">
                    {p.name}
                  </p>
                  <p className="text-pink-600 font-black text-sm">
                    {p.price.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-dashed border-pink-200 text-center">
            <p className="text-[10px] text-pink-300 font-bold uppercase tracking-widest">
              Lưu ý: Giá đã bao gồm phí công mua & vận chuyển cố định
            </p>
            <div className="mt-4 flex justify-center items-center gap-2">
               <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
               <p className="text-xs font-bold text-pink-400">Purin Order - Gói ghém sự ngọt ngào vào từng đơn hàng</p>
               <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
