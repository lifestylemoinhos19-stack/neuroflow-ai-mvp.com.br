-- Ensure 'started' status is valid for anamnesis_sessions (status is TEXT, no constraint change needed)
-- Add updated_at trigger for anamnesis_sessions if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_anamnesis_sessions_updated_at ON public.anamnesis_sessions;
CREATE TRIGGER trg_anamnesis_sessions_updated_at
  BEFORE UPDATE ON public.anamnesis_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed clinical references for scales used in the Clinical Modules Hub
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.clinical_references WHERE source = 'ASSQ' AND code = 'ASSQ') THEN
    INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata)
    VALUES ('ASSQ', 'Protocolo de Triagem', 'ASSQ', 'Autism Spectrum Screening Questionnaire',
      'Questionário de Triagem do Espectro do Autismo. 27 itens aplicável a crianças de 6 a 17 anos. Escala 0-2 (Não, Um pouco, Sim). Pontos de corte: 19 para meninas, 22 para meninos. Ferramenta de triagem, não diagnóstica.',
      'TEA', ARRAY['assq', 'autismo', 'triagem', 'crianças', 'espectro autista'], '{"items": 27, "scale_max": 2, "cutoff_boy": 22, "cutoff_girl": 19}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clinical_references WHERE source = 'ASRS-18' AND code = 'ASRS-18') THEN
    INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata)
    VALUES ('ASRS-18', 'Protocolo de Triagem', 'ASRS-18', 'Adult ADHD Self-Report Scale',
      'Escala de Autoavaliação de TDAH em Adultos. 18 itens baseados nos critérios DSM-5. Escala Likert 0-4. Pontos de corte: 4 critérios na Parte A sugerem triagem positiva. Ferramenta de triagem para adultos.',
      'TDAH', ARRAY['asrs', 'tdah', 'adultos', 'autoavaliação', 'triagem'], '{"items": 18, "scale_min": 0, "scale_max": 4}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clinical_references WHERE source = 'GAD-7' AND code = 'GAD-7') THEN
    INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata)
    VALUES ('GAD-7', 'Protocolo de Triagem', 'GAD-7', 'Generalized Anxiety Disorder 7-item Scale',
      'Escala de Transtorno de Ansiedade Generalizada. 7 itens avaliando últimos 14 dias. Escala 0-3. Pontos de corte: 5-9 leve, 10-14 moderado, 15-21 severo. Ferramenta de triagem válida também para pânico, TEPT e ansiedade social.',
      'ANSIEDADE', ARRAY['gad-7', 'ansiedade', 'triagem', 'adultos'], '{"items": 7, "scale_min": 0, "scale_max": 3, "mild_min": 5, "moderate_min": 10, "severe_min": 15}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clinical_references WHERE source = 'Y-BOCS' AND code = 'Y-BOCS') THEN
    INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata)
    VALUES ('Y-BOCS', 'Protocolo de Avaliação', 'Y-BOCS', 'Yale-Brown Obsessive Compulsive Scale',
      'Escala de Yale-Brown para Avaliação da Gravidade do TOC. 10 itens (5 para obsessões, 5 para compulsões). Escala 0-4 por item. Total: 0-40. Pontos de corte: 0-7 subclínico, 8-15 leve, 16-23 moderado, 24-31 severo, 32-40 extremo. Padrão-ouro para avaliação de gravidade do TOC.',
      'TOC', ARRAY['ybocs', 'toc', 'avaliação', 'gravidade', 'obsessão', 'compulsão'], '{"items": 10, "scale_min": 0, "scale_max": 4, "total_max": 40}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clinical_references WHERE source = 'SDS' AND code = 'SDS') THEN
    INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata)
    VALUES ('SDS', 'Protocolo de Avaliação', 'SDS', 'Severity of Dependence Scale',
      'Escala de Gravidade da Dependência. 5 itens avaliando os últimos 12 meses. Escala 0-3. Total: 0-15. Pontos de corte variam por substância: álcool >4, opiáceos >5, cocaína >6. Ferramenta breve para avaliação de gravidade da dependência de substâncias.',
      'SUBSTÂNCIAS', ARRAY['sds', 'dependência', 'substâncias', 'gravidade', 'álcool', 'drogas'], '{"items": 5, "scale_min": 0, "scale_max": 3, "total_max": 15}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clinical_references WHERE source = 'MINI-5' AND code = 'MINI-5.0.0') THEN
    INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata)
    VALUES ('MINI-5', 'Protocolo de Triagem', 'MINI-5.0.0', 'Mini International Neuropsychiatric Interview 5.0.0',
      'Entrevista Neuropsiquiátrica Internacional Mínima versão 5.0.0. Entrevista diagnóstica breve estruturada para os principais transtornos psiquiátricos do Eixo I do DSM-IV e CID-10. Tempo médio: 15-20 minutos. Não substitui avaliação clínica completa.',
      'PSIQUIATRIA', ARRAY['mini', 'entrevista', 'diagnóstica', 'psiquiatria', 'triagem'], '{"modules": 23, "estimated_time": "15-20 min"}'::jsonb);
  END IF;
END $$;

-- Ensure RLS policies are active (they already exist from previous migrations, re-affirming)
ALTER TABLE public.anamnesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
