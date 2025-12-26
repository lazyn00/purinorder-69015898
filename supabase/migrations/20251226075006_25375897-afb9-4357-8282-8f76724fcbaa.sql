-- Add social_link column to product_notifications table for FB/IG/Threads links
ALTER TABLE public.product_notifications 
ADD COLUMN IF NOT EXISTS social_link text;

-- Make email column nullable since we're moving to social links
ALTER TABLE public.product_notifications 
ALTER COLUMN email DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.product_notifications.social_link IS 'Facebook/Instagram/Threads link for notifications';