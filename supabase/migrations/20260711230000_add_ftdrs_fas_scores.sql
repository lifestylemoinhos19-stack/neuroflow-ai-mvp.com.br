ALTER TABLE public.clinical_feedback ADD COLUMN IF NOT EXISTS ftdrs_score numeric;
ALTER TABLE public.clinical_feedback ADD COLUMN IF NOT EXISTS fas_score numeric;
