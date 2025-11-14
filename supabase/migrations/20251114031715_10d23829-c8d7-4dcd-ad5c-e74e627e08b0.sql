-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create RLS policies for payment-proofs bucket
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Anyone can update payment proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Anyone can delete payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs');