ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.anamnesis_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_session_id
  ON public.email_logs(session_id);
