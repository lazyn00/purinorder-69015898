-- Create table for user-submitted product listings
CREATE TABLE public.user_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Product info
  name text NOT NULL,
  description text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  subcategory text NOT NULL,
  tag text NOT NULL, -- 'Pass' or 'Gom'
  price bigint,
  
  -- Seller contact info
  seller_phone text NOT NULL,
  seller_social text NOT NULL,
  seller_bank_name text NOT NULL,
  seller_bank_account text NOT NULL,
  seller_account_name text NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, sold
  admin_note text,
  
  -- Link to products table after approval
  product_id integer
);

-- Enable RLS
ALTER TABLE public.user_listings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can insert listings"
ON public.user_listings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view listings"
ON public.user_listings
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update their own listings by code"
ON public.user_listings
FOR UPDATE
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_user_listings_updated_at
BEFORE UPDATE ON public.user_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_products_updated_at();

-- Add agree_cancel column to orders for the checkbox
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS agree_cancel_low_quantity boolean DEFAULT false;