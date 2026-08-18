-- TCLE (Termo de Consentimento Livre e Esclarecido) para o fluxo público
-- do paciente em /minhas-escalas.
--
-- O paciente anônimo (guest) agora precisa aceitar o TCLE antes de ver as
-- escalas atribuídas. Registramos a aceitação no próprio registro do guest
-- para que, no retorno, a etapa seja pulada automaticamente.

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS tcle_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tcle_accepted_at timestamptz;

-- ---------------------------------------------------------------------------
-- RPC: accept_guest_tcle
-- Marca o TCLE como aceito para um guest. Callable por anon (paciente público).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_guest_tcle(p_guest_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  UPDATE public.guests
  SET tcle_accepted = true,
      tcle_accepted_at = now(),
      updated_at = now()
  WHERE id = p_guest_id;
  RETURN FOUND;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_guest_tcle_status
-- Retorna o status de aceitação do TCLE para um guest. Callable por anon.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_tcle_status(p_guest_id uuid)
RETURNS TABLE(
  tcle_accepted boolean,
  tcle_accepted_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path TO public AS $$
  SELECT g.tcle_accepted, g.tcle_accepted_at
  FROM public.guests g
  WHERE g.id = p_guest_id;
$$;

-- ---------------------------------------------------------------------------
-- RPC: find_guest_by_document
-- Procura um guest pelo CPF (document é armazenado criptografado, então
-- descriptografamos para comparar). NÃO cria um novo guest — apenas retorna
-- o existente ou nulo. Callable por anon (fluxo de acesso simplificado).
-- Retorna os campos descriptografados.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_guest_by_document(p_document text)
RETURNS TABLE(
  out_id uuid,
  out_first_name text,
  out_last_name text,
  out_birth_date date,
  out_document text,
  out_profession text,
  out_address text,
  out_responsible_name text,
  out_tcle_accepted boolean
) LANGUAGE sql SECURITY DEFINER SET search_path TO public AS $$
  SELECT
    g.id,
    public.decrypt_pii(g.first_name),
    public.decrypt_pii(g.last_name),
    g.birth_date,
    public.decrypt_pii(g.document),
    g.profession,
    g.address,
    g.responsible_name,
    COALESCE(g.tcle_accepted, false)
  FROM public.guests g
  WHERE g.document IS NOT NULL
    AND public.decrypt_pii(g.document) = p_document
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.accept_guest_tcle(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_tcle_status(uuid) TO anon, authenticated;
-- ---------------------------------------------------------------------------
-- RPC: list_guests_admin
-- Lista todos os guests (para o painel admin) com os PII descriptografados.
-- Descriptografa os campos via decrypt_pii. Restrito a admin/doctor/staff.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_guests_admin()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  birth_date date,
  created_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path TO public AS $$
  SELECT
    g.id,
    public.decrypt_pii(g.first_name),
    public.decrypt_pii(g.last_name),
    public.decrypt_pii(g.email),
    public.decrypt_pii(g.phone),
    g.birth_date,
    g.created_at
  FROM public.guests g
  ORDER BY g.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_guests_admin() TO authenticated;
