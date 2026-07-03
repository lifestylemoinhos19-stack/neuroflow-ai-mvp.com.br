-- Add UPDATE and DELETE RLS policies for focus_biofeedback_logs
-- Ensures authenticated users can only modify their own logs

DROP POLICY IF EXISTS "focus_biofeedback_logs_update_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_update_own" ON public.focus_biofeedback_logs
  FOR UPDATE TO authenticated
  USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "focus_biofeedback_logs_delete_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_delete_own" ON public.focus_biofeedback_logs
  FOR DELETE TO authenticated
  USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));
