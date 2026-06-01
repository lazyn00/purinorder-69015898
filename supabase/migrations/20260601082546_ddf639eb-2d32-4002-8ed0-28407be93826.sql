-- Harden SECURITY DEFINER trigger functions with input length limits
-- This prevents abuse via the public-insert trigger paths into admin_notifications.

CREATE OR REPLACE FUNCTION public.notify_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (type, order_id, order_number, message, is_read)
  VALUES (
    'new_order',
    NEW.id,
    LEFT(COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)), 64),
    LEFT('🛒 Đơn hàng mới #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' từ ' || COALESCE(NEW.customer_phone, '') || ' - ' || NEW.total_price || 'đ', 500),
    false
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (type, order_id, order_number, message, is_read)
  VALUES (
    'new_listing',
    NEW.id,
    LEFT(COALESCE(NEW.listing_code, ''), 64),
    LEFT('🏷️ Bài đăng bán mới: ' || COALESCE(NEW.name, '') || ' từ ' || COALESCE(NEW.seller_phone, ''), 500),
    false
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_affiliate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (type, order_id, order_number, message, is_read)
  VALUES (
    'new_affiliate',
    NEW.id,
    LEFT('CTV-' || COALESCE(SUBSTRING(NEW.referral_code FROM 1 FOR 8), ''), 64),
    LEFT('👥 CTV mới đăng ký: ' || COALESCE(NEW.name, '') || ' (' || COALESCE(NEW.phone, '') || ')', 500),
    false
  );
  RETURN NEW;
END;
$function$;