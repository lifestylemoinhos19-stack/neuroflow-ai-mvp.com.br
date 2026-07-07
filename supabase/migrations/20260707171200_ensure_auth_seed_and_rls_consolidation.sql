-- Consolidated migration: auth seed with Skip@Pass2024 + RLS for all 4 tables

-- ============================================================
-- 1. Auth Seed: lifestylemoinhos19@gmail.com with Skip@Pass2024
-- ============================================================
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lifestylemoinhos19@gmail.com',
      crypt('Skip@Pass2024', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "NeuroFlow Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, role, full_name, privacy_consent, privacy_consent_accepted_at)
    VALUES (new_user_id, 'admin', 'NeuroFlow Admin', true, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Skip@Pass2024', gen_salt('bf')),
        updated_at = NOW()
    WHERE email = 'lifestylemoinhos19@gmail.com';

    UPDATE public.profiles
    SET role = 'admin',
        privacy_consent = true,
        privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
    WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');
  END IF;
END $$;

-- ============================================================
-- 2. Ensure tables exist (idempotent)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anamnesis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guest_token TEXT
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

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  crystals_earned INTEGER DEFAULT 0,
  master_crystals INTEGER DEFAULT 0,
  vrc NUMERIC DEFAULT 0,
  capture_method TEXT DEFAULT 'camera_rppg'
);

CREATE TABLE IF NOT EXISTS public.focus_biofeedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  bpm INTEGER,
  vrc NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure guest_token column exists on anamnesis_sessions
ALTER TABLE public.anamnesis_sessions ADD COLUMN IF NOT EXISTS guest_token TEXT;

-- Ensure user_id is nullable on anamnesis_sessions (for guest sessions)
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

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_user_id ON public.anamnesis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_guest_token ON public.anamnesis_sessions(guest_token);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_session_id ON public.anamnesis_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_biofeedback_logs_session_id ON public.focus_biofeedback_logs(session_id);

-- ============================================================
-- 4. Enable RLS on all tables
-- ============================================================
ALTER TABLE public.anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_biofeedback_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS Policies: anamnesis_sessions (authenticated + anon)
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_sessions_insert" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert" ON public.anamnesis_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "anamnesis_sessions_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "anamnesis_sessions_update" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update" ON public.anamnesis_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- Anon (guest) policies
DROP POLICY IF EXISTS "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_insert_anon" ON public.anamnesis_sessions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_sessions_select_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_select_anon" ON public.anamnesis_sessions
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anamnesis_sessions_update_anon" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_update_anon" ON public.anamnesis_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- 6. RLS Policies: anamnesis_responses (authenticated + anon)
-- ============================================================
DROP POLICY IF EXISTS "anamnesis_responses_insert" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert" ON public.anamnesis_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "anamnesis_responses_select" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select" ON public.anamnesis_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "anamnesis_responses_update" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_update" ON public.anamnesis_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_delete" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_delete" ON public.anamnesis_responses
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_sessions s
      WHERE s.id = anamnesis_responses.session_id
      AND (s.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

-- Anon (guest) policies
DROP POLICY IF EXISTS "anamnesis_responses_insert_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_insert_anon" ON public.anamnesis_responses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anamnesis_responses_select_anon" ON public.anamnesis_responses;
CREATE POLICY "anamnesis_responses_select_anon" ON public.anamnesis_responses
  FOR SELECT TO anon USING (true);

-- ============================================================
-- 7. RLS Policies: focus_sessions (authenticated)
-- ============================================================
DROP POLICY IF EXISTS "focus_sessions_insert_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_insert_own" ON public.focus_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "focus_sessions_select_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select_own" ON public.focus_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "focus_sessions_update_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_update_own" ON public.focus_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "focus_sessions_delete_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_delete_own" ON public.focus_sessions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- 8. RLS Policies: focus_biofeedback_logs (authenticated)
-- ============================================================
DROP POLICY IF EXISTS "focus_biofeedback_logs_insert_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_insert_own" ON public.focus_biofeedback_logs
  FOR INSERT TO authenticated WITH CHECK (
    session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "focus_biofeedback_logs_select_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_select_own" ON public.focus_biofeedback_logs
  FOR SELECT TO authenticated USING (
    session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "focus_biofeedback_logs_update_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_update_own" ON public.focus_biofeedback_logs
  FOR UPDATE TO authenticated
  USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "focus_biofeedback_logs_delete_own" ON public.focus_biofeedback_logs;
CREATE POLICY "focus_biofeedback_logs_delete_own" ON public.focus_biofeedback_logs
  FOR DELETE TO authenticated
  USING (session_id IN (SELECT id FROM public.focus_sessions WHERE user_id = auth.uid()));
