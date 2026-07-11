INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_clinic_assets" ON storage.objects;
CREATE POLICY "public_read_clinic_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-assets');
