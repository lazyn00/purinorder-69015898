
ALTER TABLE public.orders ADD COLUMN shipping_fee bigint DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN other_fee bigint DEFAULT 0;

ALTER TABLE public.products ADD COLUMN proof_images jsonb DEFAULT '[]'::jsonb;
