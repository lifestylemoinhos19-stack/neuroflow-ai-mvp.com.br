INSERT INTO public.system_settings (key, value, updated_at) VALUES
('ethics_code', jsonb_build_object(
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
      'description', 'O NeuroFlow AI está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD). Dados de saúde são classificados como dados sensíveis e são criptografados em repouso (AES-256). O consentimento informado é obrigatório, e os titulares têm direito de acesso, retificação e exclusão a qualquer momento.',
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
), NOW()),
('terms_of_use_ethics', jsonb_build_object(
  'version', '2.0',
  'last_updated', '2026-06-28',
  'sections', jsonb_build_array(
    jsonb_build_object(
      'title', '1. Natureza da Plataforma',
      'content', 'O NeuroFlow AI é uma plataforma de apoio à decisão clínica que utiliza inteligência artificial para triagem de transtornos do neurodesenvolvimento (TEA, TDAH, DI). A plataforma NÃO substitui a avaliação médica presencial para diagnóstico definitivo, conforme Resolução CFM nº 2.314/2022.'
    ),
    jsonb_build_object(
      'title', '2. Código de Ética - Seis Princípios Fundamentais',
      'content', 'Ao utilizar o NeuroFlow AI, o profissional concorda em seguir os seis princípios éticos fundamentais: (1) Primazia do Juízo Clínico, (2) Segurança e Não-Maleficência, (3) Transparência e Explicabilidade, (4) Privacidade e Proteção de Dados, (5) Equidade e Mitigação de Vieses, e (6) Responsabilidade e Prestação de Contas. O detalhamento completo está disponível na seção Institucional.'
    ),
    jsonb_build_object(
      'title', '3. Tratamento de Dados Pessoais e Sensíveis',
      'content', 'Dados de saúde são tratados como dados sensíveis conforme a LGPD. A coleta, processamento e armazenamento são realizados com consentimento informado, criptografia AES-256 em repouso, e controles de acesso baseados em função (RBAC). O titular pode exercer seus direitos (acesso, retificação, exclusão, portabilidade) a qualquer momento.'
    ),
    jsonb_build_object(
      'title', '4. Telemedicina e Limitações',
      'content', 'A telemedicina é utilizada conforme a Resolução CFM nº 2.314/2022. Triagens remotas servem como ferramenta de apoio inicial. Diagnósticos de transtornos do neurodesenvolvimento requerem avaliação presencial multidisciplinar para confirmação. O médico responsável deve encaminhar para consulta presencial quando necessário.'
    ),
    jsonb_build_object(
      'title', '5. Segurança Clínica e Bloqueios de EMT',
      'content', 'O sistema implementa bloqueios automáticos de segurança para Estimulação Magnética Transcraniana (EMT/TMS). Contraindicações absolutas (implantes cocleares, marcapassos, fragmentos metálicos, clips de aneurisma) impedem o prosseguimento. Contraindicações relativas (convulsões, epilepsia, gravidez) requerem avaliação médica obrigatória.'
    ),
    jsonb_build_object(
      'title', '6. Auditoria e Responsabilidade',
      'content', 'Todas as ações clínicas são registradas em logs de auditoria imutáveis. A responsabilidade pelas decisões clínicas é do profissional de saúde. A plataforma fornece rastreabilidade completa das sugestões de IA através de citações de fontes clínicas (RAG). Logs de segurança incluem tipo de evento, email, IP e user agent.'
    )
  )
), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
