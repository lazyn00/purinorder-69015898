-- Tạo bảng quản lý mã giảm giá
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' hoặc 'fixed'
  discount_value NUMERIC NOT NULL, -- % hoặc số tiền cố định
  max_uses INTEGER, -- Số lượng tối đa sử dụng (NULL = không giới hạn)
  used_count INTEGER NOT NULL DEFAULT 0, -- Số lần đã sử dụng
  min_order_value NUMERIC, -- Giá trị đơn hàng tối thiểu (NULL = không yêu cầu)
  max_discount NUMERIC, -- Giảm tối đa (cho loại percentage, NULL = không giới hạn)
  applicable_product_ids INTEGER[], -- Danh sách ID sản phẩm áp dụng (NULL = tất cả)
  applicable_categories TEXT[], -- Danh sách danh mục áp dụng (NULL = tất cả)
  start_date TIMESTAMP WITH TIME ZONE, -- Ngày bắt đầu (NULL = ngay lập tức)
  end_date TIMESTAMP WITH TIME ZONE, -- Ngày kết thúc (NULL = không hết hạn)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bật RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Policy cho phép tất cả đọc mã giảm giá (để validate ở client)
CREATE POLICY "Anyone can view active discount codes" 
ON public.discount_codes 
FOR SELECT 
USING (is_active = true);

-- Policy cho phép admin thao tác (qua service role hoặc không kiểm tra auth)
CREATE POLICY "Public can insert discount codes" 
ON public.discount_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update discount codes" 
ON public.discount_codes 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete discount codes" 
ON public.discount_codes 
FOR DELETE 
USING (true);

-- Trigger cập nhật updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_products_updated_at();