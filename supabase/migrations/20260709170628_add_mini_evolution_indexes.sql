CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_profile_id
  ON public.anamnesis_sessions(profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_metadata_gin
  ON public.anamnesis_sessions USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_profile_status
  ON public.anamnesis_sessions(profile_id, status);

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
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';

UPDATE public.profiles
SET role = 'admin',
    privacy_consent = true,
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');

DROP POLICY IF EXISTS "anamnesis_sessions_clinical_evolution_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_clinical_evolution_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (true);
