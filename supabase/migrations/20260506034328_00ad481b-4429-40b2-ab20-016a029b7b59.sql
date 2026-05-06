ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'Admin';
ALTER TABLE public.master_shops ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'Admin';
UPDATE public.products SET owner = 'Admin' WHERE owner IS NULL OR owner = '';
UPDATE public.master_shops SET owner = 'Admin' WHERE owner IS NULL OR owner = '';
CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner);
CREATE INDEX IF NOT EXISTS idx_master_shops_owner ON public.master_shops(owner);