-- Add notes column to orders table for customer remarks
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes text;