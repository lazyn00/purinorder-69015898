
CREATE TABLE public.master_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_name text NOT NULL,
  message text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.master_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view master updates" ON public.master_updates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert master updates" ON public.master_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update master updates" ON public.master_updates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete master updates" ON public.master_updates FOR DELETE USING (true);

CREATE INDEX idx_master_updates_master_name ON public.master_updates (master_name);
CREATE INDEX idx_master_updates_created_at ON public.master_updates (created_at DESC);
