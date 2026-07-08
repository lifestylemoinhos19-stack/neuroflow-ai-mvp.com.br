import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

const FOCUS_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60
const CRYSTAL_INTERVAL = 30
const STABILITY_DURATION_REQUIRED = 30
const CALM_THRESHOLD = 70
const AGITATION_THRESHOLD = 90
const STABILITY_SDNN_THRESHOLD = 15
const AGITATION_ADAPTIVE_THRESHOLD = 60

export type SessionPhase = 'focus' | 'break'
export type BioState = 'calm' | 'alert' | 'agitated'

export function useFocusSession(captureMethod: string = 'camera_rppg') {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION)
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<SessionPhase>('focus')
  const [bpm, setBpm] = useState(72)
  const [energy, setEnergy] = useState(72)
  const [crystals, setCrystals] = useState(0)
  const [masterCrystals, setMasterCrystals] = useState(0)
  const [showParticles, setShowParticles] = useState(false)
  const [mockSensor, setMockSensor] = useState(true)
  const [mockBpmTarget, setMockBpmTarget] = useState(72)
  const [externalBpm, setExternalBpm] = useState<number | null>(null)

  const stableTimeRef = useRef(0)
  const stableDurationRef = useRef(0)
  const spikesRef = useRef(0)
  const bpmRef = useRef(72)
  const energyRef = useRef(72)
  const sessionIdRef = useRef<string | null>(null)
  const mockRef = useRef({ sensor: true, target: 72 })
  const crystalsRef = useRef(0)
  const masterRef = useRef(0)
  const externalBpmRef = useRef<number | null>(null)
  const bpmHistoryRef = useRef<number[]>([])
  const agitationStreakRef = useRef(0)
  const prolongedAgitationRef = useRef(false)
  const [prolongedAgitation, setProlongedAgitation] = useState(false)

  const stateLevel: BioState =
    bpm < CALM_THRESHOLD ? 'calm' : bpm < AGITATION_THRESHOLD ? 'alert' : 'agitated'

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])
  useEffect(() => {
    mockRef.current = { sensor: mockSensor, target: mockBpmTarget }
  }, [mockSensor, mockBpmTarget])
  useEffect(() => {
    externalBpmRef.current = externalBpm
  }, [externalBpm])

  useEffect(() => {
    if (!user) return
    let mounted = true
    supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        settings: { duration: FOCUS_DURATION, mode: 'pomodoro' },
        capture_method: captureMethod,
      })
      .select('id')
      .single()
      .then(({ data }) => {
        if (data && mounted) setSessionId(data.id)
      })
    return () => {
      mounted = false
    }
  }, [user])

  const triggerParticles = useCallback(() => {
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 2800)
  }, [])

  const calculateSDNN = useCallback(() => {
    const h = bpmHistoryRef.current
    if (h.length < 2) return 0
    const mean = h.reduce((a, b) => a + b, 0) / h.length
    const variance = h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length
    return Math.sqrt(variance)
  }, [])

  const processBiofeedback = useCallback(
    (curBpm: number, sdnn: number) => {
      bpmRef.current = curBpm
      setBpm(curBpm)
      let en = energyRef.current
      en =
        curBpm < CALM_THRESHOLD
          ? Math.min(100, en + 0.5)
          : curBpm >= AGITATION_THRESHOLD
            ? Math.max(0, en - 1)
            : en
      setEnergy(en)
      energyRef.current = en
      const isStable = curBpm < AGITATION_THRESHOLD && sdnn < STABILITY_SDNN_THRESHOLD
      if (isStable) {
        stableDurationRef.current += 1
        if (agitationStreakRef.current > 0) {
          agitationStreakRef.current = 0
          prolongedAgitationRef.current = false
          setProlongedAgitation(false)
        }
        if (stableDurationRef.current >= STABILITY_DURATION_REQUIRED) {
          stableTimeRef.current += 1
        }
      } else {
        stableDurationRef.current = 0
        if (curBpm >= AGITATION_THRESHOLD) {
          stableTimeRef.current = 0
          spikesRef.current += 1
          agitationStreakRef.current += 1
          if (
            agitationStreakRef.current >= AGITATION_ADAPTIVE_THRESHOLD &&
            !prolongedAgitationRef.current
          ) {
            prolongedAgitationRef.current = true
            setProlongedAgitation(true)
          }
        }
      }
    },
    [triggerParticles],
  )

  useEffect(() => {
    if (!sessionId) return
    const channel = supabase
      .channel(`biofeedback:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'focus_biofeedback_logs',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const log = payload.new as { bpm: number | null; vrc: number | null }
          if (log.bpm === null || log.bpm === undefined) return
          processBiofeedback(log.bpm, log.vrc ?? 0)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, processBiofeedback])

  useEffect(() => {
    if (!isActive || phase !== 'focus' || !sessionId) return
    const interval = setInterval(() => {
      let cur = bpmRef.current
      if (mockRef.current.sensor) {
        cur = Math.max(
          50,
          Math.min(
            150,
            Math.round(cur + (mockRef.current.target - cur) * 0.2 + (Math.random() * 4 - 2)),
          ),
        )
      } else if (externalBpmRef.current !== null) {
        cur = externalBpmRef.current
      }
      bpmHistoryRef.current.push(cur)
      if (bpmHistoryRef.current.length > 30) bpmHistoryRef.current.shift()
      const sdnn = calculateSDNN()
      supabase
        .from('focus_biofeedback_logs')
        .insert({ session_id: sessionIdRef.current, bpm: cur, vrc: sdnn })
        .then(() => {})
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, phase, sessionId, calculateSDNN])

  const finalizeSession = async () => {
    if (!sessionIdRef.current) return
    const total = crystalsRef.current + masterRef.current
    await supabase
      .from('focus_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        crystals_earned: crystalsRef.current,
        master_crystals: masterRef.current,
      })
      .eq('id', sessionIdRef.current)
    let vrcValue: number | undefined
    try {
      const { data } = await supabase.functions.invoke('calculate-vrc', {
        body: { sessionId: sessionIdRef.current },
      })
      if (data?.vrc !== undefined) {
        vrcValue = data.vrc
        await supabase
          .from('focus_sessions')
          .update({ vrc: data.vrc })
          .eq('id', sessionIdRef.current)
      }
      toast({
        title: 'Sessão Concluída!',
        description: data?.vrc
          ? `VRC médio: ${data.vrc.toFixed(2)} ms • ${total} cristais!`
          : `${total} cristais!`,
      })
    } catch {
      toast({ title: 'Sessão Concluída!', description: `${total} cristais!` })
    }
    navigate('/session-summary', {
      state: {
        sessionId: sessionIdRef.current,
        crystals: crystalsRef.current,
        masterCrystals: masterRef.current,
        vrc: vrcValue,
      },
    })
  }

  useEffect(() => {
    if (!isActive) return
    if (timeLeft <= 0) {
      setIsActive(false)
      if (phase === 'focus') {
        if (spikesRef.current === 0) {
          masterRef.current += 1
          setMasterCrystals(masterRef.current)
          triggerParticles()
          supabase
            .from('focus_sessions')
            .update({
              master_crystals: masterRef.current,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionIdRef.current)
            .then(() => {})
        }
        toast({
          title: 'Bloco de Foco Concluído!',
          description: 'Hora da pausa. Respire fundo e relaxe por 5 minutos.',
        })
        setPhase('break')
        setTimeLeft(BREAK_DURATION)
        setTimeout(() => setIsActive(true), 1000)
      } else {
        toast({
          title: 'Pausa Concluída!',
          description: 'Sessão finalizada. Calculando métricas...',
        })
        finalizeSession()
      }
      return
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [isActive, timeLeft, phase])

  const addCrystal = useCallback(() => {
    crystalsRef.current += 1
    setCrystals(crystalsRef.current)
    supabase
      .from('focus_sessions')
      .update({
        crystals_earned: crystalsRef.current,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionIdRef.current)
      .then(() => {})
  }, [])

  const handleCancel = async () => {
    setIsActive(false)
    if (sessionIdRef.current) {
      await supabase
        .from('focus_sessions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          crystals_earned: crystalsRef.current,
          master_crystals: masterRef.current,
        })
        .eq('id', sessionIdRef.current)
    }
    navigate('/')
  }

  return {
    timeLeft,
    isActive,
    phase,
    bpm,
    energy,
    crystals,
    masterCrystals,
    showParticles,
    prolongedAgitation,
    mockSensor,
    mockBpmTarget,
    stateLevel,
    setMockSensor,
    setMockBpmTarget,
    setExternalBpm,
    toggleActive: () => {
      if (!isActive) {
        toast({
          title: phase === 'focus' ? 'Foco Iniciado!' : 'Pausa Iniciada!',
          description:
            phase === 'focus'
              ? 'Mantenha a calma para ganhar cristais.'
              : 'Respire fundo e relaxe.',
        })
      }
      setIsActive((a) => !a)
    },
    addCrystal,
    handleCancel,
  }
}
