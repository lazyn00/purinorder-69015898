-- Allow anyone to delete listings (admin will use this)
CREATE POLICY "Anyone can delete listings"
ON public.user_listings
FOR DELETE
USING (true);