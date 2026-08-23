-- Migration 3/4: Tabela assessment_scales (escalas dentro de cada bateria com ordem) + RLS
CREATE TABLE IF NOT EXISTS public.assessment_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  scale_id UUID NOT NULL REFERENCES public.scales(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida')),
  CONSTRAINT uq_assessment_scales_scale UNIQUE(assessment_id, scale_id),
  CONSTRAINT uq_assessment_scales_ordem UNIQUE(assessment_id, ordem)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_scales_assessment_id ON public.assessment_scales(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scales_scale_id ON public.assessment_scales(scale_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scales_ordem ON public.assessment_scales(ordem);
CREATE INDEX IF NOT EXISTS idx_assessment_scales_status ON public.assessment_scales(status);

-- Enable RLS
ALTER TABLE public.assessment_scales ENABLE ROW LEVEL SECURITY;

-- Security Definer helper for assessment_scale access
CREATE OR REPLACE FUNCTION public.is_assessment_scale_accessible_by_professional(p_assessment_scale_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assessment_scales ascl
    JOIN public.assessments a ON a.id = ascl.assessment_id
    JOIN public.patients p ON p.id = a.patient_id
    WHERE ascl.id = p_assessment_scale_id
      AND (p.profissional_id = auth.uid() OR a.profissional_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assessment_scale_accessible_by_patient(p_assessment_scale_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assessment_scales ascl
    JOIN public.assessments a ON a.id = ascl.assessment_id
    JOIN public.patients p ON p.id = a.patient_id
    WHERE ascl.id = p_assessment_scale_id
      AND a.status = 'concluida'
      AND p.user_id = auth.uid()
  );
$$;

-- RLS Policies for assessment_scales
DROP POLICY IF EXISTS "admin_full_access" ON public.assessment_scales;
CREATE POLICY "admin_full_access" ON public.assessment_scales
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "profissional_select_assessment_scales" ON public.assessment_scales;
CREATE POLICY "profissional_select_assessment_scales" ON public.assessment_scales
  FOR SELECT
  TO authenticated
  USING (
    public.is_patient_professional_for_assessment(assessment_id)
  );

DROP POLICY IF EXISTS "profissional_insert_assessment_scales" ON public.assessment_scales;
CREATE POLICY "profissional_insert_assessment_scales" ON public.assessment_scales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_patient_professional_for_assessment(assessment_id)
  );

DROP POLICY IF EXISTS "profissional_update_assessment_scales" ON public.assessment_scales;
CREATE POLICY "profissional_update_assessment_scales" ON public.assessment_scales
  FOR UPDATE
  TO authenticated
  USING (
    public.is_patient_professional_for_assessment(assessment_id)
  )
  WITH CHECK (
    public.is_patient_professional_for_assessment(assessment_id)
  );

DROP POLICY IF EXISTS "paciente_select_completed_assessment_scales" ON public.assessment_scales;
CREATE POLICY "paciente_select_completed_assessment_scales" ON public.assessment_scales
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.assessments a
      JOIN public.patients p ON p.id = a.patient_id
      WHERE a.id = assessment_id
        AND a.status = 'concluida'
        AND p.user_id = auth.uid()
    )
  );
