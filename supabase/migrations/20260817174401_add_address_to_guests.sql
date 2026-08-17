-- Add address column to guests (patient address)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS address text;
