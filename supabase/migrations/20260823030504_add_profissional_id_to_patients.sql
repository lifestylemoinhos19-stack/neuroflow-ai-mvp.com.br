-- Migration: Add profissional_id FK to profiles on patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patients_profissional_id ON public.patients(profissional_id);
