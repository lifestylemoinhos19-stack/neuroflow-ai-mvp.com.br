-- Add has_completed_onboarding column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT false;

-- Ensure existing rows have the default value
UPDATE public.profiles SET has_completed_onboarding = false WHERE has_completed_onboarding IS NULL;

-- Ensure RLS policies allow authenticated users to update their own onboarding status
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Ensure seed user exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'lifestylemoinhos19@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Lifestyle Moinhos"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- Ensure seed user profile exists
INSERT INTO public.profiles (id, full_name, role, privacy_consent, privacy_consent_accepted_at, has_completed_onboarding)
SELECT id, 'Lifestyle Moinhos', 'admin', true, NOW(), false
FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Ensure password is Skip@Pass
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';
