-- Migration: Create RPCs find_session_by_scale_type and find_session_by_scale_metadata with SECURITY DEFINER
-- Allows resolving session_id from anamnesis_sessions metadata bypassing RLS

-- 1. find_session_by_scale_type
CREATE OR REPLACE FUNCTION public.find_session_by_scale_type(
  p_scale_type text,
  p_guest_id text DEFAULT NULL
)
RETURNS TABLE(session_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT s.id AS session_id
  FROM public.anamnesis_sessions s
  WHERE s.metadata->>'scaleType' = p_scale_type
    AND (p_guest_id IS NULL OR s.metadata->>'guest_id' = p_guest_id)
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_session_by_scale_type(text, text) TO anon, authenticated, service_role;

-- 2. find_session_by_scale_metadata
CREATE OR REPLACE FUNCTION public.find_session_by_scale_metadata(
  p_scale_name text,
  p_scale_key text,
  p_guest_id text DEFAULT NULL
)
RETURNS TABLE(session_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT s.id AS session_id
  FROM public.anamnesis_sessions s
  WHERE (
    s.metadata->>'scale_name' ILIKE ('%' || p_scale_name || '%')
    OR s.metadata->>'scale_key' = p_scale_key
    OR s.metadata->>'scale_type' ILIKE ('%' || p_scale_name || '%')
  )
  AND (p_guest_id IS NULL OR s.metadata->>'guest_id' = p_guest_id)
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_session_by_scale_metadata(text, text, text) TO anon, authenticated, service_role;
