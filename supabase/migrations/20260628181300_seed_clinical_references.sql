INSERT INTO public.clinical_references (source, section, code, title, content, category, keywords, metadata) VALUES
-- DSM-5-TR references
('DSM-5-TR', 'Critérios Diagnósticos', 'F84.0', 'Transtorno do Espectro Autista - Critério A',
'Déficits persistentes na comunicação social e na interação social em múltiplos contextos, conforme manifestado por déficits em reciprocidade social, comportamentos comunicativos não verbais e relacionamentos. Inclui: falha em conversação, contato visual reduzido, ausência de compartilhamento de interesses ou emoções, dificuldade em ajustar comportamento ao contexto social.',
'TEA', ARRAY['autismo', 'tea', 'contato visual', 'comunicação social', 'interação social', 'reciprocidade'], '{"diagnostic_criteria": "A", "icd_code": "6A02"}'::jsonb),

('DSM-5-TR', 'Critérios Diagnósticos', 'F84.0', 'Transtorno do Espectro Autista - Critério B',
'Padrões restritos e repetitivos de comportamento, interesses ou atividades, conforme manifestado por movimentos estereotipados, insistência em mesmice, interesses restritos fixos, hiper/hiporreatividade a estímulos sensoriais. Inclui: estereotipias motoras, alinhamento de objetos, rituais, angústia frente a mudanças.',
'TEA', ARRAY['autismo', 'tea', 'estereotipia', 'movimentos repetitivos', 'flapping', 'alinhamento objetos', 'hiperfoco'], '{"diagnostic_criteria": "B", "icd_code": "6A02"}'::jsonb),

('DSM-5-TR', 'Critérios Diagnósticos', 'F90.0', 'TDAH - Tipo Desatento',
'Padrão persistente de desatenção que interfere no funcionamento ou desenvolvimento. Inclui: falha em prestar atenção a detalhes, dificuldade em manter atenção, não parece ouvir, não segue instruções, dificuldade em organizar, evita tarefas, perde objetos, distrai-se facilmente, esquece atividades diárias. Requer 6+ sintomas por pelo menos 6 meses.',
'TDAH', ARRAY['tdah', 'desatenção', 'foco', 'concentração', 'organização', 'tarefas escolares'], '{"diagnostic_criteria": "A1", "icd_code": "6A05", "min_symptoms": 6}'::jsonb),

('DSM-5-TR', 'Critérios Diagnósticos', 'F90.1', 'TDAH - Tipo Hiperativo-Impulsivo',
'Padrão persistente de hiperatividade e impulsividade. Inclui: agitação motora, sai do lugar, corre/escala excessivamente, dificuldade em atividades silenciosas, age como se movido por motor, fala em excesso, responde precipitadamente, dificuldade em esperar a vez, interrompe. Requer 6+ sintomas por pelo menos 6 meses.',
'TDAH', ARRAY['tdah', 'hiperatividade', 'impulsividade', 'inquietude', 'agitado', 'interrompe'], '{"diagnostic_criteria": "A2", "icd_code": "6A05", "min_symptoms": 6}'::jsonb),

('DSM-5-TR', 'Critérios Diagnósticos', 'F70-F79', 'Transtornos do Desenvolvimento Intelectual (DI)',
'Déficits nas funções mentais gerais, incluindo raciocínio, resolução de problemas, planejamento, pensamento abstrato, julgamento e aprendizagem. Início durante o período de desenvolvimento. Requer déficits em aptidões cognitivas e adaptativas.',
'DI', ARRAY['deficiência intelectual', 'di', 'desenvolvimento', 'cognitivo', 'atraso'], '{"icd_code_range": "6A00-6A04"}'::jsonb),

-- CID-11 references
('CID-11', 'Neurodesenvolvimento', '6A02', 'Transtorno do Espectro do Autismo',
'Caracterizado por déficits persistentes na capacidade de iniciar e de manter a reciprocidade social e por uma gama de interesses restritos, repetitivos e inflexíveis de comportamento. Pode incluir atraso de linguagem ou regressão de habilidades comunicativas.',
'TEA', ARRAY['autismo', 'tea', 'reciprocidade social', 'interesses restritos', 'regressão fala'], '{"chapter": "06"}'::jsonb),

('CID-11', 'Neurodesenvolvimento', '6A05', 'Transtorno de Déficit de Atenção e Hiperatividade',
'Transtorno do neurodesenvolvimento definido por um padrão persistente de desatenção, hiperatividade ou impulsividade que é mais prevalente do que o tipicamente observado em indivíduos de nível comparável de desenvolvimento.',
'TDAH', ARRAY['tdah', 'desatenção', 'hiperatividade', 'impulsividade', 'neurodesenvolvimento'], '{"chapter": "06"}'::jsonb),

('CID-11', 'Neurodesenvolvimento', '6A00', 'Transtorno do Desenvolvimento Intelectual',
'Distúrbio do neurodesenvolvimento caracterizado por dificuldades significativas no funcionamento intelectual e comportamento adaptativo, expressando-se em habilidades conceituais, sociais e práticas.',
'DI', ARRAY['deficiência intelectual', 'desenvolvimento', 'funcionamento intelectual'], '{"chapter": "06"}'::jsonb),

-- M-CHAT-R/F references
('M-CHAT-R/F', 'Protocolo de Triagem', 'M-CHAT-R', 'M-CHAT-R: Triagem Inicial',
'Modified Checklist for Autism in Toddlers, Revised. Aplicável em crianças de 16 a 30 meses. 20 questões binárias (Sim/Não). Pontuação: 0-2 = Baixo Risco (sem ação necessária); 3-7 = Risco Médio (aplicar M-CHAT-R/F follow-up); 8-20 = Alto Risco (encaminhar para avaliação diagnóstica). Questões críticas: 2, 5, 12, 15, 16, 18, 19, 20.',
'TEA', ARRAY['m-chat-r', 'triagem', 'autismo', 'toddlers', 'crianças'], '{"age_range": "16-30 months", "total_questions": 20, "low_risk_max": 2, "medium_risk_range": "3-7", "high_risk_min": 8}'::jsonb),

('M-CHAT-R/F', 'Protocolo de Seguimento', 'M-CHAT-R/F', 'M-CHAT-R/F: Follow-up Interview',
'Entrevista de seguimento obrigatória para pontuações de risco médio (3-7) na triagem inicial M-CHAT-R. Cada item positivo é confirmado com perguntas estruturadas. Após follow-up: 0-2 = Sem risco (monitoramento de rotina); 3+ = Risco (encaminhar para avaliação diagnóstica com especialista).',
'TEA', ARRAY['m-chat-r/f', 'follow-up', 'seguidor', 'entrevista', 'confirmação'], '{"trigger_score_range": "3-7", "positive_threshold": 3}'::jsonb),

('M-CHAT-R/F', 'Fluxograma de Seguimento', 'FLOWCHART', 'Fluxograma Oficial M-CHAT-R/F',
'1) Aplicar M-CHAT-R (20 questões). 2) Pontuação 0-2: Baixo risco, sem ação imediata. 3) Pontuação 3-7: Risco médio, aplicar M-CHAT-R/F (Follow-up Interview). 4) Após M-CHAT-R/F: Pontuação 0-2 = Sem risco (monitoramento de rotina). 5) Pontuação 3+ = Risco, encaminhar para avaliação diagnóstica completa (neuropediatra/psiquiatra infantil). 6) Pontuação inicial 8+: Alto risco, encaminhar diretamente para avaliação diagnóstica sem necessidade de follow-up.',
'TEA', ARRAY['fluxograma', 'seguimento', 'm-chat-r', 'protocolo', 'encaminhamento'], '{"steps": 6}'::jsonb),

-- SNAP-IV references
('SNAP-IV', 'Protocolo de Avaliação', 'SNAP-IV-9', 'SNAP-IV Subescala de Desatenção (9 itens)',
'Swanson, Nolan, and Pelham Rating Scale. 9 itens avaliando desatenção. Escala Likert 0-3 (0=De modo algum, 1=Só um pouco, 2=Bastante, 3=Muito). Pontuação média: soma dos 9 itens dividida por 9. Pontos de corte: >1.5 sugestivo de TDAH tipo desatento. Baseado nos critérios DSM-IV/DSM-5.',
'TDAH', ARRAY['snap-iv', 'desatenção', 'tdah', 'avaliação', 'subescala'], '{"items": 9, "scale_min": 0, "scale_max": 3, "cutoff": 1.5}'::jsonb),

('SNAP-IV', 'Protocolo de Avaliação', 'SNAP-IV-9-H', 'SNAP-IV Subescala de Hiperatividade/Impulsividade (9 itens)',
'9 itens avaliando hiperatividade e impulsividade. Escala Likert 0-3. Pontuação média: soma dos 9 itens dividida por 9. Pontos de corte: >1.5 sugestivo de TDAH tipo hiperativo-impulsivo. Combinado com desatenção >1.5 sugere TDAH tipo combinado.',
'TDAH', ARRAY['snap-iv', 'hiperatividade', 'impulsividade', 'tdah', 'subescala'], '{"items": 9, "scale_min": 0, "scale_max": 3, "cutoff": 1.5}'::jsonb),

('SNAP-IV', 'Interpretação', 'SNAP-IV-INTERP', 'SNAP-IV Interpretação e Pontos de Corte',
'Média da subescala < 1.5: Baixo risco. Média 1.5-2.0: Risco moderado (monitoramento e reavaliação). Média > 2.0: Alto risco (encaminhar para avaliação diagnóstica). Avaliação combinada: se ambas subescalas >1.5, sugere TDAH tipo combinado. A SNAP-IV é uma ferramenta de triagem, não diagnóstica. Confirmar com avaliação clínica multidisciplinar.',
'TDAH', ARRAY['snap-iv', 'interpretação', 'pontos de corte', 'risco', 'triagem'], '{"low_max": 1.5, "medium_max": 2.0}'::jsonb),

-- TMS Safety Protocols
('TMS-Safety', 'Contraindicações', 'TMS-ABS', 'EMT/TMS: Contraindicações Absolutas',
'A Estimulação Magnética Transcraniana (EMT/TMS) é ESTRIAMENTE CONTRAINDICADA em pacientes com: 1) Implantes cocleares; 2) Fragmentos metálicos na região cefálica; 3) Marcapassos cardíacos; 4) Clips de aneurisma intracraniano; 5) Eletrodos intracranianos; 6) Dispositivos eletrônicos implantados na cabeça/ pescoço. O campo magnético pode deslocar o implante, causar aquecimento tecidual, malfuncionamento do dispositivo e lesões graves.',
'SAFETY', ARRAY['tms', 'emt', 'contraindicação', 'implante coclear', 'metal', 'marcapasso', 'aneurisma'], '{"priority": "critical", "alert_level": "absolute_contraindication"}'::jsonb),

('TMS-Safety', 'Contraindicações Relativas', 'TMS-REL', 'EMT/TMS: Contraindicações Relativas',
'Contraindicações relativas incluem: 1) História de convulsões/epilepsia; 2) Lesões cerebrais estruturais; 3) Medicamentos que reduzem limiar convulsivo; 4) Gravidez; 5) História familiar de epilepsia. Avaliação médica obrigatória antes da aplicação. Caso confirmada contraindicação relativa, deve ser avaliada relação risco-benefício.',
'SAFETY', ARRAY['tms', 'emt', 'convulsão', 'epilepsia', 'risco relativo'], '{"priority": "warning", "alert_level": "relative_contraindication"}'::jsonb),

('TMS-Safety', 'Protocolo de Segurança', 'TMS-PROTO', 'EMT/TMS: Protocolo de Avaliação de Segurança',
'Antes de iniciar qualquer protocolo EMT/TMS, deve-se: 1) Realizar anamnese completa focada em contraindicações; 2) Solicitar radiografia/imagens para rastreamento de fragmentos metálicos; 3) Revisar medicações em uso; 4) Verificar histórico de convulsões; 5) Documentar aprovação médica. Em caso de dúvida, NÃO prosseguir com a estimulação.',
'SAFETY', ARRAY['tms', 'emt', 'protocolo', 'avaliação', 'segurança'], '{"priority": "high"}'::jsonb),

-- CFM Resolution 2.314/2022 - Telemedicine
('CFM-2314-2022', 'Telemedicina', 'CFM-ART-1', 'Resolução CFM nº 2.314/2022: Escopo da Telemedicina',
'A telemedicina compreende a prestação de serviços médicos mediada por tecnologias para fins de assistência, educação, pesquisa, prevenção e gestão em saúde. A triagem remota para transtornos do neurodesenvolvimento é permitida como ferramenta de apoio, mas NÃO substitui a consulta presencial para diagnóstico definitivo.',
'TELEMEDICINE', ARRAY['telemedicina', 'cfm', 'resolução', 'remoto', 'triagem'], '{"resolution": "2.314/2022", "article": "1"}'::jsonb),

('CFM-2314-2022', 'Telemedicina', 'CFM-ART-4', 'Resolução CFM nº 2.314/2022: Limitações e Responsabilidades',
'O médico deve esclarecer ao paciente ou responsável sobre as limitações da consulta remota. Diagnósticos de transtornos do neurodesenvolvimento (TEA, TDAH, DI) requerem avaliação presencial multidisciplinar para confirmação. A telemedicina pode ser usada para triagem inicial, monitoramento e seguimento, mas o diagnóstico definitivo deve ser presencial. O médico é responsável por encaminhar para avaliação presencial quando necessário.',
'TELEMEDICINE', ARRAY['telemedicina', 'limitações', 'responsabilidade', 'diagnóstico', 'presencial'], '{"resolution": "2.314/2022", "article": "4"}'::jsonb),

('CFM-2314-2022', 'Telemedicina', 'CFM-ART-7', 'Resolução CFM nº 2.314/2022: Consentimento e Privacidade',
'É obrigatório obter consentimento informado do paciente ou responsável legal antes de realizar teleconsulta. Os dados devem ser protegidos conforme LGPD. O paciente deve ser informado sobre: natureza da teleconsulta, limitações técnicas, alternativas de atendimento presencial, e direito a interromper a qualquer momento.',
'TELEMEDICINE', ARRAY['consentimento', 'privacidade', 'lgpd', 'telemedicina'], '{"resolution": "2.314/2022", "article": "7"}'::jsonb)

ON CONFLICT DO NOTHING;
