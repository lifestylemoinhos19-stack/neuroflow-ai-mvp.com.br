ALTER TABLE public.clinical_feedback
  ADD COLUMN IF NOT EXISTS system_suggestion TEXT,
  ADD COLUMN IF NOT EXISTS phq9_score INTEGER,
  ADD COLUMN IF NOT EXISTS gad7_score INTEGER,
  ADD COLUMN IF NOT EXISTS cognitive_vrc DOUBLE PRECISION;

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');

DO $$
DECLARE
  v_user_id uuid;
  v_session_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com';
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.anamnesis_sessions
    WHERE user_id = v_user_id AND status = 'completed'
    LIMIT 1
  ) THEN
    v_session_id := gen_random_uuid();
    INSERT INTO public.anamnesis_sessions (id, user_id, status, started_at, completed_at)
    VALUES (v_session_id, v_user_id, 'completed', NOW() - INTERVAL '1 day', NOW());

    INSERT INTO public.anamnesis_responses (session_id, question_key, question_label, response_value) VALUES
      (v_session_id, 'phq9_q1', 'PHQ-9 Q1', '3'::jsonb),
      (v_session_id, 'phq9_q2', 'PHQ-9 Q2', '3'::jsonb),
      (v_session_id, 'phq9_q3', 'PHQ-9 Q3', '2'::jsonb),
      (v_session_id, 'phq9_q4', 'PHQ-9 Q4', '3'::jsonb),
      (v_session_id, 'phq9_q5', 'PHQ-9 Q5', '2'::jsonb),
      (v_session_id, 'phq9_q6', 'PHQ-9 Q6', '2'::jsonb),
      (v_session_id, 'phq9_q7', 'PHQ-9 Q7', '2'::jsonb),
      (v_session_id, 'phq9_q8', 'PHQ-9 Q8', '0'::jsonb),
      (v_session_id, 'phq9_q9', 'PHQ-9 Q9', '0'::jsonb),
      (v_session_id, 'gad7_q1', 'GAD-7 Q1', '2'::jsonb),
      (v_session_id, 'gad7_q2', 'GAD-7 Q2', '2'::jsonb),
      (v_session_id, 'gad7_q3', 'GAD-7 Q3', '2'::jsonb),
      (v_session_id, 'gad7_q4', 'GAD-7 Q4', '2'::jsonb),
      (v_session_id, 'gad7_q5', 'GAD-7 Q5', '1'::jsonb),
      (v_session_id, 'gad7_q6', 'GAD-7 Q6', '1'::jsonb),
      (v_session_id, 'gad7_q7', 'GAD-7 Q7', '1'::jsonb);
  END IF;
END $$;
