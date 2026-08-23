-- Migration: Rename columns in profiles and patients
-- 1. profiles.full_name -> profiles.nome
-- 2. patients.birth_date -> patients.data_nascimento
-- 3. patients.gender -> patients.genero

DO $$
BEGIN
  -- 1. Rename profiles.full_name to profiles.nome if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN full_name TO nome;
  END IF;

  -- 2. Rename patients.birth_date to patients.data_nascimento if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'patients' 
      AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.patients RENAME COLUMN birth_date TO data_nascimento;
  END IF;

  -- 3. Rename patients.gender to patients.genero if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'patients' 
      AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.patients RENAME COLUMN gender TO genero;
  END IF;
END $$;

-- Update stored functions that reference profiles.full_name to use profiles.nome

-- 1. sync_user_email_to_profile
CREATE OR REPLACE FUNCTION public.sync_user_email_to_profile()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, email, nome, role, privacy_consent)
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

-- 2. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role, privacy_consent)
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

-- 3. get_session_validation
CREATE OR REPLACE FUNCTION public.get_session_validation(p_session_id uuid)
RETURNS TABLE(
  session_id uuid,
  status text,
  started_at timestamptz,
  completed_at timestamptz,
  patient_initials text,
  clinician_name text,
  clinician_crm text,
  clinician_rqe text,
  assessment_type text,
  clinic_name text
) AS $$
DECLARE
  v_session record;
  v_profile record;
  v_guest record;
  v_clinician jsonb;
  v_patient_name text := '';
  v_initials text := '';
  v_assessment_type text := '';
BEGIN
  SELECT * INTO v_session FROM public.anamnesis_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT value INTO v_clinician FROM public.system_settings WHERE key = 'clinician_credentials';

  -- Assessment type: prefer the most recent scale_assignment for this session,
  -- then fall back to session metadata, then a sensible default.
  SELECT scale_type INTO v_assessment_type
  FROM public.scale_assignments
  WHERE session_id = p_session_id
  ORDER BY assigned_at DESC
  LIMIT 1;

  IF v_assessment_type IS NULL OR v_assessment_type = '' THEN
    IF v_session.metadata IS NOT NULL THEN
      v_assessment_type := COALESCE(
        (v_session.metadata->>'assessment_type')::text,
        (v_session.metadata->>'type')::text,
        ''
      );
    END IF;
  END IF;

  IF v_assessment_type IS NULL OR v_assessment_type = '' THEN
    v_assessment_type := 'Avaliação Neuropsiquiátrica';
  END IF;

  IF v_session.profile_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_session.profile_id;
    IF FOUND AND v_profile.guest_id IS NOT NULL THEN
      SELECT * INTO v_guest FROM public.guests WHERE id = v_profile.guest_id;
      IF FOUND THEN
        v_patient_name := TRIM(COALESCE(v_guest.first_name, '') || ' ' || COALESCE(v_guest.last_name, ''));
      END IF;
    END IF;
    IF v_patient_name = '' AND v_profile.nome IS NOT NULL THEN
      v_patient_name := v_profile.nome;
    END IF;
  END IF;

  IF v_patient_name = '' AND v_session.metadata IS NOT NULL THEN
    v_patient_name := COALESCE((v_session.metadata->>'name')::text, '');
  END IF;

  IF v_patient_name != '' THEN
    v_initials := UPPER(LEFT(SPLIT_PART(v_patient_name, ' ', 1), 1)) || '.';
    IF POSITION(' ' IN v_patient_name) > 0 THEN
      v_initials := v_initials || UPPER(LEFT(SPLIT_PART(v_patient_name, ' ', 2), 1)) || '.';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_session.id,
    v_session.status,
    v_session.started_at,
    v_session.completed_at,
    COALESCE(v_initials, ''),
    COALESCE((v_clinician->>'name')::text, 'Rose Mary Alves'),
    COALESCE((v_clinician->>'crm')::text, 'CRMERS 19625'),
    COALESCE((v_clinician->>'rqe')::text, 'RQE 29582'),
    v_assessment_type,
    'Casa Branca Saúde';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
