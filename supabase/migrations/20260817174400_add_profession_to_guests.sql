-- Add profession column to guests (patient occupation)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS profession text;
