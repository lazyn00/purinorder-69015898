
-- Thêm các cột còn thiếu cho bảng products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS includes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chenh numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_display text;
