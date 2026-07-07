export type SimulationMode = 'real' | 'simulation'
export type EventType = 'info' | 'warning' | 'ok' | 'error'

export interface GameEvent {
  id: number
  type: EventType
  message: string
  timestamp: number
}

export interface GameControllerState {
  bpm: number
  energy: number
  balloonOffset: number
  isActive: boolean
  simulationMode: SimulationMode
  stabilitySeconds: number
  canCollectCrystal: boolean
  crystals: number
  events: GameEvent[]
  biometricConnected: boolean
}

export const WATCHDOG_TIMEOUT_MS = 5000
export const CRYSTAL_INTERVAL_S = 30
export const STABILITY_MIN_BPM = 60
export const STABILITY_MAX_BPM = 85
export const BASELINE_BPM = 72

const MAX_EVENTS = 12

export class GameController {
  private bpm = BASELINE_BPM
  private energy = 100
  private balloonOffset = 0
  private isActive = false
  private simulationMode: SimulationMode = 'real'
  private externalBpm: number | null = null
  private biometricConnected = false
  private lastExternalBpmTime = 0
  private intervalId: ReturnType<typeof setInterval> | null = null
  private stabilitySeconds = 0
  private canCollectCrystal = false
  private crystals = 0
  private events: GameEvent[] = []
  private eventIdCounter = 0
  private listeners = new Set<(state: GameControllerState) => void>()
  private simPhase = 0
  private lastTickTime = 0

  private logEvent(type: EventType, message: string): void {
    this.events.unshift({ id: this.eventIdCounter++, type, message, timestamp: Date.now() })
    if (this.events.length > MAX_EVENTS) this.events = this.events.slice(0, MAX_EVENTS)
  }

  private calculateEnergy(bpm: number): number {
    return Math.max(10, Math.min(100, 100 - Math.abs(bpm - BASELINE_BPM) * 2.5))
  }

  private calculateBalloonOffset(bpm: number): number {
    return Math.max(-20, Math.min(20, (BASELINE_BPM - bpm) * 0.8))
  }

  private checkWatchdog(): void {
    if (this.simulationMode === 'simulation') {
      if (
        this.externalBpm !== null &&
        Date.now() - this.lastExternalBpmTime < WATCHDOG_TIMEOUT_MS
      ) {
        this.simulationMode = 'real'
        this.logEvent('ok', 'Dados biometricos restaurados')
      }
      return
    }
    if (this.externalBpm === null || Date.now() - this.lastExternalBpmTime > WATCHDOG_TIMEOUT_MS) {
      this.simulationMode = 'simulation'
      this.logEvent('warning', 'Modo Simulacao ativado (watchdog)')
    }
  }

  private generateSimBpm(): number {
    this.simPhase += 0.15
    const mid = (68 + 75) / 2
    const amp = (75 - 68) / 2
    return Math.round(mid + amp * Math.sin(this.simPhase))
  }

  private updateStability(bpm: number, deltaMs: number): void {
    const isStable = bpm >= STABILITY_MIN_BPM && bpm <= STABILITY_MAX_BPM
    if (!isStable) {
      this.stabilitySeconds = 0
      this.canCollectCrystal = false
      return
    }
    this.stabilitySeconds += deltaMs / 1000
    if (this.stabilitySeconds >= CRYSTAL_INTERVAL_S && !this.canCollectCrystal) {
      this.canCollectCrystal = true
      this.logEvent('info', 'Cristal disponivel para coleta!')
    }
  }

  getState(): GameControllerState {
    return {
      bpm: this.bpm,
      energy: Math.round(this.energy),
      balloonOffset: this.balloonOffset,
      isActive: this.isActive,
      simulationMode: this.simulationMode,
      stabilitySeconds: Math.floor(this.stabilitySeconds),
      canCollectCrystal: this.canCollectCrystal,
      crystals: this.crystals,
      events: [...this.events],
      biometricConnected: this.biometricConnected,
    }
  }

  setExternalBpm(bpm: number | null): void {
    if (bpm === null || Number.isNaN(bpm)) return
    this.externalBpm = bpm
    this.lastExternalBpmTime = Date.now()
    if (this.simulationMode === 'simulation') {
      this.simulationMode = 'real'
      this.logEvent('ok', `BPM real detectado: ${bpm}`)
    }
  }

  setBiometricConnected(connected: boolean): void {
    if (connected !== this.biometricConnected) {
      this.biometricConnected = connected
      this.logEvent(
        connected ? 'ok' : 'warning',
        connected ? 'Sensor conectado' : 'Sensor desconectado',
      )
    }
  }

  collectCrystal(): void {
    if (!this.canCollectCrystal) return
    this.crystals += 1
    this.canCollectCrystal = false
    this.stabilitySeconds = 0
    this.logEvent('ok', `Cristal coletado! Total: ${this.crystals}`)
    this.notify()
  }

  toggleSimulation(): void {
    this.simulationMode = this.simulationMode === 'real' ? 'simulation' : 'real'
    this.logEvent(
      this.simulationMode === 'simulation' ? 'warning' : 'info',
      `Modo ${this.simulationMode === 'simulation' ? 'Simulacao' : 'Real'} ativado (manual)`,
    )
    this.notify()
  }

  start(): void {
    if (this.isActive) return
    this.isActive = true
    this.lastTickTime = Date.now()
    this.logEvent('info', 'Sessao de foco iniciada')
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = setInterval(() => {
      const now = Date.now()
      const delta = now - this.lastTickTime
      this.lastTickTime = now
      this.checkWatchdog()
      let newBpm: number
      if (this.simulationMode === 'simulation') {
        newBpm = this.generateSimBpm()
      } else if (
        this.externalBpm !== null &&
        now - this.lastExternalBpmTime < WATCHDOG_TIMEOUT_MS
      ) {
        newBpm = this.externalBpm
      } else {
        newBpm = this.generateSimBpm()
        this.simulationMode = 'simulation'
      }
      this.bpm = Math.max(40, Math.min(180, newBpm))
      this.energy = this.calculateEnergy(this.bpm)
      this.balloonOffset = this.calculateBalloonOffset(this.bpm)
      this.updateStability(this.bpm, delta)
      this.notify()
    }, 1000)
    this.notify()
  }

  stop(): void {
    this.isActive = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.notify()
  }

  subscribe(listener: (state: GameControllerState) => void): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    const state = this.getState()
    this.listeners.forEach((l) => l(state))
  }

  dispose(): void {
    this.stop()
    this.listeners.clear()
  }
}
