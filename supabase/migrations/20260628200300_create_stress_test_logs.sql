CREATE TABLE IF NOT EXISTS public.stress_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name TEXT,
  input_text TEXT,
  expected_risk_level TEXT,
  expected_suggestion TEXT,
  actual_output JSONB,
  is_success BOOLEAN,
  rag_sources JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stress_test_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stress_test_logs_select" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_select" ON public.stress_test_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "stress_test_logs_insert" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_insert" ON public.stress_test_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "stress_test_logs_update" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_update" ON public.stress_test_logs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stress_test_logs_delete" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_delete" ON public.stress_test_logs
  FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_stress_test_logs_created_at ON public.stress_test_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stress_test_logs_is_success ON public.stress_test_logs(is_success);
