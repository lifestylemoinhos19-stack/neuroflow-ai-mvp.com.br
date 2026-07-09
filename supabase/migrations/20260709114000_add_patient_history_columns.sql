ALTER TABLE public.clinical_feedback
  ADD COLUMN IF NOT EXISTS snap_iv_inattention NUMERIC,
  ADD COLUMN IF NOT EXISTS snap_iv_hyperactivity NUMERIC,
  ADD COLUMN IF NOT EXISTS global_severity TEXT;

UPDATE public.clinical_feedback
SET global_severity = CASE
  WHEN phq9_score >= 15 OR gad7_score >= 15 OR snap_iv_score > 2.0 THEN 'high'
  WHEN phq9_score >= 10 OR gad7_score >= 10 OR snap_iv_score >= 1.5 THEN 'moderate'
  ELSE 'low'
END
WHERE global_severity IS NULL;

UPDATE public.clinical_feedback
SET
  snap_iv_inattention = snap_iv_score,
  snap_iv_hyperactivity = snap_iv_score
WHERE snap_iv_inattention IS NULL AND snap_iv_score IS NOT NULL;

DROP POLICY IF EXISTS "clinical_feedback_admin_select" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_admin_select" ON public.clinical_feedback
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');
