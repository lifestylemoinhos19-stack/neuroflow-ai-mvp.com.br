-- Migration: Create trigger on anamnesis_sessions to link scale_assignments when completed
-- Trigger AFTER UPDATE ON anamnesis_sessions:
-- When status changes to 'completed', updates scale_assignments:
-- SET session_id = NEW.id, status = 'completed'
-- WHERE session_id IS NULL, scale_type matches NEW.metadata->>'scaleType',
-- and guest_id matches (if present in metadata).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'sync_scale_assignment_on_session_completed'
  ) THEN
    CREATE OR REPLACE FUNCTION public.sync_scale_assignment_on_session_completed()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, extensions
    AS $func$
    DECLARE
      v_scale_type TEXT;
      v_guest_id UUID;
    BEGIN
      -- Só executa quando o status muda para 'completed'
      IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        v_scale_type := NEW.metadata->>'scaleType';

        IF v_scale_type IS NOT NULL AND v_scale_type <> '' THEN
          -- Tenta extrair guest_id se presente no metadata (como UUID válido)
          BEGIN
            IF NEW.metadata->>'guest_id' IS NOT NULL AND NEW.metadata->>'guest_id' <> '' THEN
              v_guest_id := (NEW.metadata->>'guest_id')::UUID;
            ELSE
              v_guest_id := NULL;
            END IF;
          EXCEPTION WHEN OTHERS THEN
            v_guest_id := NULL;
          END;

          -- Atualiza scale_assignments compatíveis que ainda não possuam session_id vinculado
          UPDATE public.scale_assignments
          SET
            session_id = NEW.id,
            status = 'completed',
            completed_at = COALESCE(completed_at, NEW.completed_at, NOW()),
            updated_at = NOW()
          WHERE session_id IS NULL
            AND (
              scale_type = v_scale_type
              OR LOWER(REPLACE(REPLACE(scale_type, '-', ''), ' ', '')) = LOWER(REPLACE(REPLACE(v_scale_type, '-', ''), ' ', ''))
            )
            AND (
              v_guest_id IS NULL
              OR guest_id = v_guest_id
            );
        END IF;
      END IF;

      RETURN NEW;
    END;
    $func$;
  END IF;
END $$;

-- Criação / Recriação da trigger de forma idempotente
DROP TRIGGER IF EXISTS trg_sync_scale_assignment_on_session_completed ON public.anamnesis_sessions;

CREATE TRIGGER trg_sync_scale_assignment_on_session_completed
  AFTER UPDATE ON public.anamnesis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_scale_assignment_on_session_completed();
