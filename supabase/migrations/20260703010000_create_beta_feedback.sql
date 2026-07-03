CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  parent_comments TEXT,
  child_experience TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beta_feedback_select_own" ON public.beta_feedback;
CREATE POLICY "beta_feedback_select_own" ON public.beta_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "beta_feedback_insert_own" ON public.beta_feedback;
CREATE POLICY "beta_feedback_insert_own" ON public.beta_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "beta_feedback_update_own" ON public.beta_feedback;
CREATE POLICY "beta_feedback_update_own" ON public.beta_feedback
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "beta_feedback_delete_own" ON public.beta_feedback;
CREATE POLICY "beta_feedback_delete_own" ON public.beta_feedback
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON public.beta_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_session_id ON public.beta_feedback(session_id);
