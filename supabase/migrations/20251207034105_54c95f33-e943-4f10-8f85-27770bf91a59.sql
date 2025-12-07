-- Add surcharge column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS surcharge bigint DEFAULT 0;