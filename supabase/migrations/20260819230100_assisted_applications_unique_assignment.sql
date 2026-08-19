-- NeuroFlow — Unique partial index on assisted_applications.assignment_id.
--
-- Permite o upsert idempotente do serviço `saveAssistedApplication`
-- (onConflict: 'assignment_id') sem duplicar registros quando o profissional
-- re-salva a mesma aplicação. Como assignment_id é nullable, usamos um
-- índice UNIQUE parcial: múltiplos NULLs são permitidos (PostgreSQL não
-- considera NULL duplicado), mas quando há assignment_id o re-salvo substitui
-- a linha existente em vez de criar uma nova.
--
-- Idempotente: seguro de re-executar.

CREATE UNIQUE INDEX IF NOT EXISTS uq_assisted_applications_assignment_id
  ON public.assisted_applications (assignment_id)
  WHERE assignment_id IS NOT NULL;
