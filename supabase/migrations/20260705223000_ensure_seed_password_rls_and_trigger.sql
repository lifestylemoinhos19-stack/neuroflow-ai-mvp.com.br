-- Ensure seed user password is Skip@Pass
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure handle_new_user trigger populates profiles on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, privacy_consent)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'hospede',
    COALESCE((NEW.raw_user_meta_data->>'privacy_consent')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on all key application tables
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_biofeedback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_test_logs ENABLE ROW LEVEL SECURITY;

-- Ensure system_updates allows authenticated insert (for camera error logging)
DROP POLICY IF EXISTS "system_updates_authenticated_insert" ON public.system_updates;
CREATE POLICY "system_updates_authenticated_insert" ON public.system_updates
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "system_updates_authenticated_select" ON public.system_updates;
CREATE POLICY "system_updates_authenticated_select" ON public.system_updates
  FOR SELECT TO authenticated USING (true);

-- Ensure audit_logs allows authenticated insert
DROP POLICY IF EXISTS "audit_logs_authenticated_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_authenticated_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure security_logs allows authenticated insert
DROP POLICY IF EXISTS "security_logs_authenticated_insert" ON public.security_logs;
CREATE POLICY "security_logs_authenticated_insert" ON public.security_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure stress_test_logs policies for authenticated users
DROP POLICY IF EXISTS "stress_test_logs_authenticated_select" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_authenticated_select" ON public.stress_test_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "stress_test_logs_authenticated_insert" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_authenticated_insert" ON public.stress_test_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "stress_test_logs_authenticated_update" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_authenticated_update" ON public.stress_test_logs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stress_test_logs_authenticated_delete" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_authenticated_delete" ON public.stress_test_logs
  FOR DELETE TO authenticated USING (true);
