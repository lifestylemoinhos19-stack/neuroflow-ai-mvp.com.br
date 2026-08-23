-- Migration: Create RPC find_session_by_question_prefix with SECURITY DEFINER
-- Allows resolving session_id from question_key prefix in anamnesis_responses bypassing RLS
CREATE OR REPLACE FUNCTION public.find_session_by_question_prefix(p_prefix text)
RETURNS TABLE(session_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT r.session_id
  FROM public.anamnesis_responses r
  WHERE r.question_key ILIKE (p_prefix || '%')
  ORDER BY r.created_at DESC
  LIMIT 1;
$$;

-- Grant execution to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.find_session_by_question_prefix(text) TO anon, authenticated, service_role;
