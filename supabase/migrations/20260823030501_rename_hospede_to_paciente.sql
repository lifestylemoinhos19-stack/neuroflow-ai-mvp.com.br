-- Migration: Rename 'hospede' role to 'paciente' in profiles

-- 1. Drop old check constraint first so updates to 'paciente' succeed
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Update existing data from 'hospede' to 'paciente'
UPDATE public.profiles SET role = 'paciente' WHERE role = 'hospede';

-- 3. Update default value on profiles.role
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'paciente'::text;

-- 4. Add new check constraint on profiles.role accepting 'paciente'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['admin'::text, 'doctor'::text, 'staff'::text, 'gerente'::text, 'recepcionista'::text, 'camareira'::text, 'spa_staff'::text, 'paciente'::text, 'cliente_externo'::text]));

-- 5. Update handle_new_user function to use 'paciente' as default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, privacy_consent)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'paciente',
    COALESCE((NEW.raw_user_meta_data->>'privacy_consent')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE WHEN profiles.role = 'hospede' THEN 'paciente' ELSE profiles.role END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
