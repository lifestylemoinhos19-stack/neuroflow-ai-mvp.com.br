CREATE OR REPLACE FUNCTION public.log_audit_operation()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_entity_id uuid;
BEGIN
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSE
    v_entity_id := NEW.id;
    v_new_data := to_jsonb(NEW);
    IF TG_OP = 'UPDATE' THEN
      v_old_data := to_jsonb(OLD);
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'guests' THEN
    v_old_data := v_old_data - array['first_name','last_name','document','email','phone'];
    v_new_data := v_new_data - array['first_name','last_name','document','email','phone'];
  END IF;

  IF TG_TABLE_NAME = 'anamnesis_responses' THEN
    v_old_data := v_old_data - array['response_value'];
    v_new_data := v_new_data - array['response_value'];
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    v_user_id,
    TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    jsonb_build_object('old_data', v_old_data, 'new_data', v_new_data)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_guests ON public.guests;
CREATE TRIGGER trigger_audit_guests
  AFTER INSERT OR UPDATE OR DELETE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_operation();

DROP TRIGGER IF EXISTS trigger_audit_anamnesis_sessions ON public.anamnesis_sessions;
CREATE TRIGGER trigger_audit_anamnesis_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.anamnesis_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_operation();

DROP TRIGGER IF EXISTS trigger_audit_anamnesis_responses ON public.anamnesis_responses;
CREATE TRIGGER trigger_audit_anamnesis_responses
  AFTER INSERT OR UPDATE OR DELETE ON public.anamnesis_responses
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_operation();
