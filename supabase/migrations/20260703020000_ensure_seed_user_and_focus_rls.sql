-- Ensure seed user lifestylemoinhos19@gmail.com exists
DO $$
DECLARE
  new_user_id uuid;
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
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Lifestyle Moinhos"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, role, privacy_consent, privacy_consent_accepted_at)
    VALUES (new_user_id, 'Lifestyle Moinhos', 'admin', true, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_biofeedback_logs ENABLE ROW LEVEL SECURITY;

-- Ensure focus_sessions policies (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "focus_sessions_select_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select_own" ON public.focus_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "focus_sessions_insert_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_insert_own" ON public.focus_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "focus_sessions_update_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_update_own" ON public.focus_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "focus_sessions_delete_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_delete_own" ON public.focus_sessions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Ensure focus_biofeedback_logs policies (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "focus_biofeedback_logs_select_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_select_own" ON public.focus_biofeedback_logs
  FOR SELECT TO authenticated USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "focus_biofeedback_logs_insert_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_insert_own" ON public.focus_biofeedback_logs
  FOR INSERT TO authenticated WITH CHECK (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "focus_biofeedback_logs_update_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_update_own" ON public.focus_biofeedback_logs
  FOR UPDATE TO authenticated
  USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "focus_biofeedback_logs_delete_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_delete_own" ON public.focus_biofeedback_logs
  FOR DELETE TO authenticated
  USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));
