-- Migration: Backfill session_id nos scale_assignments para o guest ed16fdb6-3f77-41a7-bc30-b082460500ab criados em 2026-08-24
-- Regras:
-- 1. Para cada scale_assignments do guest ed16fdb6-3f77-41a7-bc30-b082460500ab com session_id IS NULL
--    criado em 2026-08-24, buscar a sessão anamnesis_sessions correspondente pelo metadata->>'scaleType'
--    que case com scale_assignments.scale_type (normalizando snap-iv -> snapiv, assq -> assq), criada no mesmo dia,
--    e preencher session_id + status = 'completed'.
-- 2. SNAP-IV: metadata->>'scaleType' = 'snap-iv' -> dad6e5d1-1b54-455a-926d-cdc54e2b7088
-- 3. ASSQ: metadata->>'scaleType' = 'assq' -> sessão mais recente (c6111024-3752-437c-a8f5-7d33353e08e0)
-- 4. MoCA, ASRS-18 e MINI 5.0.0: se não houver sessão com metadata scaleType, mantenha NULL.
-- DO $$ ... $$ anônimo, NÃO cria função.

DO $$
BEGIN
  -- Atualização via DO block anônimo
  UPDATE public.scale_assignments sa
  SET 
    session_id = matched.session_id,
    status = 'completed',
    updated_at = NOW()
  FROM (
    SELECT DISTINCT ON (sa_inner.id)
      sa_inner.id AS assignment_id,
      ses.id AS session_id
    FROM public.scale_assignments sa_inner
    JOIN public.anamnesis_sessions ses ON (
      ses.created_at::date = sa_inner.created_at::date
      AND ses.metadata->>'scaleType' IS NOT NULL
      AND (
        (sa_inner.scale_type = 'SNAP-IV' AND ses.metadata->>'scaleType' = 'snap-iv')
        OR (sa_inner.scale_type = 'ASSQ' AND ses.metadata->>'scaleType' = 'assq')
        OR LOWER(REPLACE(REPLACE(sa_inner.scale_type, '-', ''), ' ', '')) = LOWER(REPLACE(REPLACE(ses.metadata->>'scaleType', '-', ''), ' ', ''))
      )
    )
    WHERE sa_inner.guest_id = 'ed16fdb6-3f77-41a7-bc30-b082460500ab'::uuid
      AND sa_inner.created_at::date = '2026-08-24'::date
      AND sa_inner.session_id IS NULL
    ORDER BY sa_inner.id, ses.created_at DESC
  ) matched
  WHERE sa.id = matched.assignment_id;
END $$;
