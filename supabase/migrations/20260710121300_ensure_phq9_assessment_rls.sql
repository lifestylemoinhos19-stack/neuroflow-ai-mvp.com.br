-- Ensure RLS policies allow authenticated users to insert PHQ-9 assessment data
-- into anamnesis_sessions and anamnesis_responses tables

-- anamnesis_sessions: ensure INSERT policy for authenticated users
DROP POLICY IF EXISTS "anamnesis_sessions_insert" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert" ON public.anamnesis_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- anamnesis_sessions: ensure SELECT policy for authenticated users
DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- anamnesis_sessions: ensure UPDATE policy for authenticated users
DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- anamnesis_responses: ensure INSERT policy (own session or admin)
DROP POLICY IF EXISTS "anamnesis_responses_insert" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert" ON public.anamnesis_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- anamnesis_responses: ensure SELECT policy (own session or admin)
DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );
