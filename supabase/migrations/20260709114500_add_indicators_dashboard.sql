-- RLS policies: allow doctors to read all clinical data
DROP POLICY IF EXISTS "clinical_feedback_doctor_select" ON public.clinical_feedback;
CREATE POLICY "clinical_feedback_doctor_select" ON public.clinical_feedback
  FOR SELECT TO authenticated USING (public.get_user_role() = 'doctor');

DROP POLICY IF EXISTS "anamnesis_sessions_doctor_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_doctor_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (public.get_user_role() = 'doctor');

DROP POLICY IF EXISTS "guests_doctor_select" ON public.guests;
CREATE POLICY "guests_doctor_select" ON public.guests
  FOR SELECT TO authenticated USING (public.get_user_role() = 'doctor');

-- Helper function for clinical prevalence aggregation
CREATE OR REPLACE FUNCTION public.get_clinical_prevalence_stats()
RETURNS TABLE (
  condition_name TEXT,
  patient_count BIGINT,
  total_evaluated BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_total BIGINT;
BEGIN
  v_role := public.get_user_role();
  IF v_role NOT IN ('admin', 'doctor') THEN
    RAISE EXCEPTION 'Access denied: admin or doctor role required';
  END IF;

  SELECT COUNT(DISTINCT s.user_id) INTO v_total
  FROM public.clinical_feedback cf
  JOIN public.anamnesis_sessions s ON cf.session_id = s.id
  WHERE s.user_id IS NOT NULL;

  RETURN QUERY
  SELECT 'tdah'::TEXT, COUNT(DISTINCT s.user_id), v_total
  FROM public.clinical_feedback cf
  JOIN public.anamnesis_sessions s ON cf.session_id = s.id
  WHERE s.user_id IS NOT NULL AND (cf.snap_iv_score >= 1.5 OR cf.asrs18_score >= 4);

  RETURN QUERY
  SELECT 'tea'::TEXT, COUNT(DISTINCT s.user_id), v_total
  FROM public.clinical_feedback cf
  JOIN public.anamnesis_sessions s ON cf.session_id = s.id
  WHERE s.user_id IS NOT NULL AND cf.assq_score >= 15;

  RETURN QUERY
  SELECT 'depression'::TEXT, COUNT(DISTINCT s.user_id), v_total
  FROM public.clinical_feedback cf
  JOIN public.anamnesis_sessions s ON cf.session_id = s.id
  WHERE s.user_id IS NOT NULL AND (cf.phq9_score >= 10 OR cf.hamd_score >= 8);

  RETURN QUERY
  SELECT 'anxiety'::TEXT, COUNT(DISTINCT s.user_id), v_total
  FROM public.clinical_feedback cf
  JOIN public.anamnesis_sessions s ON cf.session_id = s.id
  WHERE s.user_id IS NOT NULL AND (cf.gad7_score >= 8 OR cf.hama_score >= 8);
END;
$$;
