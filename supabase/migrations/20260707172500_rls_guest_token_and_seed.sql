-- ============================================================
-- 1. Tighten anon SELECT on anamnesis_sessions: only guest sessions
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_sessions_select_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select_anon" ON public.anamnesis_sessions
  FOR SELECT TO anon USING (guest_token IS NOT NULL);

-- ============================================================
-- 2. Tighten anon SELECT on anamnesis_responses: only responses linked to guest sessions
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_responses_select_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select_anon" ON public.anamnesis_responses
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND s.guest_token IS NOT NULL
    )
  );

-- ============================================================
-- 3. Ensure anon INSERT policies remain permissive
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_insert_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert_anon" ON public.anamnesis_responses
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- 4. Ensure authenticated users can SELECT/UPDATE only their own data
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "anamnesis_responses_update" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update" ON public.anamnesis_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  ) WITH CHECK (true);

-- ============================================================
-- 5. Update seed user password to Skip@Pass2025
-- ============================================================
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass2025', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure admin role
UPDATE public.profiles
SET role = 'admin',
    privacy_consent = true,
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');
