-- Add clinician signature and professional credentials support
-- Uses system_settings for global clinician data and profiles for per-user signature_url

-- Add signature_url column to profiles for per-clinician signature images
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Store global clinician credentials in system_settings
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'clinician_credentials',
  jsonb_build_object(
    'name', 'Rose Mary Alves',
    'crm', 'CRMERS 19625',
    'rqe', 'RQE 29582',
    'signature_url', '${SUPABASE_URL_PLACEHOLDER}/storage/v1/object/public/clinic-assets/clinician-signature.png',
    'full_credentials', 'Rose Mary Alves - CRMERS 19625 RQE 29582'
  ),
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- Ensure clinic-assets bucket exists for signature storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of clinic-assets (signature image needs to be publicly accessible)
DROP POLICY IF EXISTS "public_read_clinic_assets" ON storage.objects;
CREATE POLICY "public_read_clinic_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-assets');
