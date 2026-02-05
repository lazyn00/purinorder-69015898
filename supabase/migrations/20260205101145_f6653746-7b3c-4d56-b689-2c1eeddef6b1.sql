-- Create order_status_history table to track status changes
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  field_changed TEXT NOT NULL, -- 'payment_status' or 'order_progress'
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by TEXT DEFAULT 'admin' -- 'admin' or 'system' or 'customer'
);

-- Enable Row Level Security
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (customers can see their order history)
CREATE POLICY "Anyone can view order status history"
ON public.order_status_history
FOR SELECT
USING (true);

-- Create policy for insert (admin/system can insert)
CREATE POLICY "Anyone can insert order status history"
ON public.order_status_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups by order_id
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;