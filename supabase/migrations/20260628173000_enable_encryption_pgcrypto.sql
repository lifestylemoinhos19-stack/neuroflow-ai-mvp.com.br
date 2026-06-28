CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS text AS $$
  SELECT COALESCE(
    current_setting('app.encryption_key', true),
    'neuroflow_aes256_secret_key_2026_rotate_in_prod'
  );
$$ LANGUAGE sql SECURITY DEFINER IMMUTABLE;

CREATE OR REPLACE FUNCTION public.encrypt_pii(p_text text)
RETURNS text AS $$
BEGIN
  IF p_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(
    pgp_sym_encrypt(p_text, public.get_encryption_key(), 'cipher-algo=aes256'),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_pii(p_cipher text)
RETURNS text AS $$
BEGIN
  IF p_cipher IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(
    decode(p_cipher, 'base64'),
    public.get_encryption_key()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_encrypted(p_text text)
RETURNS boolean AS $$
BEGIN
  IF p_text IS NULL OR p_text = '' THEN
    RETURN false;
  END IF;
  PERFORM public.decrypt_pii(p_text);
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.encrypt_guests_pii()
RETURNS trigger AS $$
BEGIN
  NEW.first_name := public.encrypt_pii(NEW.first_name);
  NEW.last_name := public.encrypt_pii(NEW.last_name);
  NEW.document := public.encrypt_pii(NEW.document);
  NEW.email := public.encrypt_pii(NEW.email);
  NEW.phone := public.encrypt_pii(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.encrypt_anamnesis_response()
RETURNS trigger AS $$
BEGIN
  NEW.response_value := to_jsonb(public.encrypt_pii(NEW.response_value::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  UPDATE public.guests
  SET first_name = public.encrypt_pii(first_name)
  WHERE first_name IS NOT NULL AND first_name != ''
    AND NOT public.is_encrypted(first_name);

  UPDATE public.guests
  SET last_name = public.encrypt_pii(last_name)
  WHERE last_name IS NOT NULL AND last_name != ''
    AND NOT public.is_encrypted(last_name);

  UPDATE public.guests
  SET document = public.encrypt_pii(document)
  WHERE document IS NOT NULL AND document != ''
    AND NOT public.is_encrypted(document);

  UPDATE public.guests
  SET email = public.encrypt_pii(email)
  WHERE email IS NOT NULL AND email != ''
    AND NOT public.is_encrypted(email);

  UPDATE public.guests
  SET phone = public.encrypt_pii(phone)
  WHERE phone IS NOT NULL AND phone != ''
    AND NOT public.is_encrypted(phone);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Guests PII backfill notice: %', SQLERRM;
END $$;

DO $$
BEGIN
  UPDATE public.anamnesis_responses
  SET response_value = to_jsonb(public.encrypt_pii(response_value::text))
  WHERE response_value IS NOT NULL
    AND NOT public.is_encrypted(response_value#>>'{}');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Anamnesis responses backfill notice: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS trigger_encrypt_guests_pii ON public.guests;
CREATE TRIGGER trigger_encrypt_guests_pii
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_guests_pii();

DROP TRIGGER IF EXISTS trigger_encrypt_anamnesis_response ON public.anamnesis_responses;
CREATE TRIGGER trigger_encrypt_anamnesis_response
  BEFORE INSERT OR UPDATE ON public.anamnesis_responses
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_anamnesis_response();
