-- Migration 4/4: Tabela responses (respostas brutas auditáveis) + RLS
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_scale_id UUID NOT NULL REFERENCES public.assessment_scales(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer JSONB NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_responses_assessment_scale_id ON public.responses(assessment_scale_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON public.responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_answered_at ON public.responses(answered_at);

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions for responses RLS
CREATE OR REPLACE FUNCTION public.can_professional_access_response(p_assessment_scale_id UUID)
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

CREATE OR REPLACE FUNCTION public.can_patient_access_response(p_assessment_scale_id UUID)
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

-- RLS Policies for responses
DROP POLICY IF EXISTS "admin_full_access" ON public.responses;
CREATE POLICY "admin_full_access" ON public.responses
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "profissional_select_responses" ON public.responses;
CREATE POLICY "profissional_select_responses" ON public.responses
  FOR SELECT
  TO authenticated
  USING (
    public.can_professional_access_response(assessment_scale_id)
  );

DROP POLICY IF EXISTS "profissional_insert_responses" ON public.responses;
CREATE POLICY "profissional_insert_responses" ON public.responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_professional_access_response(assessment_scale_id)
  );

DROP POLICY IF EXISTS "profissional_update_responses" ON public.responses;
CREATE POLICY "profissional_update_responses" ON public.responses
  FOR UPDATE
  TO authenticated
  USING (
    public.can_professional_access_response(assessment_scale_id)
  )
  WITH CHECK (
    public.can_professional_access_response(assessment_scale_id)
  );

DROP POLICY IF EXISTS "paciente_select_completed_responses" ON public.responses;
CREATE POLICY "paciente_select_completed_responses" ON public.responses
  FOR SELECT
  TO authenticated
  USING (
    public.can_patient_access_response(assessment_scale_id)
  );
