ALTER TABLE public.clinical_feedback
  ADD COLUMN IF NOT EXISTS assq_score NUMERIC,
  ADD COLUMN IF NOT EXISTS snap_iv_score NUMERIC,
  ADD COLUMN IF NOT EXISTS asrs18_score NUMERIC,
  ADD COLUMN IF NOT EXISTS moca_score NUMERIC,
  ADD COLUMN IF NOT EXISTS meem_score NUMERIC,
  ADD COLUMN IF NOT EXISTS hamd_score NUMERIC,
  ADD COLUMN IF NOT EXISTS hama_score NUMERIC;

DO $$
DECLARE
  v_user_id uuid;
  v_session_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_session_id FROM public.anamnesis_sessions
  WHERE user_id = v_user_id AND status = 'completed'
  ORDER BY started_at DESC LIMIT 1;

  IF v_session_id IS NULL THEN
    v_session_id := gen_random_uuid();
    INSERT INTO public.anamnesis_sessions (id, user_id, status, started_at, completed_at)
    VALUES (v_session_id, v_user_id, 'completed', NOW() - INTERVAL '1 day', NOW());
  END IF;

  INSERT INTO public.anamnesis_responses (session_id, question_key, question_label, response_value)
  SELECT v_session_id, 'assq_' || g.i, 'ASSQ Q' || g.i, (CASE WHEN g.i <= 15 THEN '2' ELSE '1' END)::jsonb
  FROM generate_series(1, 27) AS g(i)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.anamnesis_responses WHERE session_id = v_session_id AND question_key = 'assq_' || g.i
  );

  INSERT INTO public.anamnesis_responses (session_id, question_key, question_label, response_value)
  SELECT v_session_id, 'snap_' || g.i, 'SNAP-IV Q' || g.i, (CASE WHEN g.i <= 10 THEN '2' ELSE '1' END)::jsonb
  FROM generate_series(1, 18) AS g(i)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.anamnesis_responses WHERE session_id = v_session_id AND question_key = 'snap_' || g.i
  );

  INSERT INTO public.anamnesis_responses (session_id, question_key, question_label, response_value)
  SELECT v_session_id, 'asrs_' || g.i, 'ASRS-18 Q' || g.i, '3'::jsonb
  FROM generate_series(1, 18) AS g(i)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.anamnesis_responses WHERE session_id = v_session_id AND question_key = 'asrs_' || g.i
  );

  INSERT INTO public.anamnesis_responses (session_id, question_key, question_label, response_value)
  SELECT v_session_id, t.k, t.label, t.val
  FROM (VALUES
    ('moca_total', 'MoCA Total', '22'::jsonb),
    ('meem_total', 'MEEM Total', '22'::jsonb),
    ('hamd_total', 'HAM-D Total', '12'::jsonb),
    ('hama_total', 'HAM-A Total', '10'::jsonb)
  ) AS t(k, label, val)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.anamnesis_responses WHERE session_id = v_session_id AND question_key = t.k
  );
END $$;
