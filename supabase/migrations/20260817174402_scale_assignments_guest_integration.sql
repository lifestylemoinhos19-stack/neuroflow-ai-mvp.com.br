-- Integration between /atribuir-escalas and /minhas-escalas (public patient flow).
--
-- The public patient flow identifies itself by CPF (guests.document) without
-- logging in. scale_assignments originally only referenced profiles.id (an auth
-- user), which made it impossible to assign scales to a guest who never logged in.
-- We add a nullable guest_id column so staff can assign scales directly to a
-- guest, and the public page can filter assignments by guest_id.

ALTER TABLE public.scale_assignments ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL;

-- patient_id is no longer mandatory: a guest without an auth profile can receive
-- assignments identified only by guest_id.
ALTER TABLE public.scale_assignments ALTER COLUMN patient_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scale_assignments_guest_id ON public.scale_assignments(guest_id);

-- Capture the responsible guardian name for underage patients directly on the
-- guest record (a guests row has no auth.users link, so patients.user_id cannot
-- be satisfied for a public/anonymous patient).
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS responsible_name text;

-- ---------------------------------------------------------------------------
-- RPC: identify_guest_public
-- Finds a guest by CPF (document is stored encrypted, so we decrypt to compare).
-- If found, updates the mutable fields. If not, inserts a new guest.
-- Returns the decrypted guest row. Callable by anon (public patient form).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RPC: get_guest_assignments
-- Returns the scale assignments for a given guest. Callable by anon.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_assignments(p_guest_id uuid)
RETURNS TABLE(
  id uuid,
  scale_type text,
  status text,
  assigned_at timestamptz,
  completed_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path TO public AS $$
  SELECT id, scale_type, status, assigned_at, completed_at
  FROM public.scale_assignments
  WHERE guest_id = p_guest_id
  ORDER BY assigned_at DESC;
$$;

-- ---------------------------------------------------------------------------
-- RPC: complete_assignment
-- Marks a scale assignment as completed. Callable by anon (public patient).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_assignment(p_assignment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  UPDATE public.scale_assignments
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_assignment_id;
  RETURN FOUND;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_guest_full
-- Returns decrypted guest data for the admin/clinical PDF laudo.
-- Restricted to admin/doctor/staff roles.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_full(p_guest_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  birth_date date,
  document text,
  email text,
  profession text,
  address text,
  responsible_name text
) LANGUAGE sql SECURITY DEFINER SET search_path TO public AS $$
  SELECT
    g.id,
    public.decrypt_pii(g.first_name),
    public.decrypt_pii(g.last_name),
    g.birth_date,
    public.decrypt_pii(g.document),
    public.decrypt_pii(g.email),
    g.profession,
    g.address,
    g.responsible_name
  FROM public.guests g
  WHERE g.id = p_guest_id
    AND public.get_user_role() IN ('admin', 'doctor', 'staff');
$$;

GRANT EXECUTE ON FUNCTION public.identify_guest_public(text,text,date,text,text,text,text) TO anon, authenticated;
-- Recreate the function signature grant is automatic; this also covers the renamed RETURN signature.
DROP POLICY IF EXISTS "scale_assignments_guest_select_public" ON public.scale_assignments;
CREATE POLICY "scale_assignments_guest_select_public" ON public.scale_assignments
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "scale_assignments_guest_update_public" ON public.scale_assignments;
CREATE POLICY "scale_assignments_guest_update_public" ON public.scale_assignments
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "scale_assignments_guest_insert_staff" ON public.scale_assignments;
CREATE POLICY "scale_assignments_guest_insert_staff" ON public.scale_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'doctor', 'staff'));
GRANT EXECUTE ON FUNCTION public.get_guest_assignments(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_assignment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_full(uuid) TO authenticated;
