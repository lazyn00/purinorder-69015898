-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'full';

-- Add check constraint for payment_type
ALTER TABLE public.orders
ADD CONSTRAINT check_payment_type 
CHECK (payment_type IN ('full', 'deposit'));