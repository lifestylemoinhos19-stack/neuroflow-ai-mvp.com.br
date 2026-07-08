-- Ensure admin_edited_interpretation column exists (idempotent)
ALTER TABLE public.clinical_feedback ADD COLUMN IF NOT EXISTS admin_edited_interpretation text;

-- Ensure admin user has admin role (idempotent)
UPDATE public.profiles
SET role = 'admin',
    privacy_consent = COALESCE(privacy_consent, true),
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');

-- RLS: Admin full access to anamnesis_sessions
DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_delete" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_delete" ON public.anamnesis_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- RLS: Admin full access to anamnesis_responses
DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anamnesis_responses_update" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update" ON public.anamnesis_responses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_delete" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_delete" ON public.anamnesis_responses
  FOR DELETE TO authenticated USING (true);

-- RLS: Admin full access to clinical_feedback
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
