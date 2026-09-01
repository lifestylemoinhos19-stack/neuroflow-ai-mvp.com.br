-- Permite que usuários anon/public (paciente via guest_id) acessem scale_assignments
-- e gravem em assisted_applications quando possuírem o assignmentId/guestId

-- 1. scale_assignments: leitura por anon
DROP POLICY IF EXISTS "scale_assignments_anon_select" ON public.scale_assignments;
CREATE POLICY "scale_assignments_anon_select" ON public.scale_assignments
  FOR SELECT TO anon
  USING (true);

-- 2. assisted_applications: insert e update por anon (e authenticated paciente)
DROP POLICY IF EXISTS "assisted_applications_anon_insert" ON public.assisted_applications;
CREATE POLICY "assisted_applications_anon_insert" ON public.assisted_applications
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "assisted_applications_anon_update" ON public.assisted_applications;
CREATE POLICY "assisted_applications_anon_update" ON public.assisted_applications
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "assisted_applications_anon_select" ON public.assisted_applications;
CREATE POLICY "assisted_applications_anon_select" ON public.assisted_applications
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "assisted_applications_authenticated_all" ON public.assisted_applications;
CREATE POLICY "assisted_applications_authenticated_all" ON public.assisted_applications
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
