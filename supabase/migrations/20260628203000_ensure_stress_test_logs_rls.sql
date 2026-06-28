-- Ensure RLS policies on stress_test_logs allow authenticated admin users to insert and select
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE POLICY

-- Select policy for authenticated users
DROP POLICY IF EXISTS "stress_test_logs_select" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_select" ON public.stress_test_logs
  FOR SELECT TO authenticated USING (true);

-- Insert policy for authenticated users
DROP POLICY IF EXISTS "stress_test_logs_insert" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_insert" ON public.stress_test_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update policy for authenticated users
DROP POLICY IF EXISTS "stress_test_logs_update" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_update" ON public.stress_test_logs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Delete policy for admin only
DROP POLICY IF EXISTS "stress_test_logs_delete" ON public.stress_test_logs;
CREATE POLICY "stress_test_logs_delete" ON public.stress_test_logs
  FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

-- Ensure indexes exist for querying new scenario results
CREATE INDEX IF NOT EXISTS idx_stress_test_logs_created_at ON public.stress_test_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stress_test_logs_is_success ON public.stress_test_logs(is_success);
