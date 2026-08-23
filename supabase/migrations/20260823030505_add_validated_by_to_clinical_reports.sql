-- Migration: Add validated_by FK to profiles on clinical_reports table
ALTER TABLE public.clinical_reports
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_reports_validated_by ON public.clinical_reports(validated_by);
