export type GamePhase = 'onboarding' | 'focus' | 'error'

export interface GameControllerState {
  bpm: number
  energy: number
  altitude: number
  isActive: boolean
}

export class GameController {
  private bpm = 72
  private energy = 50
  private isActive = false
  private externalBpm: number | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private listeners = new Set<(state: GameControllerState) => void>()

  private calculateAltitude(bpm: number): number {
    const normalized = Math.max(0, Math.min(180, bpm)) / 180
    return 20 + normalized * 60
  }

  private calculateEnergy(bpm: number): number {
    if (bpm < 70) return Math.min(100, this.energy + 0.5)
    if (bpm > 100) return Math.max(0, this.energy - 1.5)
    return this.energy
  }

  getState(): GameControllerState {
    return {
      bpm: this.bpm,
      energy: Math.round(this.energy),
      altitude: this.calculateAltitude(this.bpm),
      isActive: this.isActive,
    }
  }

  setBpm(bpm: number | null): void {
    if (bpm === null || Number.isNaN(bpm)) return
    this.bpm = Math.max(0, Math.min(180, bpm))
    this.energy = this.calculateEnergy(this.bpm)
    this.notify()
  }

  setExternalBpm(bpm: number | null): void {
    this.externalBpm = bpm
  }

  start(): void {
    this.isActive = true
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = setInterval(() => {
      if (this.externalBpm !== null) {
        this.setBpm(this.externalBpm)
      } else {
        const mock = Math.max(55, Math.min(120, Math.round(72 + (Math.random() * 8 - 4))))
        this.setBpm(mock)
      }
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
