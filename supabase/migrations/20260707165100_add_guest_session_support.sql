-- Make user_id nullable to support guest/anonymous sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'anamnesis_sessions'
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.anamnesis_sessions ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- Add guest_token column for tracking anonymous sessions
ALTER TABLE public.anamnesis_sessions ADD COLUMN IF NOT EXISTS guest_token TEXT;

-- Add index for guest_token lookups
CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_guest_token
  ON public.anamnesis_sessions(guest_token);

-- Ensure anon policies allow guest session operations
DROP POLICY IF EXISTS "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_select_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select_anon" ON public.anamnesis_sessions
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anamnesis_sessions_update_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update_anon" ON public.anamnesis_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_insert_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert_anon" ON public.anamnesis_responses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_select_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select_anon" ON public.anamnesis_responses
  FOR SELECT TO anon USING (true);
