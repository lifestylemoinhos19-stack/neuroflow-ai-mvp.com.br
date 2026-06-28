INSERT INTO public.system_settings (key, value, updated_at) VALUES
('code_of_ethics', jsonb_build_object(
  'title', 'Código de Ética do NeuroFlow AI',
  'subtitle', 'Princípios éticos fundamentais para o uso de IA em saúde',
  'principles', jsonb_build_array(
    jsonb_build_object(
      'number', 1,
      'title', 'Primazia do Juízo Clínico (Ato Médico)',
      'description', 'A inteligência artificial do NeuroFlow AI é uma ferramenta de apoio à decisão clínica. A decisão final diagnóstica e terapêutica pertence exclusivamente ao médico responsável, que deve exercer seu juízo clínico com autonomia e responsabilidade profissional. A IA não substitui a avaliação médica presencial.',
      'icon', 'stethoscope'
    ),
    jsonb_build_object(
      'number', 2,
      'title', 'Segurança e Não-Maleficência (Bloqueios de EMT)',
      'description', 'A plataforma adere estritamente aos protocolos de segurança para Estimulação Magnética Transcraniana (EMT/TMS), incluindo bloqueios automáticos para contraindicações absolutas (implantes cocleares, fragmentos metálicos cefálicos, marcapassos, clips de aneurisma) e avaliação obrigatória de contraindicações relativas (história de convulsões, medicação que reduz limiar convulsivo).',
      'icon', 'shield'
    ),
    jsonb_build_object(
      'number', 3,
      'title', 'Transparência e Explicabilidade (Rastreabilidade RAG)',
      'description', 'Todas as sugestões geradas pela IA podem ser rastreadas até suas fontes clínicas originais através do sistema RAG (Retrieval-Augmented Generation). Cada recomendação inclui citações das fontes utilizadas (DSM-5-TR, CID-11, M-CHAT-R/F, SNAP-IV, CFM 2.314/2022), garantindo plena explicabilidade e auditabilidade das decisões assistidas por IA.',
      'icon', 'search'
    ),
    jsonb_build_object(
      'number', 4,
      'title', 'Privacidade e Proteção de Dados Sensíveis (LGPD)',
      'description', 'O NeuroFlow AI está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD). Dados de saúde são classificados como dados sensíveis e são criptografados em repouso (AES-256). O consentimento informado é obrigatório, e os titulares têm direito de acesso, retificação e exclusão a qualquer momento. Dados coletados são anonimizados para refinamento do modelo e treinamento clínico.',
      'icon', 'lock'
    ),
    jsonb_build_object(
      'number', 5,
      'title', 'Equidade e Mitigação de Vieses',
      'description', 'A plataforma compromete-se a entregar resultados de IA não discriminatórios, realizando testes contínuos de viés demográfico (gênero, idade, etnia, nível socioeconômico). Testes de estresse sistemáticos são executados para identificar e corrigir disparidades nos resultados de triagem, garantindo equidade no acesso ao diagnóstico.',
      'icon', 'scale'
    ),
    jsonb_build_object(
      'number', 6,
      'title', 'Responsabilidade e Prestação de Contas',
      'description', 'O NeuroFlow AI mantém logs de auditoria completos de todas as operações clínicas, incluindo acessos, alterações, decisões de IA e interações do usuário. A rastreabilidade é garantida através de trilhas de auditoria imutáveis. A responsabilidade pelas ações clínicas é compartilhada entre o profissional de saúde e a equipe de governança da plataforma.',
      'icon', 'clipboard-check'
    )
  )
), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.system_settings
    WHERE key = 'terms_of_use_ethics'
    AND value::text LIKE '%Anonimização%'
  ) THEN
    UPDATE public.system_settings
    SET value = jsonb_set(
      value,
      '{sections}',
      COALESCE(value->'sections', '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'title', '7. Anonimização de Dados para Treinamento de Modelo',
          'content', 'Os dados coletados serão anonimizados para o propósito de refinamento do modelo e treinamento clínico, seguindo as melhores práticas da LGPD (Lei nº 13.709/2018). A anonimização garante que os dados de saúde não possam ser rastreados de volta a indivíduos específicos, protegendo a privacidade dos pacientes conforme os princípios do NeuroFlow AI.'
        )
      ),
      true
    ),
    updated_at = NOW()
    WHERE key = 'terms_of_use_ethics';
  END IF;
END $$;
