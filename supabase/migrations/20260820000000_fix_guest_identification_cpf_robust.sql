-- Corrige o fluxo de identificação do paciente por CPF em /minhas-escalas.
--
-- PROBLEMA: o admin cadastrava um paciente (ex.: "Paulo Ricardo") sem CPF e
-- atribuía escalas a esse guest. Quando o paciente chegava em /minhas-escalas e
-- digitava o CPF, o identify_guest_public não encontrava o guest criado pelo
-- admin (porque este não tinha document) e criava um NOVO guest (com CPF, mas
-- sem escalas). O paciente então não via as escalas atribuídas.
--
-- SOLUÇÃO: reescrever identify_guest_public para, ao receber um CPF:
--   1) Buscar por CPF exato (document já preenchido no guest);
--   2) Buscar por nome + data de nascimento (guest sem CPF, criado pelo admin),
--      priorizando o guest que POSSUI escalas atribuídas;
--   3) quando existem dois guests (um sem CPF com escalas, outro com CPF sem
--      escalas), UNIFICAR: migrar as escalas para o guest com CPF, copiar
--      dados e deletar o duplicado;
--   4) atualizar o guest encontrado com os dados recebidos (preenchendo o CPF);
--   5) somente criar um novo guest se nenhum critério casar.
--
-- A função continua SECURITY DEFINER e callable por anon (paciente público).

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
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id        uuid;
  v_doc_clean text := regexp_replace(COALESCE(p_document, ''), '[^0-9]', '', 'g');
  v_by_doc    uuid;
  v_by_name   uuid;
BEGIN
  -- 1) Busca por CPF exato (document já preenchido no guest).
  IF v_doc_clean <> '' THEN
    SELECT g.id INTO v_by_doc
    FROM public.guests g
    WHERE g.document IS NOT NULL
      AND regexp_replace(public.decrypt_pii(g.document), '[^0-9]', '', 'g') = v_doc_clean
    LIMIT 1;
  END IF;

  -- 2) Busca por nome + data de nascimento (guest sem CPF, criado pelo admin).
  --    Prioriza o guest que POSSUI escalas atribuídas.
  IF p_birth_date IS NOT NULL THEN
    SELECT g.id INTO v_by_name
    FROM public.guests g
    WHERE g.birth_date = p_birth_date
      AND g.document IS NULL
      AND lower(trim(public.decrypt_pii(g.first_name) || ' ' || public.decrypt_pii(g.last_name)))
        = lower(trim(COALESCE(p_first_name, '') || ' ' || COALESCE(p_last_name, '')))
    ORDER BY (
      EXISTS (SELECT 1 FROM public.scale_assignments sa WHERE sa.guest_id = g.id)
    ) DESC, g.created_at ASC
    LIMIT 1;
  END IF;

  -- 3) Unificação de duplicados: se encontramos um guest por CPF (v_by_doc)
  --    e outro por nome+nascimento (v_by_name), e são distintos, migramos as
  --    escalas do sem-CPF para o com-CPF e removemos o duplicado.
  IF v_by_doc IS NOT NULL AND v_by_name IS NOT NULL AND v_by_doc IS DISTINCT FROM v_by_name THEN
    -- Migra escalas do guest sem CPF (v_by_name) para o guest com CPF (v_by_doc).
    UPDATE public.scale_assignments
      SET guest_id = v_by_doc
      WHERE guest_id = v_by_name;

    -- Migra sessões de anamnese referenciadas via metadata->>'guest_id'.
    UPDATE public.anamnesis_sessions s
      SET metadata = jsonb_set(
        COALESCE(s.metadata, '{}'::jsonb),
        '{guest_id}',
        to_jsonb(v_by_doc::text)
      )
      WHERE s.metadata->>'guest_id' = v_by_name::text;

    -- Copia dados ausentes do duplicado para o principal (quando o principal
    -- não os tem). decrypt_pii é usada porque os campos estão criptografados.
    UPDATE public.guests g
      SET
        first_name       = COALESCE(NULLIF(trim(public.decrypt_pii(g.first_name)), ''),
                                    (SELECT public.decrypt_pii(d.first_name) FROM public.guests d WHERE d.id = v_by_name)),
        last_name        = COALESCE(NULLIF(trim(public.decrypt_pii(g.last_name)), ''),
                                    (SELECT public.decrypt_pii(d.last_name) FROM public.guests d WHERE d.id = v_by_name)),
        profession       = COALESCE(NULLIF(g.profession, ''),
                                    (SELECT d.profession FROM public.guests d WHERE d.id = v_by_name)),
        address          = COALESCE(NULLIF(g.address, ''),
                                    (SELECT d.address FROM public.guests d WHERE d.id = v_by_name)),
        responsible_name = COALESCE(NULLIF(g.responsible_name, ''),
                                    (SELECT d.responsible_name FROM public.guests d WHERE d.id = v_by_name)),
        birth_date       = COALESCE(g.birth_date,
                                    (SELECT d.birth_date FROM public.guests d WHERE d.id = v_by_name)),
        updated_at       = now()
      WHERE g.id = v_by_doc;

    -- Reassocia qualquer profile vinculado ao duplicado para o principal.
    UPDATE public.profiles SET guest_id = v_by_doc WHERE guest_id = v_by_name;

    -- Deleta o duplicado (já sem escalas).
    DELETE FROM public.guests WHERE id = v_by_name;

    v_id := v_by_doc;
  ELSIF v_by_doc IS NOT NULL THEN
    v_id := v_by_doc;
  ELSE
    v_id := v_by_name;
  END IF;

  -- 4) Atualiza o guest existente com os dados recebidos (preenchendo CPF se faltar).
  IF v_id IS NOT NULL THEN
    UPDATE public.guests SET
      first_name = COALESCE(NULLIF(p_first_name, ''), first_name),
      last_name  = COALESCE(NULLIF(p_last_name, ''), last_name),
      birth_date = COALESCE(p_birth_date, birth_date),
      document   = CASE
                     WHEN document IS NULL
                       OR public.decrypt_pii(document) IS NULL
                       OR regexp_replace(public.decrypt_pii(document), '[^0-9]', '', 'g') = ''
                   THEN public.encrypt_pii(p_document)
                     ELSE document
                   END,
      profession = COALESCE(NULLIF(p_profession, ''), profession),
      address    = COALESCE(NULLIF(p_address, ''), address),
      responsible_name = COALESCE(NULLIF(p_responsible_name, ''), responsible_name),
      updated_at = now()
    WHERE public.guests.id = v_id;
  ELSE
    -- 5) Nenhum guest casou: cria um novo com os dados fornecidos.
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

-- ---------------------------------------------------------------------------
-- find_guest_by_document: agora PRIORIZA o guest com escalas atribuídas
-- quando há mais de um guest com o mesmo CPF (cenário de duplicidade).
-- Reescrita como plpgsql para permitir a ordenação por existência de escalas.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.find_guest_by_document(text);

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
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_doc_clean text := regexp_replace(COALESCE(p_document, ''), '[^0-9]', '', 'g');
BEGIN
  IF v_doc_clean = '' THEN
    RETURN;
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
    g.responsible_name,
    COALESCE(g.tcle_accepted, false)
  FROM public.guests g
  WHERE g.document IS NOT NULL
    AND regexp_replace(public.decrypt_pii(g.document), '[^0-9]', '', 'g') = v_doc_clean
  ORDER BY (
    EXISTS (SELECT 1 FROM public.scale_assignments sa WHERE sa.guest_id = g.id)
  ) DESC, g.created_at ASC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_guest_by_document(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: upsert_guest_document_admin
-- Permite ao admin (staff/doctor) definir/atualizar o CPF de um guest
-- diretamente do formulário de atribuição/paciente. Restrito a roles
-- administrativas. O campo document é criptografado pelo trigger
-- encrypt_guests_pii automaticamente (recebe texto plano e o encripta).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_guest_document_admin(
  p_guest_id uuid,
  p_document text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_role text := public.get_user_role();
  v_id   uuid;
BEGIN
  IF v_role NOT IN ('admin', 'doctor', 'staff') THEN
    RAISE EXCEPTION 'Acesso negado: apenas admin/doctor/staff podem atualizar o CPF de um guest.';
  END IF;

  UPDATE public.guests
    SET document = p_document,
        updated_at = now()
  WHERE id = p_guest_id
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_guest_document_admin(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Correção do caso específico "Paulo Ricardo": o guest existente (sem CPF,
-- com escalas) recebe o CPF assim que o paciente se identificar, e a
-- unificação acontece dentro do identify_guest_public. O fix é estrutural
-- (acima) e resolve o caso quando o paciente digitar o CPF — não há dado
-- órfão a corrigir manualmente porque ainda não existe um segundo guest com
-- CPF para o Paulo Ricardo.
-- ---------------------------------------------------------------------------

-- list_guests_admin: agora também retorna o CPF (document) descriptografado,
-- para o admin poder ver/editar o CPF de cada paciente no painel.
-- O retorno mudou (adicionamos a coluna document), então precisamos DROPar
-- a função existente antes de recriá-la.
DROP FUNCTION IF EXISTS public.list_guests_admin();

CREATE OR REPLACE FUNCTION public.list_guests_admin()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  document text,
  birth_date date,
  created_at timestamptz
) LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT
    g.id,
    public.decrypt_pii(g.first_name),
    public.decrypt_pii(g.last_name),
    public.decrypt_pii(g.email),
    public.decrypt_pii(g.phone),
    public.decrypt_pii(g.document),
    g.birth_date,
    g.created_at
  FROM public.guests g
  ORDER BY g.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_guests_admin() TO authenticated;
