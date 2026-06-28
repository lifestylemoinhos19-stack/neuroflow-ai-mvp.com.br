CREATE TABLE IF NOT EXISTS public.clinical_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.anamnesis_sessions(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_accurate BOOLEAN,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_feedback_session_id ON public.clinical_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_clinical_feedback_doctor_id ON public.clinical_feedback(doctor_id);

ALTER TABLE public.clinical_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_feedback_select_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_select_own" ON public.clinical_feedback
  FOR SELECT TO authenticated USING (doctor_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "clinical_feedback_insert_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_insert_own" ON public.clinical_feedback
  FOR INSERT TO authenticated WITH CHECK (doctor_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "clinical_feedback_update_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_update_own" ON public.clinical_feedback
  FOR UPDATE TO authenticated USING (doctor_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (doctor_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "clinical_feedback_delete_own" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_delete_own" ON public.clinical_feedback
  FOR DELETE TO authenticated USING (doctor_id = auth.uid() OR public.get_user_role() = 'admin');
