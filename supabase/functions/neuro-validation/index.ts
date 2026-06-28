import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type SafetyFlag = 'none' | 'absolute_contraindication' | 'out_of_scope'
type Category = 'TEA' | 'TDAH' | 'SAFETY_ALERT' | 'OUT_OF_SCOPE' | 'GENERAL'
type ScaleSuggestion = 'M-CHAT-R' | 'SNAP-IV' | 'NONE'

interface ValidationResult {
  category: Category
  riskLevel: 'low' | 'medium' | 'high' | null
  scaleSuggestion: ScaleSuggestion
  safetyFlag: SafetyFlag
  safetyMessage: string | null
  clinicalRationale: string
  suggestedAction: string
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
  'criança de 2 anos',
  'crianca de 2 anos',
  'criança de 3 anos',
  'crianca de 3 anos',
  'atraso de fala',
  'sem linguagem',
  'não verbal',
  'nao verbal',
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

function matchPatterns(lowerMessage: string, patterns: string[]): string[] {
  return patterns.filter((p) => lowerMessage.includes(p))
}

function classifyInput(message: string): ValidationResult {
  const lower = message.toLowerCase()

  const tmsMatches = matchPatterns(lower, TMS_PATTERNS)
  const implantMatches = matchPatterns(lower, IMPLANT_PATTERNS)

  if (tmsMatches.length > 0 && implantMatches.length > 0) {
    return {
      category: 'SAFETY_ALERT',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'absolute_contraindication',
      safetyMessage:
        '⚠️ ALERTA DE CONTRAINDICAÇÃO ABSOLUTA: A Estimulação Magnética Transcraniana (EMT/TMS) é ESTITAMENTE CONTRAINDICADA em pacientes com implantes cocleares, implantes metálicos, marcapassos ou qualquer fragmento metálico na região cefálica. O campo magnético pode deslocar o implante, causar aquecimento tecidual, malfuncionamento do dispositivo e lesões graves.',
      clinicalRationale:
        'Identificada menção simultânea a EMT/TMS e implante/metálico. Este é um cenário de segurança crítica que exige intervenção imediata.',
      suggestedAction:
        'NÃO prosseguir com EMT/TMS. Encaminhar para avaliação presencial com especialista para avaliação de segurança e alternativas terapêuticas.',
    }
  }

  const outOfScopeMatches = matchPatterns(lower, OUT_OF_SCOPE_PATTERNS)
  const hasNeurodevKeywords = matchPatterns(lower, [...TEA_PATTERNS, ...TDAH_PATTERNS]).length > 0

  if (outOfScopeMatches.length > 0 && !hasNeurodevKeywords) {
    return {
      category: 'OUT_OF_SCOPE',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'out_of_scope',
      safetyMessage:
        'Esta solicitação está fora do escopo do NeuroFlow AI, que é especializado em neurodesenvolvimento (TEA e TDAH).',
      clinicalRationale:
        'A consulta não apresenta indicadores de neurodesenvolvimento e refere-se a condição clínica não coberta pelo sistema.',
      suggestedAction:
        'Recomendamos consultar um pediatra ou clínico geral para esta questão. O NeuroFlow AI é focado exclusivamente em triagem de transtornos do neurodesenvolvimento.',
    }
  }

  const teaMatches = matchPatterns(lower, TEA_PATTERNS)
  const tdahMatches = matchPatterns(lower, TDAH_PATTERNS)

  if (teaMatches.length >= 2) {
    const criticalCount = teaMatches.filter(
      (m) =>
        m.includes('contato visual') || m.includes('apontar') || m.includes('responde ao nome'),
    ).length

    const riskLevel = criticalCount >= 2 || teaMatches.length >= 3 ? 'high' : 'medium'

    return {
      category: 'TEA',
      riskLevel,
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificados ${teaMatches.length} indicadores de risco para Transtorno do Espectro Autista (TEA): ${teaMatches.join(', ')}. Padrões identificados sugerem possível atraso no desenvolvimento social e comunicativo.`,
      suggestedAction:
        'Recomenda-se a aplicação imediata da escala M-CHAT-R (Modified Checklist for Autism in Toddlers) para triagem estruturada. Em caso de pontuação de risco, encaminhar para avaliação diagnóstica com neuropediatra ou psiquiatra infantil.',
    }
  }

  if (tdahMatches.length >= 2) {
    const riskLevel = tdahMatches.length >= 3 ? 'high' : 'medium'

    return {
      category: 'TDAH',
      riskLevel,
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificados ${tdahMatches.length} indicadores de Transtorno de Déficit de Atenção e Hiperatividade (TDAH): ${tdahMatches.join(', ')}. Padrões identificados sugerem possível comprometimento nas funções executivas e autorregulação.`,
      suggestedAction:
        'Recomenda-se a aplicação da escala SNAP-IV (Swanson, Nolan, and Pelham Rating Scale) para avaliação estruturada dos sintomas de desatenção e hiperatividade. Em caso de indicadores significativos, encaminhar para avaliação com neuropediatra ou psicólogo especializado.',
    }
  }

  if (teaMatches.length === 1) {
    return {
      category: 'TEA',
      riskLevel: 'low',
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificado 1 indicador de possível risco para TEA: ${teaMatches[0]}. Recomenda-se monitoramento continuado.`,
      suggestedAction:
        'Recomenda-se aplicação da escala M-CHAT-R como triagem preventiva e acompanhamento do desenvolvimento.',
    }
  }

  if (tdahMatches.length === 1) {
    return {
      category: 'TDAH',
      riskLevel: 'low',
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
      safetyMessage: null,
      clinicalRationale: `Identificado 1 indicador de possível TDAH: ${tdahMatches[0]}. Recomenda-se monitoramento continuado.`,
      suggestedAction:
        'Recomenda-se aplicação da escala SNAP-IV como triagem preventiva e acompanhamento do comportamento.',
    }
  }

  return {
    category: 'GENERAL',
    riskLevel: null,
    scaleSuggestion: 'NONE',
    safetyFlag: 'none',
    safetyMessage: null,
    clinicalRationale:
      'Não foram identificados indicadores claros de TEA ou TDAH no texto fornecido.',
    suggestedAction:
      'Forneça mais detalhes sobre o comportamento, desenvolvimento ou queixas para uma análise mais precisa.',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { message, persist = true } = body as { message: string; persist?: boolean }

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

    if (persist) {
      let sessionId: string | null = null

      if (userId) {
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
          sessionId,
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
