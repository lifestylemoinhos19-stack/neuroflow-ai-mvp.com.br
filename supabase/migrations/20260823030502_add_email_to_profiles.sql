-- Migration: Add email column to profiles, sync trigger with auth.users and backfill

-- 1. Add email column to profiles (nullable initially, unique)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill existing emails from auth.users
UPDATE public.profiles
SET email = (
  SELECT auth.users.email
  FROM auth.users
  WHERE auth.users.id = profiles.id
)
WHERE profiles.email IS NULL;

-- 3. Ensure unique constraint/index on profiles.email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- 4. Function and triggers to sync auth.users email to profiles.email on INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.sync_user_email_to_profile()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, email, full_name, role, privacy_consent)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      'paciente',
      COALESCE((NEW.raw_user_meta_data->>'privacy_consent')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      UPDATE public.profiles
      SET email = NEW.email
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users for sync
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;

CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email_to_profile();
