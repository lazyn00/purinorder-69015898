-- Fix sequence to be above max existing id
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM products), false);

-- Also make all products RLS policies permissive (drop restrictive ones, recreate as permissive)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Public can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);