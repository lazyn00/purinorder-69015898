-- Allow public inserts into products to fix RLS error from admin UI
CREATE POLICY "Public can insert products"
ON public.products
FOR INSERT
WITH CHECK (true);