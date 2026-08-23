-- Migration 2/4: Tabela assessments (bateria aplicada a um paciente) + RLS
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_patient_id ON public.assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_profissional_id ON public.assessments(profissional_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_patient_professional_for_assessment(p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assessments a
    JOIN public.patients p ON p.id = a.patient_id
    WHERE a.id = p_assessment_id
      AND (p.profissional_id = auth.uid() OR a.profissional_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_patient_owner_for_assessment(p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assessments a
    JOIN public.patients p ON p.id = a.patient_id
    WHERE a.id = p_assessment_id
      AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_patient_accessible_by_professional(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = p_patient_id
      AND p.profissional_id = auth.uid()
  );
$$;

-- RLS Policies for assessments
DROP POLICY IF EXISTS "admin_full_access" ON public.assessments;
CREATE POLICY "admin_full_access" ON public.assessments
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "profissional_select_assessments" ON public.assessments;
CREATE POLICY "profissional_select_assessments" ON public.assessments
  FOR SELECT
  TO authenticated
  USING (
    public.is_patient_accessible_by_professional(patient_id)
    OR profissional_id = auth.uid()
  );

DROP POLICY IF EXISTS "profissional_insert_assessments" ON public.assessments;
CREATE POLICY "profissional_insert_assessments" ON public.assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_patient_accessible_by_professional(patient_id)
    OR profissional_id = auth.uid()
  );

DROP POLICY IF EXISTS "profissional_update_assessments" ON public.assessments;
CREATE POLICY "profissional_update_assessments" ON public.assessments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_patient_accessible_by_professional(patient_id)
    OR profissional_id = auth.uid()
  )
  WITH CHECK (
    public.is_patient_accessible_by_professional(patient_id)
    OR profissional_id = auth.uid()
  );

DROP POLICY IF EXISTS "paciente_select_completed_assessments" ON public.assessments;
CREATE POLICY "paciente_select_completed_assessments" ON public.assessments
  FOR SELECT
  TO authenticated
  USING (
    status = 'concluida'
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
  );
