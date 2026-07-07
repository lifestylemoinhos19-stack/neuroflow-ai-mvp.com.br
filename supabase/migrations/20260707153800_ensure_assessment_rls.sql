-- Ensure RLS policies for anamnesis_sessions and anamnesis_responses
-- Allows authenticated users to insert and select their own records

-- anamnesis_sessions: SELECT (own or admin)
DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- anamnesis_sessions: INSERT (own or admin)
DROP POLICY IF EXISTS "anamnesis_sessions_insert" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert" ON public.anamnesis_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- anamnesis_sessions: UPDATE (own or admin)
DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- anamnesis_responses: SELECT (own session or admin)
DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- anamnesis_responses: INSERT (own session or admin)
DROP POLICY IF EXISTS "anamnesis_responses_insert" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert" ON public.anamnesis_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- anamnesis_responses: UPDATE (own session or admin)
DROP POLICY IF EXISTS "anamnesis_responses_update" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update" ON public.anamnesis_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  ) WITH CHECK (true);

-- anamnesis_responses: DELETE (own session or admin)
DROP POLICY IF EXISTS "anamnesis_responses_delete" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_delete" ON public.anamnesis_responses
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );
