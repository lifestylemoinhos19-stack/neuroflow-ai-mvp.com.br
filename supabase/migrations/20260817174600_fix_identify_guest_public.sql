-- Fix identify_guest_public: qualify the RETURNING column to avoid the
-- "column reference id is ambiguous" PL/pgSQL error (id could resolve to the
-- table column or the output column). Also make the INSERT branch fully safe.
DROP FUNCTION IF EXISTS public.identify_guest_public(text,text,date,text,text,text,text);
CREATE OR REPLACE FUNCTION public.identify_guest_public(
  p_first_name text,
  p_last_name text,
  p_birth_date date,
  p_document text,
  p_profession text,
  p_address text,
  p_responsible_name text
) RETURNS TABLE(
  out_id uuid,
  out_first_name text,
  out_last_name text,
  out_birth_date date,
  out_document text,
  out_profession text,
  out_address text,
  out_responsible_name text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT g.id INTO v_id
  FROM public.guests g
  WHERE g.document IS NOT NULL
    AND public.decrypt_pii(g.document) = p_document
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.guests SET
      first_name = COALESCE(NULLIF(p_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(p_last_name, ''), last_name),
      birth_date = COALESCE(p_birth_date, birth_date),
      profession = COALESCE(NULLIF(p_profession, ''), profession),
      address = COALESCE(NULLIF(p_address, ''), address),
      responsible_name = COALESCE(NULLIF(p_responsible_name, ''), responsible_name),
      updated_at = now()
    WHERE public.guests.id = v_id;
  ELSE
    INSERT INTO public.guests (first_name, last_name, birth_date, document, profession, address, responsible_name)
    VALUES (p_first_name, p_last_name, p_birth_date, p_document, p_profession, p_address, p_responsible_name)
    RETURNING public.guests.id INTO v_id;
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    public.decrypt_pii(g.first_name),
    public.decrypt_pii(g.last_name),
    g.birth_date,
    public.decrypt_pii(g.document),
    g.profession,
    g.address,
    g.responsible_name
  FROM public.guests g
  WHERE g.id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.identify_guest_public(text,text,date,text,text,text,text) TO anon, authenticated;
