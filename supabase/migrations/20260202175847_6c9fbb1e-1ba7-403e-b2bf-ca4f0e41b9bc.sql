-- Trigger function for new affiliate registration
CREATE OR REPLACE FUNCTION public.notify_new_affiliate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, order_id, order_number, message, is_read)
  VALUES (
    'new_affiliate',
    NEW.id,
    'CTV-' || SUBSTRING(NEW.referral_code FROM 1 FOR 8),
    '👥 CTV mới đăng ký: ' || NEW.name || ' (' || NEW.phone || ')',
    false
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new affiliates
DROP TRIGGER IF EXISTS on_affiliate_created ON public.affiliates;
CREATE TRIGGER on_affiliate_created
  AFTER INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_affiliate();

-- Trigger function for new user listing
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, order_id, order_number, message, is_read)
  VALUES (
    'new_listing',
    NEW.id,
    NEW.listing_code,
    '🏷️ Bài đăng bán mới: ' || NEW.name || ' từ ' || NEW.seller_phone,
    false
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user listings
DROP TRIGGER IF EXISTS on_listing_created ON public.user_listings;
CREATE TRIGGER on_listing_created
  AFTER INSERT ON public.user_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();