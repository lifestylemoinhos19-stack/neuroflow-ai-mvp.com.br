-- Consolidation migration: ensure user_onboarding table, RLS, function, and trigger

CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_first_access BOOLEAN NOT NULL DEFAULT true,
  paired_sensor_id TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_onboarding_user_id_key ON public.user_onboarding(user_id);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_paired_sensor_id
  ON public.user_onboarding (paired_sensor_id)
  WHERE paired_sensor_id IS NOT NULL;

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_onboarding (user_id, is_first_access, paired_sensor_id, onboarding_completed_at)
  VALUES (NEW.id, true, NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_onboarding ON auth.users;
CREATE TRIGGER on_auth_user_created_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();
  END IF;
END $$;
