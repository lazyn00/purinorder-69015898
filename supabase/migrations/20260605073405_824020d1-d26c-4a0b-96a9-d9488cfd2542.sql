CREATE TABLE public.product_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.product_change_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_change_history TO authenticated;
GRANT ALL ON public.product_change_history TO service_role;
ALTER TABLE public.product_change_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read product history" ON public.product_change_history FOR SELECT USING (true);
CREATE POLICY "Public can insert product history" ON public.product_change_history FOR INSERT WITH CHECK (true);
CREATE INDEX product_change_history_product_idx ON public.product_change_history(product_id, changed_at DESC);