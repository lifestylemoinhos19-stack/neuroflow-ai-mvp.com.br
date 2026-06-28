CREATE TABLE IF NOT EXISTS public.anamnesis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anamnesis_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.anamnesis_sessions(id) ON DELETE CASCADE NOT NULL,
  question_key TEXT NOT NULL,
  question_label TEXT,
  response_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_user_id ON public.anamnesis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_session_id ON public.anamnesis_responses(session_id);

ALTER TABLE public.anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anamnesis_sessions_insert" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert" ON public.anamnesis_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_select_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select_anon" ON public.anamnesis_sessions
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anamnesis_sessions_update_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update_anon" ON public.anamnesis_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_insert" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert" ON public.anamnesis_responses
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anamnesis_responses_update" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update" ON public.anamnesis_responses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_delete" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_delete" ON public.anamnesis_responses
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "anamnesis_responses_insert_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert_anon" ON public.anamnesis_responses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_select_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select_anon" ON public.anamnesis_responses
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anamnesis_responses_update_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update_anon" ON public.anamnesis_responses
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_delete_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_delete_anon" ON public.anamnesis_responses
  FOR DELETE TO anon USING (true);
