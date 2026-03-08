
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, order_id, order_number, message, is_read)
  VALUES (
    'new_order',
    NEW.id,
    COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)),
    '🛒 Đơn hàng mới #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' từ ' || NEW.customer_phone || ' - ' || NEW.total_price || 'đ',
    false
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();
