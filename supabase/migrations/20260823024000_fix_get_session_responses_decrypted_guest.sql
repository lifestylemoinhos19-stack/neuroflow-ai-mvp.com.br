-- Migration to fix authorization check for guest sessions (user_id IS NULL)
-- in public.get_session_responses_decrypted(uuid)

CREATE OR REPLACE FUNCTION public.get_session_responses_decrypted(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  question_key text,
  question_label text,
  response_value text,
  created_at timestamptz
) AS $$
BEGIN
  -- Verify the session belongs to the current user or user is admin or is a guest session
  IF NOT EXISTS (
    SELECT 1 FROM public.anamnesis_sessions s
    WHERE s.id = p_session_id
    AND (s.user_id IS NULL OR s.user_id = auth.uid() OR public.get_user_role() = 'admin')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.question_key,
    r.question_label,
    CASE
      WHEN public.is_encrypted(r.response_value#>>'{}') THEN public.decrypt_pii(r.response_value#>>'{}')
      ELSE r.response_value#>>'{}'
    END AS response_value,
    r.created_at
  FROM public.anamnesis_responses r
  WHERE r.session_id = p_session_id
  ORDER BY r.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
