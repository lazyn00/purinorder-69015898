
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_attributes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.master_shops ADD COLUMN IF NOT EXISTS shipping_fee_total bigint DEFAULT 0;
