-- NeuroFlow — Tabela dedicada para registros de Aplicação Assistida por Voz.
--
-- Segue o playbook "Aplicação Assistida de Escalas ao Paciente": cada registro
-- armazena o conjunto estruturado de itens/respostas (jsonb), a pontuação
-- bruta, a interpretação assistida (sempre com ressalva), as observações do
-- profissional e a vinculação ao scale_assignment + sessão de anamnese + guest.
--
-- RLS: admin/staff têm acesso total (aplicam assistido); doctor lê e grava
-- suas próprias aplicações; paciente NÃO lê diretamente (confidencialidade —
-- o registro só é exposto ao profissional habilitado, conforme o playbook).
--
-- Idempotente: seguro de re-executar.

CREATE TABLE IF NOT EXISTS public.assisted_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.scale_assignments(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.anamnesis_sessions(id) ON DELETE SET NULL,
  scale_type TEXT NOT NULL,
  scale_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_score NUMERIC,
  interpretation TEXT,
  observations TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assisted_applications_professional_id
  ON public.assisted_applications (professional_id);
CREATE INDEX IF NOT EXISTS idx_assisted_applications_patient_id
  ON public.assisted_applications (patient_id);
CREATE INDEX IF NOT EXISTS idx_assisted_applications_guest_id
  ON public.assisted_applications (guest_id);
CREATE INDEX IF NOT EXISTS idx_assisted_applications_assignment_id
  ON public.assisted_applications (assignment_id);
CREATE INDEX IF NOT EXISTS idx_assisted_applications_session_id
  ON public.assisted_applications (session_id);
CREATE INDEX IF NOT EXISTS idx_assisted_applications_scale_type
  ON public.assisted_applications (scale_type);
CREATE INDEX IF NOT EXISTS idx_assisted_applications_created_at
  ON public.assisted_applications (created_at DESC);

ALTER TABLE public.assisted_applications ENABLE ROW LEVEL SECURITY;

-- admin: acesso total (CRUD)
DROP POLICY IF EXISTS "assisted_applications_admin_all" ON public.assisted_applications;
CREATE POLICY "assisted_applications_admin_all" ON public.assisted_applications
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin'::text)
  WITH CHECK (get_user_role() = 'admin'::text);

-- staff: acesso total (é quem aplica assistido no fluxo do playbook)
DROP POLICY IF EXISTS "assisted_applications_staff_all" ON public.assisted_applications;
CREATE POLICY "assisted_applications_staff_all" ON public.assisted_applications
  FOR ALL TO authenticated
  USING (get_user_role() = 'staff'::text)
  WITH CHECK (get_user_role() = 'staff'::text);

-- doctor: pode ler todas as aplicações e criar/atualizar as próprias
DROP POLICY IF EXISTS "assisted_applications_doctor_select" ON public.assisted_applications;
CREATE POLICY "assisted_applications_doctor_select" ON public.assisted_applications
  FOR SELECT TO authenticated
  USING (get_user_role() = 'doctor'::text);

DROP POLICY IF EXISTS "assisted_applications_doctor_insert" ON public.assisted_applications;
CREATE POLICY "assisted_applications_doctor_insert" ON public.assisted_applications
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'doctor'::text AND professional_id = auth.uid());

DROP POLICY IF EXISTS "assisted_applications_doctor_update_own" ON public.assisted_applications;
CREATE POLICY "assisted_applications_doctor_update_own" ON public.assisted_applications
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'doctor'::text AND professional_id = auth.uid())
  WITH CHECK (get_user_role() = 'doctor'::text AND professional_id = auth.uid());

COMMENT ON TABLE public.assisted_applications IS
  'Registros de aplicação assistida por voz (playbook). Itens/Respostas/Pontuação/Interpretação sempre separados — nunca inferidos. Confidencial: só profissional habilitado acessa.';
