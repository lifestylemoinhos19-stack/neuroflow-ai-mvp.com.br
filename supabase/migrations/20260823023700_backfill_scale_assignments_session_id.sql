-- Backfill session_id nos scale_assignments órfãos
-- Para cada scale_assignments sem session_id, busca a sessão mais recente
-- que tenha question_key compatível com o scale_type

UPDATE public.scale_assignments sa
SET 
  session_id = sub.session_id,
  status = CASE WHEN sub.session_id IS NOT NULL THEN 'completed' ELSE sa.status END,
  completed_at = CASE WHEN sub.session_id IS NOT NULL THEN sub.max_created_at ELSE sa.completed_at END
FROM (
  SELECT DISTINCT ON (sa2.id)
    sa2.id as assignment_id,
    ar.session_id,
    MAX(ar.created_at) as max_created_at
  FROM public.scale_assignments sa2
  JOIN public.anamnesis_responses ar ON 
    ar.question_key ILIKE (
      CASE 
        WHEN sa2.scale_type = 'GAD-7' THEN 'gad7%'
        WHEN sa2.scale_type = 'PHQ-9' THEN 'phq9%'
        WHEN sa2.scale_type = 'ASRS-18' THEN 'asrs%'
        WHEN sa2.scale_type = 'SNAP-IV' THEN 'snap%'
        WHEN sa2.scale_type = 'Y-BOCS' THEN 'ybocs%'
        WHEN sa2.scale_type = 'HAM-A' THEN 'hama%'
        WHEN sa2.scale_type = 'HAM-D' THEN 'hamd%'
        WHEN sa2.scale_type = 'MINI 5.0.0' THEN 'mini%'
        WHEN sa2.scale_type = 'MEEM' THEN 'meem%'
        WHEN sa2.scale_type = 'SDS' THEN 'sds%'
        WHEN sa2.scale_type = 'MARCOS' THEN 'marcos%'
        WHEN sa2.scale_type = 'ASSQ' THEN 'assq%'
        ELSE LOWER(REPLACE(REPLACE(sa2.scale_type, '-', ''), ' ', '')) || '%'
      END
    )
  WHERE sa2.session_id IS NULL
  GROUP BY sa2.id, ar.session_id
  ORDER BY sa2.id, MAX(ar.created_at) DESC
) sub
WHERE sa.id = sub.assignment_id
AND sa.session_id IS NULL;
