-- Adiciona colunas bdi_score e bai_score na tabela clinical_feedback
ALTER TABLE public.clinical_feedback
  ADD COLUMN IF NOT EXISTS bdi_score NUMERIC,
  ADD COLUMN IF NOT EXISTS bai_score NUMERIC;

-- Garante que se a tabela scales existir, bdi e bai estejam registrados
INSERT INTO public.scales (slug, nome, grupo_clinico, formato, pontuacao_min, pontuacao_max)
VALUES
  ('bdi', 'Inventário de Depressão de Beck (BDI-II)', 'Depressão', 'likert', 0, 63),
  ('bai', 'Inventário de Ansiedade de Beck (BAI)', 'Ansiedade', 'likert', 0, 63)
ON CONFLICT (slug) DO NOTHING;
