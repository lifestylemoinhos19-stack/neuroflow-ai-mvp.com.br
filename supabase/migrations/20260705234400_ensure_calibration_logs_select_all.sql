-- Ensure authenticated users can SELECT all calibration_logs for monitoring dashboard
DROP POLICY IF EXISTS "calibration_logs_select_all_authenticated" ON public.calibration_logs;
CREATE POLICY "calibration_logs_select_all_authenticated" ON public.calibration_logs
  FOR SELECT TO authenticated USING (true);
