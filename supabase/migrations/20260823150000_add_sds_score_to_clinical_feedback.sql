ALTER TABLE public.clinical_feedback
  ADD COLUMN IF NOT EXISTS sds_score NUMERIC;
