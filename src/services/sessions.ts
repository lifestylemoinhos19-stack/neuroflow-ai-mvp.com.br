import { supabase } from '@/lib/supabase/client'
import {
  mchatQuestions,
  snapivQuestions,
  getMChatRiskLevel,
  getSnapivRiskLevel,
} from '@/lib/scales-data'

export interface SessionWithRisk {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  riskLevel: 'low' | 'medium' | 'high' | null
  mchatScore: number | null
  snapivInattention: number | null
  snapivHyperactivity: number | null
  responseCount: number
}

export async function getUserSessions(): Promise<SessionWithRisk[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: sessions, error } = await supabase
    .from('anamnesis_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !sessions) return []

  const results = await Promise.all(sessions.map(calculateSessionRisk))
  return results
}

async function calculateSessionRisk(session: any): Promise<SessionWithRisk> {
  const { data: responses, error } = await supabase.rpc('get_session_responses_decrypted', {
    p_session_id: session.id,
  })

  if (error || !responses) {
    return {
      ...session,
      riskLevel: null,
      mchatScore: null,
      snapivInattention: null,
      snapivHyperactivity: null,
      responseCount: 0,
    }
  }

  let mchatScore: number | null = null
  let snapivInattention: number | null = null
  let snapivHyperactivity: number | null = null
  let riskLevel: 'low' | 'medium' | 'high' | null = null

  const mchatResp = responses.filter((r: any) => r.question_key?.startsWith('mchat_'))
  if (mchatResp.length > 0) {
    mchatScore = mchatResp.reduce((acc: number, r: any) => {
      const q = mchatQuestions.find((mq) => mq.key === r.question_key)
      if (!q) return acc
      const val = parseValue(r.response_value)
      return val === q.riskAnswer ? acc + 1 : acc
    }, 0)
    riskLevel = getMChatRiskLevel(mchatScore)
  }

  const snapivResp = responses.filter((r: any) => r.question_key?.startsWith('snapiv_'))
  if (snapivResp.length > 0) {
    const inatt = snapivResp.filter((r: any) => {
      const q = snapivQuestions.find((sq) => sq.key === r.question_key)
      return q?.subscale === 'inattention'
    })
    const hyper = snapivResp.filter((r: any) => {
      const q = snapivQuestions.find((sq) => sq.key === r.question_key)
      return q?.subscale === 'hyperactivity'
    })
    snapivInattention = avg(inatt)
    snapivHyperactivity = avg(hyper)
    if (!riskLevel) {
      const maxAvg = Math.max(snapivInattention, snapivHyperactivity)
      riskLevel = getSnapivRiskLevel(maxAvg)
    }
  }

  return {
    ...session,
    riskLevel,
    mchatScore,
    snapivInattention,
    snapivHyperactivity,
    responseCount: responses.length,
  }
}

function avg(arr: any[]): number {
  if (arr.length === 0) return 0
  const sum = arr.reduce((acc, r) => acc + parseValue(r.response_value), 0)
  return sum / arr.length
}

function parseValue(val: any): any {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }
  return val
}
