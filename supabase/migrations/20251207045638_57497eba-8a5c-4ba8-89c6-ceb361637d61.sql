-- Thêm cột thời gian sản xuất cho products
ALTER TABLE public.products 
ADD COLUMN production_time text;