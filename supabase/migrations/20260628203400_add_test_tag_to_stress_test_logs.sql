ALTER TABLE public.stress_test_logs ADD COLUMN IF NOT EXISTS test_tag TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_stress_test_logs_test_tag ON public.stress_test_logs(test_tag);
