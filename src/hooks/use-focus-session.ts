import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

const FOCUS_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60
const CRYSTAL_INTERVAL = 2 * 60
const AGITATION_THRESHOLD = 90
const MAX_SPIKES_FOR_MASTER = 3

export type SessionPhase = 'focus' | 'break'
export type BioState = 'calm' | 'alert' | 'agitated'

export function useFocusSession() {
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

  const stableTimeRef = useRef(0)
  const spikesRef = useRef(0)
  const bpmRef = useRef(72)
  const energyRef = useRef(72)
  const sessionIdRef = useRef<string | null>(null)
  const phaseRef = useRef<SessionPhase>('focus')
  const mockRef = useRef({ sensor: true, target: 72 })
  const crystalsRef = useRef(0)
  const masterRef = useRef(0)

  const stateLevel: BioState = bpm < 75 ? 'calm' : bpm < AGITATION_THRESHOLD ? 'alert' : 'agitated'

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    mockRef.current = { sensor: mockSensor, target: mockBpmTarget }
  }, [mockSensor, mockBpmTarget])

  useEffect(() => {
    if (!user)
      return supabase
        .from('focus_sessions')
        .insert({ user_id: user.id, settings: { duration: FOCUS_DURATION, mode: 'pomodoro' } })
        .select('id')
        .single()
        .then(({ data }) => data && setSessionId(data.id))
  }, [user])

  const triggerParticles = () => {
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 2500)
  }

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
    try {
      const { data } = await supabase.functions.invoke('calculate-vrc', {
        body: { sessionId: sessionIdRef.current },
      })
      toast({
        title: 'Sessão Concluída!',
        description: data?.vrc
          ? `VRC médio: ${data.vrc.toFixed(2)} ms • ${total} cristais ganhos!`
          : `${total} cristais ganhos!`,
      })
    } catch {
      toast({ title: 'Sessão Concluída!', description: `${total} cristais ganhos!` })
    }
    navigate('/')
  }

  useEffect(() => {
    if (!isActive) return
    if (timeLeft <= 0) {
      setIsActive(false)
      if (phase === 'focus') {
        if (spikesRef.current < MAX_SPIKES_FOR_MASTER) {
          masterRef.current += 1
          setMasterCrystals(masterRef.current)
          triggerParticles()
        }
        setPhase('break')
        setTimeLeft(BREAK_DURATION)
        setTimeout(() => setIsActive(true), 1000)
      } else {
        finalizeSession()
      }
      return
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [isActive, timeLeft, phase])

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
      }
      let en = energyRef.current
      en =
        cur < 80 ? Math.min(100, en + 0.5) : cur >= AGITATION_THRESHOLD ? Math.max(0, en - 1) : en
      setBpm(cur)
      setEnergy(en)
      bpmRef.current = cur
      energyRef.current = en
      if (cur < AGITATION_THRESHOLD) {
        stableTimeRef.current += 1
        if (stableTimeRef.current >= CRYSTAL_INTERVAL) {
          stableTimeRef.current -= CRYSTAL_INTERVAL
          crystalsRef.current += 1
          setCrystals(crystalsRef.current)
          triggerParticles()
        }
      } else {
        spikesRef.current += 1
      }
      supabase
        .from('focus_biofeedback_logs')
        .insert({ session_id: sessionIdRef.current, bpm: cur, vrc: 0 })
        .catch(() => {})
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, phase, sessionId])

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
    mockSensor,
    mockBpmTarget,
    stateLevel,
    setMockSensor,
    setMockBpmTarget,
    toggleActive: () => setIsActive((a) => !a),
    handleCancel,
  }
}
