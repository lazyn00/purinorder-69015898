CREATE TABLE public.master_shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  shop_link TEXT,
  description TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.master_shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view master shops" ON public.master_shops FOR SELECT USING (true);
CREATE POLICY "Anyone can insert master shops" ON public.master_shops FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update master shops" ON public.master_shops FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete master shops" ON public.master_shops FOR DELETE USING (true);

CREATE TRIGGER update_master_shops_updated_at
BEFORE UPDATE ON public.master_shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_master_shops_slug ON public.master_shops(slug);
CREATE INDEX idx_master_shops_master_name ON public.master_shops(master_name);