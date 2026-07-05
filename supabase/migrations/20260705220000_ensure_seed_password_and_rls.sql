-- Ensure seed user password is Skip@Pass per acceptance criteria
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure capture_method column exists on focus_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'capture_method'
  ) THEN
    ALTER TABLE public.focus_sessions ADD COLUMN capture_method TEXT DEFAULT 'camera_rppg';
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
