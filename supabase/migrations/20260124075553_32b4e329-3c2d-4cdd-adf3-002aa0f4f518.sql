-- First create the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create affiliates table for collaborators
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  social_link TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 5,
  total_earnings BIGINT NOT NULL DEFAULT 0,
  pending_earnings BIGINT NOT NULL DEFAULT 0,
  paid_earnings BIGINT NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  bank_name TEXT,
  bank_account TEXT,
  account_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_orders table to track referral sales
CREATE TABLE public.affiliate_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT,
  order_total BIGINT NOT NULL,
  commission_amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(affiliate_id, order_id)
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliates
CREATE POLICY "Anyone can register as affiliate"
ON public.affiliates FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view affiliates"
ON public.affiliates FOR SELECT
USING (true);

CREATE POLICY "Anyone can update affiliates"
ON public.affiliates FOR UPDATE
USING (true);

-- RLS policies for affiliate_orders
CREATE POLICY "Anyone can view affiliate orders"
ON public.affiliate_orders FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert affiliate orders"
ON public.affiliate_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update affiliate orders"
ON public.affiliate_orders FOR UPDATE
USING (true);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := 'PUR' || UPPER(SUBSTRING(MD5(NEW.phone || NOW()::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating referral code
CREATE TRIGGER generate_affiliate_referral_code
BEFORE INSERT ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create trigger for updating updated_at
CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();