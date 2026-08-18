-- Fix runtime error: "function pgp_sym_encrypt(text, text, unknown) does not exist"
--
-- The third argument to pgp_sym_encrypt (the options literal 'cipher-algo=aes256')
-- is typed as `unknown` by PostgreSQL, and pgcrypto cannot resolve a matching
-- function signature. Adding an explicit `::text` cast resolves the overload.
--
-- ONLY the cast is changed. decrypt_pii and all other logic are untouched.

CREATE OR REPLACE FUNCTION public.encrypt_pii(p_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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
