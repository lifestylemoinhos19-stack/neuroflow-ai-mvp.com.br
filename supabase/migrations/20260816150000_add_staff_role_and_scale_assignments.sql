-- Add 'staff' and 'doctor' roles to profiles_role_check constraint
-- doctor already may exist conceptually; staff is NEW for the clinical team (tablet) profile.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[
    'admin'::text,
    'doctor'::text,
    'staff'::text,
    'gerente'::text,
    'recepcionista'::text,
    'camareira'::text,
    'spa_staff'::text,
    'hospede'::text,
    'cliente_externo'::text
  ]));

-- Table linking a scale (anamnesis session) to a patient, assigned by staff/admin.
-- patient_id references profiles.id (the patient's auth user profile).
CREATE TABLE IF NOT EXISTS public.scale_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.anamnesis_sessions(id) ON DELETE SET NULL,
  scale_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scale_assignments_patient_id ON public.scale_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_scale_assignments_status ON public.scale_assignments(status);
CREATE INDEX IF NOT EXISTS idx_scale_assignments_session_id ON public.scale_assignments(session_id);

-- RLS for scale_assignments
ALTER TABLE public.scale_assignments ENABLE ROW LEVEL SECURITY;

-- Admin: full access
DROP POLICY IF EXISTS "scale_assignments_admin_all" ON public.scale_assignments;
CREATE POLICY "scale_assignments_admin_all" ON public.scale_assignments
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin'::text)
  WITH CHECK (get_user_role() = 'admin'::text);

-- Staff (equipe técnica): can read/insert/update assignments they manage
DROP POLICY IF EXISTS "scale_assignments_staff_all" ON public.scale_assignments;
CREATE POLICY "scale_assignments_staff_all" ON public.scale_assignments
  FOR ALL TO authenticated
  USING (get_user_role() = 'staff'::text)
  WITH CHECK (get_user_role() = 'staff'::text);

-- Doctor: can read assignments for clinical oversight
DROP POLICY IF EXISTS "scale_assignments_doctor_select" ON public.scale_assignments;
CREATE POLICY "scale_assignments_doctor_select" ON public.scale_assignments
  FOR SELECT TO authenticated
  USING (get_user_role() = 'doctor'::text);

-- Patient (hospede): can read assignments targeting themselves
DROP POLICY IF EXISTS "scale_assignments_patient_select_own" ON public.scale_assignments;
CREATE POLICY "scale_assignments_patient_select_own" ON public.scale_assignments
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "scale_assignments_patient_update_own" ON public.scale_assignments;
CREATE POLICY "scale_assignments_patient_update_own" ON public.scale_assignments
  FOR UPDATE TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());
