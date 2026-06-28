DO $$
DECLARE
  new_user_id uuid;
  existing_profile_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lifestylemoinhos19@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "NeuroFlow User"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, role, full_name)
    VALUES (new_user_id, 'hospede', 'NeuroFlow User')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO existing_profile_id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com';
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (existing_profile_id, 'hospede', 'NeuroFlow User')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
