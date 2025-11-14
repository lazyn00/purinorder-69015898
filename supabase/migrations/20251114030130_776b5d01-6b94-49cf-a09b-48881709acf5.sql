-- Add order_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

-- Add second_payment_proof_url for deposit orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS second_payment_proof_url text;