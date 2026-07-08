-- 1. Add admin_edited_interpretation column to clinical_feedback
ALTER TABLE public.clinical_feedback ADD COLUMN IF NOT EXISTS admin_edited_interpretation text;

-- 2. Remove duplicates before creating unique index on session_id
DELETE FROM public.clinical_feedback a
USING public.clinical_feedback b
WHERE a.session_id IS NOT NULL
  AND a.session_id = b.session_id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_feedback_session_unique
  ON public.clinical_feedback(session_id);

-- 3. Ensure admin user exists with admin role
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
      '{"name": "NeuroFlow Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- Ensure password is current
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

-- 4. Add DELETE policy for anamnesis_sessions (admin + own data)
DROP POLICY IF EXISTS "anamnesis_sessions_delete" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_delete" ON public.anamnesis_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- 5. Ensure admin full access to clinical_feedback
DROP POLICY IF EXISTS "clinical_feedback_select_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_select_own" ON public.clinical_feedback
  FOR SELECT TO authenticated
  USING (doctor_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "clinical_feedback_insert_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_insert_own" ON public.clinical_feedback
  FOR INSERT TO authenticated
  WITH CHECK (doctor_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "clinical_feedback_update_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_update_own" ON public.clinical_feedback
  FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (doctor_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "clinical_feedback_delete_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_delete_own" ON public.clinical_feedback
  FOR DELETE TO authenticated
  USING (doctor_id = auth.uid() OR public.get_user_role() = 'admin');
