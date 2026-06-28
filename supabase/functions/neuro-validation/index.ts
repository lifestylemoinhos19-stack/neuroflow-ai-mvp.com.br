import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type SafetyFlag =
  | 'none'
  | 'absolute_contraindication'
  | 'relative_contraindication'
  | 'out_of_scope'
type Category = 'TEA' | 'TDAH' | 'DI' | 'SAFETY_ALERT' | 'OUT_OF_SCOPE' | 'GENERAL'
type ScaleSuggestion = 'M-CHAT-R' | 'SNAP-IV' | 'NONE'

interface ClinicalCitation {
  source: string
  code: string
  title: string
  section: string
}

interface ValidationResult {
  category: Category
  riskLevel: 'low' | 'medium' | 'high' | null
  scaleSuggestion: ScaleSuggestion
  safetyFlag: SafetyFlag
  safetyMessage: string | null
  clinicalRationale: string
  suggestedAction: string
  clinicalCitations: ClinicalCitation[]
  telemedicineDisclaimer: boolean
}

const TEA_PATTERNS = [
  'sem contato visual',
  'sem apontar',
  'não aponta',
  'nao aponta',
  'falta de contato visual',
  'evita contato visual',
  'não olha nos olhos',
  'nao olha nos olhos',
  'estereotipia',
  'movimentos repetitivos',
  'flapping',
  'alinhar objetos',
  'hiperfoco em objetos',
  'regressão de fala',
  'regressao de fala',
  'perdeu fala',
  'não responde ao nome',
  'nao responde ao nome',
  'isolamento social',
  'atraso',
  'sem linguagem',
  'não verbal',
  'nao verbal',
  'reciprocidade social',
  'interesses restritos',
  'compartilhamento de interesses',
  'ironia',
  'interesses',
  'estereotipad',
]

const TDAH_PATTERNS = [
  'inquietude',
  'hiperatividade',
  'falta de foco',
  'dificuldade de concentração',
  'dificuldade de concentracao',
  'desatenção',
  'desatencao',
  'impulsividade',
  'não fica parado',
  'nao fica parado',
  'dificuldade escolar',
  'comportamento disruptivo',
  'não termina tarefas',
  'nao termina tarefas',
  'esquece atividades',
  'fala demais',
  'interrompe',
  'agitado',
  'foco escolar',
  'rendimento escolar',
  'tarefa escolar',
  'organização',
  'perde objetos',
  'esquec',
  'manter o foco',
]

const DI_PATTERNS = [
  'deficiência intelectual',
  'deficiencia intelectual',
  'atraso cognitivo',
  'dificuldade de aprendizagem',
  'raciocínio',
  'funcionamento intelectual',
  'aptidões cognitivas',
  'comportamento adaptativo',
]

const TMS_PATTERNS = [
  'emt',
  'tms',
  'estimulação magnética transcraniana',
  'estimulacao magnetica transcraniana',
  'estimulação transcraniana',
  'estimulacao transcraniana',
]

const IMPLANT_PATTERNS = [
  'implante coclear',
  'implante',
  'metal',
  'metálico',
  'metalico',
  'marcapasso',
  'clip aneurisma',
  'eletrodos',
  'chumbo metálico',
  'chumbo metalico',
  'fragmento metálico',
  'fragmento metalico',
  'dispositivo eletrônico',
]

const SEIZURE_PATTERNS = [
  'convulsão',
  'convulsao',
  'epilepsia',
  'crise convulsiva',
  'história de convulsões',
  'historia de convulsoes',
]

const OUT_OF_SCOPE_PATTERNS = [
  'gripe',
  'febre',
  'dor de cabeça',
  'dor de cabeca',
  'pressão alta',
  'pressao alta',
  'diabetes',
  'cancer',
  'câncer',
  'infarto',
  'cirurgia',
  'remédio para',
  'remedio para',
  'como tratar',
  'antibiótico',
  'antibiotico',
  'vacina',
  'dengue',
  'covid',
  'gastroenterite',
  'dor abdominal',
  'alergia alimentar',
  'bronquite',
  'asma',
  'rinite',
]

const DSM5_TEA_A_CITATION: ClinicalCitation = {
  source: 'DSM-5-TR',
  code: 'F84.0',
  title: 'TEA - Critério A',
  section: 'Critérios Diagnósticos',
}
const DSM5_TEA_B_CITATION: ClinicalCitation = {
  source: 'DSM-5-TR',
  code: 'F84.0',
  title: 'TEA - Critério B',
  section: 'Critérios Diagnósticos',
}
const CID11_TEA_CITATION: ClinicalCitation = {
  source: 'CID-11',
  code: '6A02',
  title: 'Transtorno do Espectro do Autismo',
  section: 'Neurodesenvolvimento',
}
const DSM5_TDAH_INATT_CITATION: ClinicalCitation = {
  source: 'DSM-5-TR',
  code: 'F90.0',
  title: 'TDAH - Tipo Desatento',
  section: 'Critérios Diagnósticos',
}
const DSM5_TDAH_HYPER_CITATION: ClinicalCitation = {
  source: 'DSM-5-TR',
  code: 'F90.1',
  title: 'TDAH - Tipo Hiperativo-Impulsivo',
  section: 'Critérios Diagnósticos',
}
const CID11_TDAH_CITATION: ClinicalCitation = {
  source: 'CID-11',
  code: '6A05',
  title: 'Transtorno de Déficit de Atenção e Hiperatividade',
  section: 'Neurodesenvolvimento',
}
const DSM5_DI_CITATION: ClinicalCitation = {
  source: 'DSM-5-TR',
  code: 'F70-F79',
  title: 'Transtornos do Desenvolvimento Intelectual',
  section: 'Critérios Diagnósticos',
}
const CID11_DI_CITATION: ClinicalCitation = {
  source: 'CID-11',
  code: '6A00',
  title: 'Transtorno do Desenvolvimento Intelectual',
  section: 'Neurodesenvolvimento',
}
const MCHAT_CITATION: ClinicalCitation = {
  source: 'M-CHAT-R/F',
  code: 'M-CHAT-R',
  title: 'M-CHAT-R: Triagem Inicial',
  section: 'Protocolo de Triagem',
}
const SNAP_IV_CITATION: ClinicalCitation = {
  source: 'SNAP-IV',
  code: 'SNAP-IV-INTERP',
  title: 'SNAP-IV Interpretação',
  section: 'Interpretação',
}
const TMS_ABS_CITATION: ClinicalCitation = {
  source: 'TMS-Safety',
  code: 'TMS-ABS',
  title: 'EMT/TMS: Contraindicações Absolutas',
  section: 'Contraindicações',
}
const TMS_REL_CITATION: ClinicalCitation = {
  source: 'TMS-Safety',
  code: 'TMS-REL',
  title: 'EMT/TMS: Contraindicações Relativas',
  section: 'Contraindicações Relativas',
}
const CFM_ART4_CITATION: ClinicalCitation = {
  source: 'CFM-2314-2022',
  code: 'CFM-ART-4',
  title: 'Limitações e Responsabilidades',
  section: 'Telemedicina',
}

function matchPatterns(lowerMessage: string, patterns: string[]): string[] {
  return patterns.filter((p) => lowerMessage.includes(p))
}

function classifyInput(message: string): ValidationResult {
  const lower = message.toLowerCase()
  const baseCitations: ClinicalCitation[] = []

  const tmsMatches = matchPatterns(lower, TMS_PATTERNS)
  const implantMatches = matchPatterns(lower, IMPLANT_PATTERNS)
  const seizureMatches = matchPatterns(lower, SEIZURE_PATTERNS)

  if (tmsMatches.length > 0 && implantMatches.length > 0) {
    return {
      category: 'SAFETY_ALERT',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'absolute_contraindication',
      safetyMessage:
        '⚠️ ALERTA DE CONTRAINDICAÇÃO ABSOLUTA: A Estimulação Magnética Transcraniana (EMT/TMS) é ESTRIAMENTE CONTRAINDICADA em pacientes com implantes cocleares, implantes metálicos, marcapassos ou qualquer fragmento metálico na região cefálica. O campo magnético pode deslocar o implante, causar aquecimento tecidual, malfuncionamento do dispositivo e lesões graves. Referência: Protocolo de Segurança TMS.',
      clinicalRationale:
        'Identificada menção simultânea a EMT/TMS e implante/metálico. Cenário de segurança crítica conforme protocolo oficial de segurança TMS exige intervenção imediata.',
      suggestedAction:
        'NÃO prosseguir com EMT/TMS. Encaminhar para avaliação presencial com especialista para avaliação de segurança e alternativas terapêuticas.',
      clinicalCitations: [TMS_ABS_CITATION, CFM_ART4_CITATION],
      telemedicineDisclaimer: true,
    }
  }

  if (tmsMatches.length > 0 && seizureMatches.length > 0) {
    return {
      category: 'SAFETY_ALERT',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'relative_contraindication',
      safetyMessage:
        '⚠️ ALERTA DE CONTRAINDICAÇÃO RELATIVA: História de convulsões/epilepsia é uma contraindicação relativa para EMT/TMS. O campo magnético pode reduzir o limiar convulsivo. Avaliação médica obrigatória para relação risco-benefício antes de qualquer protocolo de estimulação.',
      clinicalRationale:
        'Identificada menção simultânea a EMT/TMS e histórico de convulsões. Contraindicação relativa conforme protocolo de segurança TMS requer avaliação médica prévia.',
      suggestedAction:
        'Suspender protocolo EMT/TMS até avaliação médica especializada. Encaminhar para neurologista para avaliação de risco-benefício.',
      clinicalCitations: [TMS_REL_CITATION, TMS_ABS_CITATION],
      telemedicineDisclaimer: true,
    }
  }

  const outOfScopeMatches = matchPatterns(lower, OUT_OF_SCOPE_PATTERNS)
  const hasNeurodevKeywords =
    matchPatterns(lower, [...TEA_PATTERNS, ...TDAH_PATTERNS, ...DI_PATTERNS]).length > 0

  if (outOfScopeMatches.length > 0 && !hasNeurodevKeywords) {
    return {
      category: 'OUT_OF_SCOPE',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'out_of_scope',
      safetyMessage:
        'Esta solicitação está fora do escopo do NeuroFlow AI, especializado em neurodesenvolvimento (TEA, TDAH e DI) conforme critérios DSM-5-TR e CID-11.',
      clinicalRationale:
        'A consulta não apresenta indicadores de neurodesenvolvimento e refere-se a condição clínica não coberta pelo sistema.',
      suggestedAction:
        'Recomendamos consultar um pediatra ou clínico geral para esta questão. O NeuroFlow AI é focado exclusivamente em triagem de transtornos do neurodesenvolvimento.',
      clinicalCitations: [],
      telemedicineDisclaimer: false,
    }
  }

  const teaMatches = matchPatterns(lower, TEA_PATTERNS)
  const tdahMatches = matchPatterns(lower, TDAH_PATTERNS)
  const diMatches = matchPatterns(lower, DI_PATTERNS)

  if (diMatches.length >= 2) {
    return {
      category: 'DI',
      riskLevel: diMatches.length >= 3 ? 'high' : 'medium',
      scaleSuggestion: 'NONE',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificados ${diMatches.length} indicadores de Transtorno do Desenvolvimento Intelectual (DI): ${diMatches.join(', ')}. Conforme CID-11 (6A00) e DSM-5-TR (F70-F79), os padrões sugerem possível comprometimento do funcionamento intelectual e comportamento adaptativo.`,
      suggestedAction:
        'Encaminhar para avaliação diagnóstica presencial com neuropsicólogo para aplicação de testes cognitivos padronizados (WISC, WAIS) e avaliação adaptativa. A telemedicina serve apenas como triagem inicial.',
      clinicalCitations: [DSM5_DI_CITATION, CID11_DI_CITATION, CFM_ART4_CITATION],
      telemedicineDisclaimer: true,
    }
  }

  if (teaMatches.length >= 2) {
    const criticalCount = teaMatches.filter(
      (m) =>
        m.includes('contato visual') || m.includes('apontar') || m.includes('responde ao nome'),
    ).length

    const riskLevel = criticalCount >= 2 || teaMatches.length >= 3 ? 'high' : 'medium'
    const citations = [DSM5_TEA_A_CITATION, DSM5_TEA_B_CITATION, CID11_TEA_CITATION]
    if (riskLevel === 'high') citations.push(MCHAT_CITATION)

    const criteriaDescription = teaMatches.some(
      (m) =>
        m.includes('contato visual') || m.includes('apontar') || m.includes('responde ao nome'),
    )
      ? 'Déicits em reciprocidade social e comunicação não verbal (Critério A DSM-5-TR)'
      : ''
    const repetitiveDescription = teaMatches.some(
      (m) =>
        m.includes('estereotipia') ||
        m.includes('repetitivos') ||
        m.includes('flapping') ||
        m.includes('alinh'),
    )
      ? 'Padrões restritos e repetitivos de comportamento (Critério B DSM-5-TR)'
      : ''

    const rationale = `Identificados ${teaMatches.length} indicadores de risco para Transtorno do Espectro Autista (TEA): ${teaMatches.join(', ')}. ${criteriaDescription}. ${repetitiveDescription}. Conforme CID-11 (6A02), padrões sugerem possível atraso no desenvolvimento social e comunicativo.`

    return {
      category: 'TEA',
      riskLevel,
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: rationale,
      suggestedAction:
        riskLevel === 'high'
          ? 'Pontuação sugere alto risco. Conforme fluxograma M-CHAT-R/F, encaminhar DIRETAMENTE para avaliação diagnóstica com neuropediatra ou psiquiatra infantil (sem necessidade de follow-up). Diagnóstico definitivo requer avaliação presencial multidisciplinar.'
          : 'Recomenda-se aplicação imediata da escala M-CHAT-R (Modified Checklist for Autism in Toddlers) para triagem estruturada. Conforme fluxograma M-CHAT-R/F, pontuação 3-7 requer aplicação de M-CHAT-R/F (Follow-up Interview). Em caso de risco confirmado, encaminhar para avaliação diagnóstica.',
      clinicalCitations: citations,
      telemedicineDisclaimer: true,
    }
  }

  if (tdahMatches.length >= 2) {
    const riskLevel = tdahMatches.length >= 3 ? 'high' : 'medium'
    const inattentive = tdahMatches.some(
      (m) =>
        m.includes('desaten') ||
        m.includes('foco') ||
        m.includes('concentr') ||
        m.includes('organiza') ||
        m.includes('tarefas') ||
        m.includes('esquece'),
    )
    const hyperactive = tdahMatches.some(
      (m) =>
        m.includes('inquiet') ||
        m.includes('hiper') ||
        m.includes('parado') ||
        m.includes('agitado') ||
        m.includes('interrompe') ||
        m.includes('fala demais'),
    )

    const citations: ClinicalCitation[] = [CID11_TDAH_CITATION]
    if (inattentive) citations.push(DSM5_TDAH_INATT_CITATION)
    if (hyperactive) citations.push(DSM5_TDAH_HYPER_CITATION)
    citations.push(SNAP_IV_CITATION)

    const subtype =
      inattentive && hyperactive ? 'combinado' : inattentive ? 'desatento' : 'hiperativo-impulsivo'

    return {
      category: 'TDAH',
      riskLevel,
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificados ${tdahMatches.length} indicadores de Transtorno de Déficit de Atenção e Hiperatividade (TDAH), subtipo ${subtype}: ${tdahMatches.join(', ')}. Conforme CID-11 (6A05) e DSM-5-TR (F90.0/F90.1), padrões sugerem possível comprometimento nas funções executivas e autorregulação.`,
      suggestedAction:
        'Recomenda-se aplicação da escala SNAP-IV (Swanson, Nolan, and Pelham Rating Scale) para avaliação estruturada. Pontos de corte: média >1.5 sugestivo, >2.0 alto risco. Diagnóstico definitivo requer avaliação presencial multidisciplinar conforme Resolução CFM nº 2.314/2022.',
      clinicalCitations: citations,
      telemedicineDisclaimer: true,
    }
  }

  if (teaMatches.length === 1) {
    return {
      category: 'TEA',
      riskLevel: 'low',
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificado 1 indicador de possível risco para TEA: ${teaMatches[0]}. Recomenda-se monitoramento continuado conforme critérios DSM-5-TR (F84.0).`,
      suggestedAction:
        'Recomenda-se aplicação da escala M-CHAT-R como triagem preventiva e acompanhamento do desenvolvimento. Conforme fluxograma M-CHAT-R/F, pontuação baixa requer apenas monitoramento de rotina.',
      clinicalCitations: [DSM5_TEA_A_CITATION, MCHAT_CITATION],
      telemedicineDisclaimer: true,
    }
  }

  if (tdahMatches.length === 1) {
    return {
      category: 'TDAH',
      riskLevel: 'low',
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificado 1 indicador de possível TDAH: ${tdahMatches[0]}. Recomenda-se monitoramento continuado conforme critérios DSM-5-TR (F90.0).`,
      suggestedAction:
        'Recomenda-se aplicação da escala SNAP-IV como triagem preventiva e acompanhamento do comportamento.',
      clinicalCitations: [DSM5_TDAH_INATT_CITATION, SNAP_IV_CITATION],
      telemedicineDisclaimer: true,
    }
  }

  return {
    category: 'GENERAL',
    riskLevel: null,
    scaleSuggestion: 'NONE',
    safetyFlag: 'none',
    safetyMessage: null,
    clinicalRationale:
      'Não foram identificados indicadores claros de TEA, TDAH ou DI no texto fornecido, conforme critérios DSM-5-TR e CID-11.',
    suggestedAction:
      'Forneça mais detalhes sobre o comportamento, desenvolvimento ou queixas para uma análise mais precisa.',
    clinicalCitations: [],
    telemedicineDisclaimer: false,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      message,
      persist = true,
      testMode = false,
    } = body as { message: string; persist?: boolean; testMode?: boolean }

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message string is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = classifyInput(message)

    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    })
    const supabaseService = createClient(supabaseUrl, supabaseServiceRole)

    let userId: string | null = null
    if (authHeader) {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      if (user) userId = user.id
    }

    const clinicalReferences = result.clinicalCitations.map((c) => ({
      source: c.source,
      code: c.code,
      title: c.title,
      section: c.section,
    }))

    if (persist) {
      let sessionId: string | null = null

      if (userId && !testMode) {
        const { data: session } = await supabaseService
          .from('anamnesis_sessions')
          .insert({
            user_id: userId,
            status: 'validated',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (session) {
          sessionId = session.id
          await supabaseService.from('anamnesis_responses').insert({
            session_id: sessionId,
            question_key: 'neuro_validation_input',
            question_label: 'NeuroFlow AI - Input do Usuário',
            response_value: { message, timestamp: new Date().toISOString() },
          })
        }
      }

      await supabaseService.from('audit_logs').insert({
        user_id: userId,
        action: 'RAG_VALIDATION',
        entity_type: 'ai_response',
        entity_id: sessionId,
        details: {
          input: message,
          classification: result.category,
          riskLevel: result.riskLevel,
          suggestedScale: result.scaleSuggestion,
          safetyFlag: result.safetyFlag,
          safetyMessage: result.safetyMessage,
          clinicalRationale: result.clinicalRationale,
          suggestedAction: result.suggestedAction,
          clinicalReferences,
          telemedicineDisclaimer: result.telemedicineDisclaimer,
          sessionId,
          testMode,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return new Response(JSON.stringify({ result, input: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
