-- Add shipping information columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_provider TEXT,
ADD COLUMN IF NOT EXISTS tracking_code TEXT;