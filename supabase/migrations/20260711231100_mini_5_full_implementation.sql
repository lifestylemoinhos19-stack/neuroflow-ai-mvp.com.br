-- MINI 5.0.0 Full Implementation - Metadata and Indexing Support
-- Ensures the database is ready for the complete MINI 5.0.0 interview
-- with enhanced metadata fields (interviewer name, start/end times, duration)

-- The metadata JSONB column already exists on anamnesis_sessions
-- This migration ensures a GIN index on metadata is present for efficient querying
CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_metadata_gin
ON public.anamnesis_sessions USING GIN (metadata jsonb_path_ops);

-- Ensure unique constraint on anamnesis_responses for upsert support
-- (previously created in 20260709165000, ensuring idempotency here)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'uq_anamnesis_responses_session_question'
  ) THEN
    CREATE UNIQUE INDEX uq_anamnesis_responses_session_question
    ON public.anamnesis_responses(session_id, question_key);
  END IF;
END $$;

-- Ensure clinical_feedback supports MINI results
-- system_suggestion and global_severity columns already exist in the live schema
-- This migration ensures they are present for environments that may not have them yet
ALTER TABLE public.clinical_feedback ADD COLUMN IF NOT EXISTS system_suggestion TEXT;
ALTER TABLE public.clinical_feedback ADD COLUMN IF NOT EXISTS global_severity TEXT;
