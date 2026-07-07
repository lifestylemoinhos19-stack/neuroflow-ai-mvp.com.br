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
const ENERGY_MIN = 10
const ENERGY_MAX = 100
const TICK_INTERVAL_MS = 1000
const BALLOON_MULTIPLIER = 2.2
const MAX_BPM_DEVIATION = 40

export class GameController {
  private bpm: number = BASELINE_BPM
  private energy: number = 50
  private balloonOffset: number = 0
  private isActive: boolean = false
  private simulationMode: SimulationMode = 'simulation'
  private externalBpm: number | null = null
  private biometricConnected: boolean = false
  private lastExternalBpmTime: number = 0
  private intervalId: ReturnType<typeof setInterval> | null = null
  private stabilitySeconds: number = 0
  private canCollectCrystal: boolean = false
  private crystals: number = 0
  private events: GameEvent[] = []
  private eventIdCounter: number = 0
  private listeners: Set<(state: GameControllerState) => void> = new Set()
  private simPhase: number = 0
  private lastTickTime: number = 0

  private logEvent(type: EventType, message: string): void {
    const event: GameEvent = {
      id: this.eventIdCounter++,
      type,
      message,
      timestamp: Date.now(),
    }
    this.events = [...this.events.slice(-(MAX_EVENTS - 1)), event]
  }

  private calculateEnergy(bpm: number): number {
    const diff = Math.abs(bpm - BASELINE_BPM)
    const proximity = Math.max(0, 1 - diff / MAX_BPM_DEVIATION)
    return Math.round(ENERGY_MIN + proximity * (ENERGY_MAX - ENERGY_MIN))
  }

  private calculateBalloonOffset(bpm: number): number {
    return -(bpm - BASELINE_BPM) * BALLOON_MULTIPLIER
  }

  private checkWatchdog(): void {
    if (this.simulationMode === 'real' && this.biometricConnected) {
      const elapsed = Date.now() - this.lastExternalBpmTime
      if (elapsed > WATCHDOG_TIMEOUT_MS) {
        this.simulationMode = 'simulation'
        this.logEvent(
          'warning',
          `Watchdog: sem dados biométricos por ${WATCHDOG_TIMEOUT_MS / 1000}s — simulação ativada`,
        )
      }
    }
  }

  private generateSimBpm(): number {
    this.simPhase += 0.05
    const noise = (Math.random() - 0.5) * 4
    const wave = Math.sin(this.simPhase) * 3
    return Math.max(50, Math.min(110, Math.round(BASELINE_BPM + wave + noise)))
  }

  private updateStability(bpm: number): void {
    if (bpm >= STABILITY_MIN_BPM && bpm <= STABILITY_MAX_BPM) {
      this.stabilitySeconds += 1
      if (this.stabilitySeconds >= CRYSTAL_INTERVAL_S && !this.canCollectCrystal) {
        this.canCollectCrystal = true
        this.logEvent('ok', 'Cristal de Foco disponível para coleta!')
      }
    } else {
      if (this.stabilitySeconds > 0) {
        this.logEvent('info', `Estabilidade reiniciada — BPM fora da zona (${bpm})`)
      }
      this.stabilitySeconds = 0
      this.canCollectCrystal = false
    }
  }

  private tick(): void {
    this.checkWatchdog()

    let currentBpm: number
    if (this.simulationMode === 'simulation' || this.externalBpm === null) {
      currentBpm = this.generateSimBpm()
    } else {
      currentBpm = this.externalBpm
    }

    this.bpm = currentBpm
    this.energy = this.calculateEnergy(currentBpm)
    this.balloonOffset = this.calculateBalloonOffset(currentBpm)
    this.updateStability(currentBpm)

    this.notify()
  }

  private notify(): void {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }

  getState(): GameControllerState {
    return {
      bpm: this.bpm,
      energy: this.energy,
      balloonOffset: this.balloonOffset,
      isActive: this.isActive,
      simulationMode: this.simulationMode,
      stabilitySeconds: this.stabilitySeconds,
      canCollectCrystal: this.canCollectCrystal,
      crystals: this.crystals,
      events: [...this.events],
      biometricConnected: this.biometricConnected,
    }
  }

  setExternalBpm(bpm: number | null): void {
    if (bpm !== null && bpm > 0) {
      this.externalBpm = bpm
      this.lastExternalBpmTime = Date.now()
      if (this.simulationMode === 'simulation') {
        this.simulationMode = 'real'
        this.logEvent('ok', `Reconexão biométrica — dados recebidos (BPM: ${bpm})`)
      }
    }
  }

  setBiometricConnected(connected: boolean): void {
    const wasConnected = this.biometricConnected
    this.biometricConnected = connected
    if (connected && !wasConnected) {
      this.lastExternalBpmTime = Date.now()
      this.logEvent('info', 'Sensor biométrico conectado')
    } else if (!connected && wasConnected) {
      this.logEvent('warning', 'Sensor biométrico desconectado')
    }
  }

  collectCrystal(): void {
    if (this.canCollectCrystal) {
      this.crystals += 1
      this.canCollectCrystal = false
      this.stabilitySeconds = 0
      this.logEvent('ok', `Cristal coletado! Total: ${this.crystals}`)
    }
  }

  toggleSimulation(): void {
    if (this.simulationMode === 'real') {
      this.simulationMode = 'simulation'
      this.logEvent('warning', 'Modo simulação ativado (manual)')
    } else {
      this.simulationMode = 'real'
      this.logEvent('info', 'Modo real ativado (manual)')
    }
    this.notify()
  }

  start(): void {
    if (this.isActive) return
    this.isActive = true
    this.lastTickTime = Date.now()
    this.logEvent('info', 'Sessão de foco iniciada')
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS)
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

  dispose(): void {
    this.stop()
    this.listeners.clear()
  }
}
