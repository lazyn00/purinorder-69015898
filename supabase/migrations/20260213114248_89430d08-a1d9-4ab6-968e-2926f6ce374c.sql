
-- Drop restrictive UPDATE policy and create permissive one
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;

CREATE POLICY "Anyone can update products"
ON public.products
FOR UPDATE
USING (true)
WITH CHECK (true);
