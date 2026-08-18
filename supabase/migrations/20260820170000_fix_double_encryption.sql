-- Fix double-encryption on guests PII fields
--
-- Root cause: the BEFORE INSERT OR UPDATE trigger `encrypt_guests_pii`
-- unconditionally re-encrypted the fields on every UPDATE. Because the
-- `is_encrypted()` guard was missing from the trigger body, admin UPDATEs that
-- wrote back already-encrypted values produced double-encrypted data, which
-- `decrypt_pii()` (and therefore `list_guests_admin()`) could only peel one
-- layer off of — leaving base64 cipher text in first_name / last_name /
-- email / phone. The `document` field escaped because it is written via the
-- `upsert_guest_document_admin()` SECURITY DEFINER function which does not
-- route through the same UPDATE cycle.
--
-- This migration:
--   1. Rewrites `encrypt_guests_pii()` so it only encrypts a field when the
--      incoming value is NOT already encrypted (idempotent encryption).
--   2. Recreates the trigger bound to the corrected function.
--   3. Strips ONE encryption layer from every double-encrypted PII field so
--      the stored data returns to a single encrypted layer that the trigger
--      will no longer re-encrypt.

-- ---------------------------------------------------------------------------
-- 1. Corrected trigger function: never re-encrypt already-encrypted data.
--    `is_encrypted()` returns true when `decrypt_pii()` succeeds, i.e. the
--    value is a valid single-layer cipher. We must encrypt ONLY plain text.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.encrypt_guests_pii()
RETURNS trigger AS $$
BEGIN
  IF NEW.first_name IS NOT NULL AND NEW.first_name <> '' AND NOT public.is_encrypted(NEW.first_name) THEN
    NEW.first_name := public.encrypt_pii(NEW.first_name);
  END IF;

  IF NEW.last_name IS NOT NULL AND NEW.last_name <> '' AND NOT public.is_encrypted(NEW.last_name) THEN
    NEW.last_name := public.encrypt_pii(NEW.last_name);
  END IF;

  IF NEW.document IS NOT NULL AND NEW.document <> '' AND NOT public.is_encrypted(NEW.document) THEN
    NEW.document := public.encrypt_pii(NEW.document);
  END IF;

  IF NEW.email IS NOT NULL AND NEW.email <> '' AND NOT public.is_encrypted(NEW.email) THEN
    NEW.email := public.encrypt_pii(NEW.email);
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone <> '' AND NOT public.is_encrypted(NEW.phone) THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. Rebind the trigger to the corrected function.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_encrypt_guests_pii ON public.guests;
CREATE TRIGGER trigger_encrypt_guests_pii
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_guests_pii();

-- ---------------------------------------------------------------------------
-- 3. Repair existing double-encrypted rows: strip ONE encryption layer.
--    A row is double-encrypted when `decrypt_pii(field)` is itself encrypted
--    (i.e. `is_encrypted(decrypt_pii(field))` is true). After peeling the
--    inner layer, the field holds a valid single-layer cipher that the
--    corrected trigger will leave untouched on future UPDATEs.
--    Rows that are only single-encrypted are left alone via the WHERE clause.
--    Processed in batches to stay within the statement-timeout limit.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  batch_size INT := 500;
  affected INT;
BEGIN
  LOOP
    UPDATE public.guests
    SET
      first_name = public.decrypt_pii(first_name),
      last_name = public.decrypt_pii(last_name),
      email = CASE WHEN email IS NOT NULL THEN public.decrypt_pii(email) ELSE NULL END,
      phone = CASE WHEN phone IS NOT NULL THEN public.decrypt_pii(phone) ELSE NULL END
    WHERE id IN (
      SELECT id FROM public.guests
      WHERE public.is_encrypted(public.decrypt_pii(first_name))
      LIMIT batch_size
    );
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.05);
  END LOOP;
END $$;
