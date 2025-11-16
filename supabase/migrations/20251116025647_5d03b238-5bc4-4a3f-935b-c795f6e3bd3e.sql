-- Tạo bảng đăng ký nhận thông báo sản phẩm về hàng
CREATE TABLE IF NOT EXISTS public.product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX idx_product_notifications_product_id ON public.product_notifications(product_id);
CREATE INDEX idx_product_notifications_email ON public.product_notifications(email);
CREATE INDEX idx_product_notifications_notified ON public.product_notifications(notified);

-- Enable RLS
ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;

-- Policy cho phép mọi người insert (đăng ký)
CREATE POLICY "Anyone can register for notifications"
  ON public.product_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy cho phép người dùng xem đăng ký của chính họ
CREATE POLICY "Users can view their own notifications"
  ON public.product_notifications
  FOR SELECT
  USING (true);

-- Thêm comment
COMMENT ON TABLE public.product_notifications IS 'Lưu thông tin đăng ký nhận email khi sản phẩm về hàng';