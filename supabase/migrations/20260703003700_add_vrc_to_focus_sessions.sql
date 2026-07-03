ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS vrc NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.focus_sessions.vrc IS 'Heart Rate Variability (RMSSD approximation) calculated via calculate-vrc edge function';
