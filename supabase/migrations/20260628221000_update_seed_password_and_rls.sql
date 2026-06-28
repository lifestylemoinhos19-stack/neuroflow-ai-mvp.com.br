-- Update seed user password to Skip@Pass123
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass123', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure profiles update_own policy (authenticated users can update their own profile)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Ensure clinical_feedback insert policy (authenticated users can insert)
DROP POLICY IF EXISTS "clinical_feedback_insert_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_insert_own" ON public.clinical_feedback
  FOR INSERT TO authenticated WITH CHECK (doctor_id = auth.uid() OR public.get_user_role() = 'admin');
