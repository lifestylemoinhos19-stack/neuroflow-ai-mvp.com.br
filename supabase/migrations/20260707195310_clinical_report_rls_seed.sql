-- ============================================================
-- 1. Ensure seed user exists with password Skip@Pass123
-- ============================================================
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
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Lifestyle Moinhos"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- Ensure password is Skip@Pass123
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure admin profile
UPDATE public.profiles
SET role = 'admin',
    privacy_consent = true,
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');

-- ============================================================
-- 2. Ensure RLS on anamnesis_responses for auth.uid()-based access
--    (authenticated users can SELECT/INSERT their own data)
-- ============================================================

-- SELECT: authenticated users can only see responses linked to their own sessions
DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- INSERT: authenticated users can insert responses linked to their own sessions
DROP POLICY IF EXISTS "anamnesis_responses_insert" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert" ON public.anamnesis_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- UPDATE: authenticated users can update their own responses
DROP POLICY IF EXISTS "anamnesis_responses_update" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update" ON public.anamnesis_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  ) WITH CHECK (true);

-- DELETE: authenticated users can delete their own responses
DROP POLICY IF EXISTS "anamnesis_responses_delete" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_delete" ON public.anamnesis_responses
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- ============================================================
-- 3. Ensure anamnesis_sessions policies for authenticated users
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "anamnesis_sessions_insert" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert" ON public.anamnesis_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');
