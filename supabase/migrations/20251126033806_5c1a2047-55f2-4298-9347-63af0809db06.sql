-- Create products table for admin management
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  te NUMERIC,
  rate NUMERIC,
  r_v NUMERIC,
  can_weight NUMERIC,
  pack NUMERIC,
  cong NUMERIC,
  total NUMERIC,
  price BIGINT NOT NULL,
  actual_rate NUMERIC,
  actual_can NUMERIC,
  actual_pack NUMERIC,
  fees_included BOOLEAN DEFAULT true,
  category TEXT,
  subcategory TEXT,
  artist TEXT,
  status TEXT DEFAULT 'Sẵn',
  order_deadline TIMESTAMP WITH TIME ZONE,
  images JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  master TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  option_groups JSONB DEFAULT '[]'::jsonb,
  variant_image_map JSONB DEFAULT '{}'::jsonb,
  stock INTEGER,
  link_order TEXT,
  proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

-- Only allow insert/update/delete for authenticated users (admin will be checked in app)
CREATE POLICY "Authenticated users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_products_updated_at();