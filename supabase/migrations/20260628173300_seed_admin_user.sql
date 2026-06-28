DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lifestylemoinhos19@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "NeuroFlow Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, role, full_name, privacy_consent, privacy_consent_accepted_at)
    VALUES (v_user_id, 'admin', 'NeuroFlow Admin', true, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com';
    INSERT INTO public.profiles (id, role, full_name, privacy_consent, privacy_consent_accepted_at)
    VALUES (v_user_id, 'admin', 'NeuroFlow Admin', true, NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      privacy_consent = true,
      privacy_consent_accepted_at = COALESCE(profiles.privacy_consent_accepted_at, NOW());
  END IF;
END $$;
