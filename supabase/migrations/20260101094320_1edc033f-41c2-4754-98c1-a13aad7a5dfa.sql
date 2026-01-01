-- Add additional_bills column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS additional_bills jsonb DEFAULT '[]'::jsonb;