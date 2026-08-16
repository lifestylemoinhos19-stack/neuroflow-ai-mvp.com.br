import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * Sessão de Foco unificada (NeuroFlow AI).
 *
 * Especificação:
 * - Duração configurável: 3, 5 (padrão) ou 8 minutos.
 * - Cristais automáticos a cada 30s de calma (BPM na zona alvo).
 * - 3 fases progressivas de recompensa (Aquecendo / Foco Leve / Foco Profundo).
 * - Mensagens motivacionais a cada 30s (especiais a cada 60s).
 * - Persistência: 'supabase' (usuário logado) ou 'local' (visitante → localStorage).
 *
 * A diferença entre logado e visitante é APENAS o armazenamento.
 */

export type FocusDurationSec = 180 | 300 | 480
export type PersistenceMode = 'supabase' | 'local'
export type SessionScreen = 'start' | 'active' | 'completed'

export interface RewardPhase {
  phase: 1 | 2 | 3
  name: string
  baseCrystals: number
  description: string
}

export interface FloatingMessage {
  id: number
  text: string
  special: boolean
}

export interface FocusSessionResult {
  durationSec: number
  crystals: number
  masterCrystals: number
  avgBpm: number | null
  startedAt: string
  completedAt: string
  phaseReached: 1 | 2 | 3
}

export interface FocusPersistence {
  mode: PersistenceMode
  userId?: string | null
  guestId?: string
}

const CRYSTAL_INTERVAL_S = 30
const CALM_MAX_BPM = 90 // BPM abaixo disso = dentro da zona alvo (calmo)
const CALM_MIN_BPM = 50
const BASELINE_BPM = 72
const BPM_TICK_MS = 400 // bolha mais responsiva

const GUEST_FOCUS_KEY = 'neuroflow_guest_focus_sessions'

const MOTIVATIONAL_MESSAGES = [
  'Você está calmo há 30 segundos! Continue assim!',
  'Excelente controle! Seu foco está incrível!',
  'A calma traz clareza. Você está no caminho certo!',
  'Seu coração está em harmonia. Mais um cristal!',
  'Respire suavemente. Você está indo muito bem!',
  'Cada respiração te deixa mais focado. Perfeito!',
  'Que paz! Sua mente está serena e atenta.',
  'Mantenha esse ritmo calmo. Você domina!',
]

const SPECIAL_MESSAGES = [
  '1 minuto de pura calma! Você é incrível! 🌟',
  '60 segundos de foco impecável! Continue! ✨',
  'Um minuto inteiro de harmonia. Orgulhe-se! 💎',
  'Sua constância é admirável! Mais um minuto! 🌈',
]

export function getRewardPhase(elapsedSec: number): RewardPhase {
  if (elapsedSec < 60) {
    return { phase: 1, name: 'Aquecendo', baseCrystals: 1, description: '1 cristal a cada 30s' }
  }
  if (elapsedSec < 180) {
    return {
      phase: 2,
      name: 'Foco Leve',
      baseCrystals: 2,
      description: '2 cristais a cada 30s (+1 bônus)',
    }
  }
  return {
    phase: 3,
    name: 'Foco Profundo',
    baseCrystals: 3,
    description: '3 cristais a cada 30s (+2 bônus) + cristal mestre',
  }
}

export interface GuestFocusEntry {
  id: string
  started_at: string
  completed_at: string | null
  crystals: number
  master_crystals: number
  duration_sec: number
  avg_bpm: number | null
}

export function readGuestFocusSessions(): GuestFocusEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_FOCUS_KEY)
    return raw ? (JSON.parse(raw) as GuestFocusEntry[]) : []
  } catch {
    return []
  }
}

export function saveGuestFocusSession(entry: GuestFocusEntry) {
  const list = readGuestFocusSessions()
  list.unshift(entry)
  localStorage.setItem(GUEST_FOCUS_KEY, JSON.stringify(list.slice(0, 50)))
}

// --- Áudio (Web Audio API) -------------------------------------------------

let sharedAudioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedAudioCtx) sharedAudioCtx = new Ctor()
    if (sharedAudioCtx.state === 'suspended') void sharedAudioCtx.resume()
    return sharedAudioCtx
  } catch {
    return null
  }
}

function playCrystalChime() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // Duas notas brilhantes (dó + sol agudo) — sensação de "cristal".
  const notes = [880, 1320]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.08
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.4)
  })
}

function playMasterChime() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [660, 880, 1320, 1760]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = now + i * 0.12
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.65)
  })
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* ignora se não suportado */
  }
}

// --- Hook ------------------------------------------------------------------

export interface UseFocusSessionV2Options {
  durationSec: FocusDurationSec
  persistence: FocusPersistence
}

export function useFocusSessionV2({ durationSec, persistence }: UseFocusSessionV2Options) {
  const [screen, setScreen] = useState<SessionScreen>('start')
  const [timeLeft, setTimeLeft] = useState<number>(durationSec)
  const [elapsed, setElapsed] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [bpm, setBpm] = useState(BASELINE_BPM)
  const [energy, setEnergy] = useState(70)
  const [crystals, setCrystals] = useState(0)
  const [masterCrystals, setMasterCrystals] = useState(0)
  const [calmSeconds, setCalmSeconds] = useState(0)
  const [floatingMessage, setFloatingMessage] = useState<FloatingMessage | null>(null)
  const [showParticles, setShowParticles] = useState(false)
  const [crystalPulse, setCrystalPulse] = useState(0)
  const [phaseFlash, setPhaseFlash] = useState(false)
  const [result, setResult] = useState<FocusSessionResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const bpmRef = useRef(BASELINE_BPM)
  const energyRef = useRef(70)
  const crystalsRef = useRef(0)
  const masterRef = useRef(0)
  const calmRef = useRef(0)
  const elapsedRef = useRef(0)
  const timeLeftRef = useRef<number>(durationSec)
  const startedAtRef = useRef<string | null>(null)
  const bpmLogRef = useRef<number[]>([])
  const msgIdRef = useRef(0)
  const lastPhaseRef = useRef<1 | 2 | 3>(1)
  const persistenceRef = useRef(persistence)
  const durationRef = useRef<number>(durationSec)
  const screenRef = useRef<SessionScreen>('start')

  useEffect(() => {
    persistenceRef.current = persistence
  }, [persistence])
  useEffect(() => {
    durationRef.current = durationSec
  }, [durationSec])
  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  const phase = getRewardPhase(elapsed)
  const nextCrystalIn = Math.max(0, CRYSTAL_INTERVAL_S - calmSeconds)
  const inZone = bpm >= CALM_MIN_BPM && bpm < CALM_MAX_BPM
  const isCalm = bpm < CALM_MAX_BPM
  const overallProgress = durationSec > 0 ? Math.min(100, (elapsed / durationSec) * 100) : 0

  const showMessage = useCallback((text: string, special: boolean) => {
    msgIdRef.current += 1
    const msg: FloatingMessage = { id: msgIdRef.current, text, special }
    setFloatingMessage(msg)
    window.setTimeout(() => {
      setFloatingMessage((cur) => (cur && cur.id === msg.id ? null : cur))
    }, 3200)
  }, [])

  const triggerParticles = useCallback(() => {
    setShowParticles(true)
    window.setTimeout(() => setShowParticles(false), 2600)
  }, [])

  const awardCrystals = useCallback(() => {
    const ph = getRewardPhase(elapsedRef.current)
    const amount = ph.baseCrystals
    crystalsRef.current += amount
    setCrystals(crystalsRef.current)
    setCrystalPulse((p) => p + 1)
    triggerParticles()
    playCrystalChime()
    vibrate([30, 20, 30])

    // Mensagem motivacional (especial a cada 60s).
    const secs = elapsedRef.current
    if (secs > 0 && secs % 60 === 0) {
      showMessage(SPECIAL_MESSAGES[Math.floor(Math.random() * SPECIAL_MESSAGES.length)], true)
    } else {
      showMessage(
        MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
        false,
      )
    }
  }, [showMessage, triggerParticles])

  // Tick de BPM (mais rápido → bolha responsiva).
  useEffect(() => {
    if (screen !== 'active') return
    const id = window.setInterval(() => {
      // Simulação suave em torno do baseline (convida à calma).
      const cur = bpmRef.current
      const next = Math.max(
        58,
        Math.min(98, Math.round(cur + (BASELINE_BPM - cur) * 0.15 + (Math.random() * 5 - 2.5))),
      )
      bpmRef.current = next
      setBpm(next)
      bpmLogRef.current.push(next)
      if (bpmLogRef.current.length > 120) bpmLogRef.current.shift()

      // Energia: sobe quando calmo, desce quando agitado.
      let en = energyRef.current
      en = next < CALM_MAX_BPM ? Math.min(100, en + 0.8) : Math.max(10, en - 1.2)
      energyRef.current = en
      setEnergy(en)
    }, BPM_TICK_MS)
    return () => window.clearInterval(id)
  }, [screen])

  // Tick principal (1s): tempo, calma acumulada, cristais, fases.
  useEffect(() => {
    if (screen !== 'active') return
    const id = window.setInterval(() => {
      // Tempo
      elapsedRef.current += 1
      timeLeftRef.current = Math.max(0, durationRef.current - elapsedRef.current)
      setElapsed(elapsedRef.current)
      setTimeLeft(timeLeftRef.current)

      // Transição de fase (flash suave)
      const ph = getRewardPhase(elapsedRef.current)
      if (ph.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = ph.phase
        setPhaseFlash(true)
        window.setTimeout(() => setPhaseFlash(false), 900)
        showMessage(`Fase ${ph.phase}: ${ph.name}! ${ph.description}`, true)
      }

      // Calma acumulada → cristal a cada 30s
      const curBpm = bpmRef.current
      const calm = curBpm >= CALM_MIN_BPM && curBpm < CALM_MAX_BPM
      if (calm) {
        calmRef.current += 1
        setCalmSeconds(calmRef.current)
        if (calmRef.current >= CRYSTAL_INTERVAL_S) {
          calmRef.current = 0
          setCalmSeconds(0)
          awardCrystals()
        }
      } else {
        // Fora da zona: reinicia contagem de calma (estímulo a voltar).
        if (calmRef.current > 0) {
          calmRef.current = 0
          setCalmSeconds(0)
        }
      }

      // Fim da sessão
      if (timeLeftRef.current <= 0) {
        finalizeSession()
      }
    }, 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  const finalizeSession = useCallback(() => {
    const completedAt = new Date().toISOString()
    const startedAt = startedAtRef.current || completedAt
    const bpms = bpmLogRef.current
    const avgBpm = bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : null
    const ph = getRewardPhase(elapsedRef.current)

    // Cristal mestre ao concluir a fase 3 (foco profundo) com alguma calma.
    if (ph.phase === 3) {
      masterRef.current += 1
      setMasterCrystals(masterRef.current)
      playMasterChime()
      vibrate([60, 40, 60, 40, 120])
      triggerParticles()
    }

    const res: FocusSessionResult = {
      durationSec: durationRef.current as FocusDurationSec,
      crystals: crystalsRef.current,
      masterCrystals: masterRef.current,
      avgBpm,
      startedAt,
      completedAt,
      phaseReached: ph.phase,
    }
    setResult(res)
    setIsActive(false)
    setScreen('completed')
    screenRef.current = 'completed'

    // Persistência (logado → Supabase, visitante → localStorage).
    void persistResult(res)
  }, [triggerParticles])

  const persistResult = useCallback(async (res: FocusSessionResult) => {
    const p = persistenceRef.current
    setIsSaving(true)
    try {
      if (p.mode === 'supabase' && p.userId) {
        await supabase.from('focus_sessions').insert({
          user_id: p.userId,
          status: 'completed',
          started_at: res.startedAt,
          completed_at: res.completedAt,
          crystals_earned: res.crystals,
          master_crystals: res.masterCrystals,
          capture_method: 'mock_biofeedback',
          settings: {
            duration: res.durationSec,
            mode: 'unified_focus',
            phase_reached: res.phaseReached,
            avg_bpm: res.avgBpm,
          },
        })
      } else {
        // Visitante → localStorage
        const guestId = p.guestId || `guest_${Date.now()}`
        const entry: GuestFocusEntry = {
          id: `${guestId}_${Date.now()}`,
          started_at: res.startedAt,
          completed_at: res.completedAt,
          crystals: res.crystals,
          master_crystals: res.masterCrystals,
          duration_sec: res.durationSec,
          avg_bpm: res.avgBpm,
        }
        saveGuestFocusSession(entry)
      }
    } catch (err) {
      console.warn('[useFocusSessionV2] falha ao salvar sessão:', err)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const start = useCallback(() => {
    // Reset
    bpmRef.current = BASELINE_BPM
    energyRef.current = 70
    crystalsRef.current = 0
    masterRef.current = 0
    calmRef.current = 0
    elapsedRef.current = 0
    timeLeftRef.current = durationRef.current
    bpmLogRef.current = []
    lastPhaseRef.current = 1

    setBpm(BASELINE_BPM)
    setEnergy(70)
    setCrystals(0)
    setMasterCrystals(0)
    setCalmSeconds(0)
    setElapsed(0)
    setTimeLeft(durationRef.current)
    setResult(null)
    setFloatingMessage(null)
    setShowParticles(false)

    startedAtRef.current = new Date().toISOString()
    setIsActive(true)
    setScreen('active')
    screenRef.current = 'active'

    // Inicia o contexto de áudio dentro do gesto do usuário.
    getAudioCtx()
  }, [])

  const pause = useCallback(() => setIsActive(false), [])
  const resume = useCallback(() => setIsActive(true), [])

  const repeat = useCallback(() => {
    setScreen('start')
    screenRef.current = 'start'
    setIsActive(false)
  }, [])

  return {
    screen,
    isActive,
    timeLeft,
    elapsed,
    bpm,
    energy,
    crystals,
    masterCrystals,
    calmSeconds,
    nextCrystalIn,
    inZone,
    isCalm,
    phase,
    overallProgress,
    floatingMessage,
    showParticles,
    crystalPulse,
    phaseFlash,
    result,
    isSaving,
    durationSec,
    totalCrystals: crystals + masterCrystals,
    start,
    pause,
    resume,
    repeat,
  }
}
