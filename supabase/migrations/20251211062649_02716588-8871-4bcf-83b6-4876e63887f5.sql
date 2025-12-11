-- Create table for product views
CREATE TABLE public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views
CREATE POLICY "Anyone can insert product views"
ON public.product_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read view counts
CREATE POLICY "Anyone can read product views"
ON public.product_views
FOR SELECT
USING (true);

-- Create index for faster counting
CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
