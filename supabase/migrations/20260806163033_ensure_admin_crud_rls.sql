-- Ensure admin full CRUD on clinical_feedback
DROP POLICY IF EXISTS "clinical_feedback_admin_all_crud" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_admin_all_crud" ON public.clinical_feedback
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Ensure admin full CRUD on clinical_reports
DROP POLICY IF EXISTS "clinical_reports_admin_all_crud" ON public.clinical_reports;
CREATE POLICY "clinical_reports_admin_all_crud" ON public.clinical_reports
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Ensure admin full CRUD on patients
DROP POLICY IF EXISTS "patients_admin_all_crud" ON public.patients;
CREATE POLICY "patients_admin_all_crud" ON public.patients
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Ensure admin full CRUD on guests
DROP POLICY IF EXISTS "guests_admin_all_crud" ON public.guests;
CREATE POLICY "guests_admin_all_crud" ON public.guests
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Ensure seed admin user password is correct
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure admin role on profile
UPDATE public.profiles
SET role = 'admin',
    privacy_consent = COALESCE(privacy_consent, true),
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');
