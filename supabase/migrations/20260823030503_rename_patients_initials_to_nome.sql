-- Migration: Rename patients.initials to patients.nome
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patients'
      AND column_name = 'initials'
  ) THEN
    ALTER TABLE public.patients RENAME COLUMN initials TO nome;
  END IF;
END $$;
