-- Allow authenticated users to insert camera error logs into system_updates
DROP POLICY IF EXISTS "authenticated_insert_system_updates" ON public.system_updates;
CREATE POLICY "authenticated_insert_system_updates" ON public.system_updates
  FOR INSERT TO authenticated WITH CHECK (true);
