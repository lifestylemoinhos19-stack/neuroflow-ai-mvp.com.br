-- Ensure audit_logs allows authenticated users to insert stress test results
-- and admins to read them

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

-- Allow authenticated users to read their own stress test logs
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Ensure insert policy exists for stress test logging
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Anon insert (for edge function service role fallback)
DROP POLICY IF EXISTS "audit_logs_anon_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_anon_insert" ON public.audit_logs
  FOR INSERT TO anon WITH CHECK (true);

-- Ensure the admin user has admin role in profiles (idempotent)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, role, full_name, privacy_consent, privacy_consent_accepted_at)
    VALUES (v_user_id, 'admin', 'NeuroFlow Admin', true, NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      privacy_consent = true,
      privacy_consent_accepted_at = COALESCE(profiles.privacy_consent_accepted_at, NOW());
  END IF;
END $$;
