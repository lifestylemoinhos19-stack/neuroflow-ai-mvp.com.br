DO $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_guest_id uuid;
  v_session_1 uuid;
  v_session_2 uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE id = v_user_id;

  SELECT id INTO v_guest_id FROM public.guests WHERE email = 'paciente.teste@neuroflow.com';
  IF v_guest_id IS NULL THEN
    v_guest_id := gen_random_uuid();
    INSERT INTO public.guests (id, first_name, last_name, email, created_at, updated_at)
    VALUES (v_guest_id, 'Paciente', 'Teste', 'paciente.teste@neuroflow.com', NOW(), NOW());
  END IF;

  IF v_profile_id IS NOT NULL THEN
    UPDATE public.profiles SET guest_id = v_guest_id
    WHERE id = v_profile_id AND guest_id IS NULL;
  END IF;

  SELECT id INTO v_session_1 FROM public.anamnesis_sessions
  WHERE user_id = v_user_id AND started_at = '2026-01-15T10:00:00+00:00';
  IF v_session_1 IS NULL THEN
    v_session_1 := gen_random_uuid();
    INSERT INTO public.anamnesis_sessions (id, user_id, profile_id, status, started_at, completed_at)
    VALUES (v_session_1, v_user_id, v_profile_id, 'completed',
      '2026-01-15T10:00:00+00:00', '2026-01-15T10:30:00+00:00');
  END IF;

  INSERT INTO public.clinical_feedback (
    session_id, doctor_id, is_accurate, comments,
    phq9_score, gad7_score, snap_iv_score, snap_iv_inattention, snap_iv_hyperactivity,
    moca_score, assq_score, asrs18_score, meem_score, hamd_score, hama_score,
    system_suggestion, admin_edited_interpretation, global_severity, cognitive_vrc
  ) VALUES (
    v_session_1, v_user_id, true, 'Avaliação inicial - sintomas significativos',
    15, 14, 2.1, 2.3, 1.9, 22, 20, 42, 22, 16, 14,
    'Sinais sugestivos de Transtorno de Humor (depressão moderadamente severa) e Ansiedade moderada. Sinais sugestivos de TDAH. Recomenda-se acompanhamento especializado e iniciar intervenção terapêutica.',
    'Avaliação inicial: PHQ-9=15 (moderadamente severa), GAD-7=14 (moderada), SNAP-IV=2.1 (elevado), MoCA=22. Quadro clínico com múltiplos sinais.',
    'high', 0.42
  ) ON CONFLICT (session_id) DO NOTHING;

  SELECT id INTO v_session_2 FROM public.anamnesis_sessions
  WHERE user_id = v_user_id AND started_at = '2026-03-15T10:00:00+00:00';
  IF v_session_2 IS NULL THEN
    v_session_2 := gen_random_uuid();
    INSERT INTO public.anamnesis_sessions (id, user_id, profile_id, status, started_at, completed_at)
    VALUES (v_session_2, v_user_id, v_profile_id, 'completed',
      '2026-03-15T10:00:00+00:00', '2026-03-15T10:30:00+00:00');
  END IF;

  INSERT INTO public.clinical_feedback (
    session_id, doctor_id, is_accurate, comments,
    phq9_score, gad7_score, snap_iv_score, snap_iv_inattention, snap_iv_hyperactivity,
    moca_score, assq_score, asrs18_score, meem_score, hamd_score, hama_score,
    system_suggestion, admin_edited_interpretation, global_severity, cognitive_vrc
  ) VALUES (
    v_session_2, v_user_id, true, 'Reavaliação - melhora significativa após intervenção',
    8, 7, 1.4, 1.6, 1.2, 26, 15, 32, 25, 8, 8,
    'Melhora significativa nos sintomas depressivos e ansiosos. TDAH em monitoramento com redução de sintomas. Cognição estável com leve melhora. Manter plano terapêutico atual e reavaliar em 3 meses.',
    'Reavaliação: PHQ-9=8 (leve, 47% melhora), GAD-7=7 (leve, 50% melhora), SNAP-IV=1.4 (moderado, 33% melhora), MoCA=26 (melhora). Resposta positiva à intervenção.',
    'moderate', 0.55
  ) ON CONFLICT (session_id) DO NOTHING;
END $$;
