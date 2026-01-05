-- Thêm cột deposit_allowed vào bảng products (mặc định là true - cho phép cọc)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS deposit_allowed boolean DEFAULT true;

-- Tạo storage bucket cho ảnh sản phẩm
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies cho storage bucket product-images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');