-- Migration 1/4: Tabela scales (catálogo de escalas) + RLS + seed inicial
CREATE TABLE IF NOT EXISTS public.scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  grupo_clinico TEXT,
  formato TEXT,
  pontuacao_min INT,
  pontuacao_max INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scales ENABLE ROW LEVEL SECURITY;

-- Policies for scales
DROP POLICY IF EXISTS "admin_full_access" ON public.scales;
CREATE POLICY "admin_full_access" ON public.scales
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "authenticated_select_scales" ON public.scales;
CREATE POLICY "authenticated_select_scales" ON public.scales
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed inicial das 12 escalas padrão
INSERT INTO public.scales (slug, nome, grupo_clinico, formato, pontuacao_min, pontuacao_max)
VALUES
  ('phq9', 'Questionário de Saúde do Paciente (PHQ-9)', 'Humor e Ansiedade', 'auto', 0, 27),
  ('gad7', 'Escala de Ansiedade Geral (GAD-7)', 'Humor e Ansiedade', 'auto', 0, 21),
  ('sds', 'Escala de Incapacidade de Sheehan (SDS)', 'Funcionalidade e Incapacidade', 'auto', 0, 30),
  ('ybocs', 'Escala Yale-Brown de Sintomas Obsessivo-Compulsivos (Y-BOCS)', 'TOC e Espectro Obsessivo', 'hetero', 0, 40),
  ('snapiv', 'Escala SNAP-IV para TDAH e TOD', 'Neurodesenvolvimento (Infantojuvenil)', 'hetero', 0, 54),
  ('assq', 'Questionário de Rastreio do Espectro Autista (ASSQ)', 'Neurodesenvolvimento (TEA)', 'hetero', 0, 54),
  ('mini', 'Mini International Neuropsychiatric Interview (M.I.N.I.)', 'Diagnóstico Psiquiátrico Estruturado', 'hetero', NULL, NULL),
  ('asrs18', 'Escala de Autoavaliação de TDAH em Adultos (ASRS-18)', 'Neurodesenvolvimento (TDAH Adulto)', 'auto', 0, 72),
  ('moca', 'Montreal Cognitive Assessment (MoCA)', 'Cognição e Rastreio Demencial', 'hetero', 0, 30),
  ('meem', 'Mini Exame do Estado Mental (MEEM)', 'Cognição e Rastreio Demencial', 'hetero', 0, 30),
  ('hamd', 'Escala de Avaliação de Depressão de Hamilton (HAM-D)', 'Depressão e Humor', 'hetero', 0, 52),
  ('hama', 'Escala de Avaliação de Ansiedade de Hamilton (HAM-A)', 'Ansiedade e Somatização', 'hetero', 0, 56)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  grupo_clinico = EXCLUDED.grupo_clinico,
  formato = EXCLUDED.formato,
  pontuacao_min = EXCLUDED.pontuacao_min,
  pontuacao_max = EXCLUDED.pontuacao_max;
