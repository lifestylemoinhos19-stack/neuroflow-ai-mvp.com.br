-- Add 'validated' as an accepted status for anamnesis_sessions
-- The status column is already TEXT with no CHECK constraint, so 'validated' is already valid.
-- This migration adds an explicit CHECK constraint (idempotently) including the new status.

DO $$
BEGIN
  -- Check if a check constraint on status already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'anamnesis_sessions_status_check'
  ) THEN
    ALTER TABLE public.anamnesis_sessions
      ADD CONSTRAINT anamnesis_sessions_status_check
      CHECK (status IN ('in_progress', 'completed', 'validated', 'archived'));
  END IF;
END $$;

-- Add index for validated sessions for faster querying
CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_status_validated
  ON public.anamnesis_sessions(status)
  WHERE status = 'validated';

-- Add RLS policy for validated sessions (idempotent)
DROP POLICY IF EXISTS "anamnesis_sessions_validated_select" ON public.anamnesis_sessions;
CREATE POLICY "anamnesis_sessions_validated_select" ON public.anamnesis_sessions
  FOR SELECT TO authenticated USING (true);
