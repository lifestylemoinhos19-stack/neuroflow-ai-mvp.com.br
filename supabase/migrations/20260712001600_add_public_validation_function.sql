-- Create a SECURITY DEFINER function for public document validation
-- This allows anon users to verify document authenticity without exposing full table data
-- Only returns masked patient info and clinician credentials

CREATE OR REPLACE FUNCTION public.get_session_validation(p_session_id uuid)
RETURNS TABLE(
  session_id uuid,
  status text,
  started_at timestamptz,
  completed_at timestamptz,
  patient_initials text,
  clinician_name text,
  clinician_crm text,
  clinician_rqe text
) AS $$
DECLARE
  v_session record;
  v_profile record;
  v_guest record;
  v_clinician jsonb;
  v_patient_name text := '';
  v_initials text := '';
BEGIN
  SELECT * INTO v_session FROM public.anamnesis_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT value INTO v_clinician FROM public.system_settings WHERE key = 'clinician_credentials';

  IF v_session.profile_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_session.profile_id;
    IF FOUND AND v_profile.guest_id IS NOT NULL THEN
      SELECT * INTO v_guest FROM public.guests WHERE id = v_profile.guest_id;
      IF FOUND THEN
        v_patient_name := TRIM(COALESCE(v_guest.first_name, '') || ' ' || COALESCE(v_guest.last_name, ''));
      END IF;
    END IF;
    IF v_patient_name = '' AND v_profile.full_name IS NOT NULL THEN
      v_patient_name := v_profile.full_name;
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
    COALESCE((v_clinician->>'rqe')::text, 'RQE 29582');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.get_session_validation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_session_validation(uuid) TO anon, authenticated;
