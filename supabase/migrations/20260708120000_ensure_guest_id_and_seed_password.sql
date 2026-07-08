-- Ensure profiles table has guest_id column for linking legacy guest data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL;

-- Update seed user password to Skip@Pass per acceptance criteria
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure admin role and consent for seed user
UPDATE public.profiles
SET role = 'admin',
    privacy_consent = true,
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');

-- Ensure anon RLS policies allow guest sessions with guest_token
DROP POLICY IF EXISTS "anamnesis_sessions_select_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select_anon" ON public.anamnesis_sessions
  FOR SELECT TO anon USING (guest_token IS NOT NULL);

DROP POLICY IF EXISTS "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_update_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update_anon" ON public.anamnesis_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_insert_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert_anon" ON public.anamnesis_responses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_select_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select_anon" ON public.anamnesis_responses
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND s.guest_token IS NOT NULL
    )
  );
