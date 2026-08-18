-- Fix: function pgp_sym_decrypt(bytea, text) does not exist
-- Root cause: list_guests_admin sets SET search_path TO 'public', but pgcrypto
-- functions (pgp_sym_decrypt, pgp_sym_encrypt) live in the `extensions` schema
-- on Supabase. When list_guests_admin -> decrypt_pii -> pgp_sym_decrypt runs,
-- Postgres can't resolve pgp_sym_decrypt because search_path is restricted to
-- public only.
-- Fix: add `extensions` to the search_path of all three functions.

-- 1. decrypt_pii: define its own search_path including extensions
CREATE OR REPLACE FUNCTION public.decrypt_pii(p_cipher text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF p_cipher IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(
    decode(p_cipher, 'base64'),
    public.get_encryption_key()
  );
END;
$$;

-- 2. encrypt_pii: define its own search_path including extensions
CREATE OR REPLACE FUNCTION public.encrypt_pii(p_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF p_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(
    pgp_sym_encrypt(p_text, public.get_encryption_key(), 'cipher-algo=aes256'::text),
    'base64'
  );
END;
$$;

-- 3. list_guests_admin: include extensions in search_path so decrypt_pii can
--    resolve pgp_sym_decrypt transitively
CREATE OR REPLACE FUNCTION public.list_guests_admin()
RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, birth_date date, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
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
