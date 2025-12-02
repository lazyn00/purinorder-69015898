-- Allow public deletion of products (for admin access)
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Anyone can delete products"
ON public.products
FOR DELETE
USING (true);

-- Add index for faster product queries
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);