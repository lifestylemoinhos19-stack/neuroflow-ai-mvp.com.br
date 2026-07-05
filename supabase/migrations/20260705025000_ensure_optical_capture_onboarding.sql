-- Ensure focus_sessions has capture_method column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'capture_method'
  ) THEN
    ALTER TABLE public.focus_sessions ADD COLUMN capture_method TEXT DEFAULT 'camera_rppg';
  END IF;
END $$;

-- Ensure RLS is enabled on user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies on user_onboarding (idempotent)
DROP POLICY IF EXISTS "user_onboarding_select_own" ON public.user_onboarding;
CREATE POLICY "user_onboarding_select_own" ON public.user_onboarding
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_onboarding_insert_own" ON public.user_onboarding;
CREATE POLICY "user_onboarding_insert_own" ON public.user_onboarding
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_onboarding_update_own" ON public.user_onboarding;
CREATE POLICY "user_onboarding_update_own" ON public.user_onboarding
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_onboarding_delete_own" ON public.user_onboarding;
CREATE POLICY "user_onboarding_delete_own" ON public.user_onboarding
  FOR DELETE TO authenticated USING (user_id = auth.uid());
