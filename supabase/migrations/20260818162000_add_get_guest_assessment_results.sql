-- Expõe para o paciente público (anon) as respostas e pontuações das suas
-- avaliações concluídas, sem exigir login. Usado pela tela "Ver respostas"
-- em /minhas-escalas.
--
-- O paciente identifica-se apenas pelo guest_id (recebido via CPF em
-- /minhas-escalas). A função:
--   1. lista as scale_assignments do guest;
--   2. para cada assignment com session_id, busca a sessão de anamnese
--      correspondente e suas respostas (descriptografadas);
--   3. também considera sessões órfãs (sem scale_assignment) vinculadas
--      ao guest via metadata->>'guest_id', para os componentes que criam
--      a sessão sem passar por um assignment;
--   4. retorna um resumo por avaliação: id, scale_type, status, datas,
--      pontuação total (do metadata ou clinical_feedback) e a lista de
--      respostas.
--
-- SECURITY DEFINER + callable por anon: as respostas em anamnesis_responses
-- estão criptografadas e a tabela só é legível por RLS quando há guest_token.
-- Este RPC descriptografa via decrypt_pii e filtra estritamente pelo
-- p_guest_id recebido, então não vaza dados de outros pacientes.

CREATE OR REPLACE FUNCTION public.get_guest_assessment_results(p_guest_id uuid)
RETURNS TABLE(
  assignment_id uuid,
  scale_type text,
  status text,
  assigned_at timestamptz,
  completed_at timestamptz,
  session_id uuid,
  total_score numeric,
  severity text,
  responses jsonb
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_role text := public.get_user_role();
BEGIN
  IF p_guest_id IS NULL THEN
    RETURN;
  END IF;

  -- 1) Assignments com session_id vinculado.
  RETURN QUERY
  SELECT
    sa.id,
    sa.scale_type,
    sa.status,
    sa.assigned_at,
    sa.completed_at,
    s.id,
    COALESCE(
      NULLIF(s.metadata->>'totalScore', ''),
      NULLIF(s.metadata->>'total_score', '')
    )::numeric,
    s.metadata->>'severity',
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'question_key', r.question_key,
          'question_label', r.question_label,
          'response_value',
            CASE
              WHEN public.is_encrypted(r.response_value#>>'{}')
                THEN public.decrypt_pii(r.response_value#>>'{}')
              ELSE r.response_value#>>'{}'
            END
        )
        ORDER BY r.created_at
      )
      FROM public.anamnesis_responses r
      WHERE r.session_id = s.id),
      '[]'::jsonb
    )
  FROM public.scale_assignments sa
  LEFT JOIN public.anamnesis_sessions s ON s.id = sa.session_id
  WHERE sa.guest_id = p_guest_id
  ORDER BY sa.assigned_at DESC;

  -- 2) Sessões órfãs (sem scale_assignment) vinculadas ao guest via metadata.
  --    Evita duplicar sessões já retornadas acima (com session_id em sa).
  RETURN QUERY
  SELECT
    NULL::uuid,
    COALESCE(s.metadata->>'scaleType', s.metadata->>'scale_type', 'anamnese'),
    'completed',
    s.started_at,
    s.completed_at,
    s.id,
    COALESCE(
      NULLIF(s.metadata->>'totalScore', ''),
      NULLIF(s.metadata->>'total_score', '')
    )::numeric,
    s.metadata->>'severity',
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'question_key', r.question_key,
          'question_label', r.question_label,
          'response_value',
            CASE
              WHEN public.is_encrypted(r.response_value#>>'{}')
                THEN public.decrypt_pii(r.response_value#>>'{}')
              ELSE r.response_value#>>'{}'
            END
        )
        ORDER BY r.created_at
      )
      FROM public.anamnesis_responses r
      WHERE r.session_id = s.id),
      '[]'::jsonb
    )
  FROM public.anamnesis_sessions s
  WHERE s.metadata->>'guest_id' = p_guest_id::text
    AND s.id NOT IN (
      SELECT sa2.session_id FROM public.scale_assignments sa2
      WHERE sa2.session_id IS NOT NULL AND sa2.guest_id = p_guest_id
    )
  ORDER BY s.started_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_assessment_results(uuid) TO anon, authenticated;
