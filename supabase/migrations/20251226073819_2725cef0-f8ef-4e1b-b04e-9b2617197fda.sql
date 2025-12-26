-- Create product_views table for tracking product views
CREATE TABLE public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views
CREATE POLICY "Anyone can insert product views"
ON public.product_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read view counts
CREATE POLICY "Anyone can read product views"
ON public.product_views
FOR SELECT
USING (true);

-- Create index for faster counting
CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);

-- Create admin_notifications table for real-time notifications
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  order_id UUID NOT NULL,
  order_number TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert notifications (from TrackOrder)
CREATE POLICY "Anyone can insert admin notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read notifications (admin page)
CREATE POLICY "Anyone can read admin notifications"
ON public.admin_notifications
FOR SELECT
USING (true);

-- Allow anyone to update notifications (mark as read)
CREATE POLICY "Anyone can update admin notifications"
ON public.admin_notifications
FOR UPDATE
USING (true);

-- Enable realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;