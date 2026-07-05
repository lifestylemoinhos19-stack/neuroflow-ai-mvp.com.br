export interface VitalLensConfig {
  video: HTMLVideoElement
  onBpm: (bpm: number) => void
}

export interface VitalLensAdapter {
  isAvailable: boolean
  initialize: (config: VitalLensConfig) => Promise<boolean>
  start: () => void
  stop: () => void
}

export function createVitalLensAdapter(): VitalLensAdapter {
  const isAvailable = typeof window !== 'undefined' && !!(window as any).vitallens
  let config: VitalLensConfig | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null
  let mockBpm = 72

  return {
    isAvailable,
    async initialize(cfg: VitalLensConfig): Promise<boolean> {
      config = cfg
      if (isAvailable) {
        try {
          const vl = (window as any).vitallens
          if (vl.init) await vl.init({ video: cfg.video })
          return true
        } catch {
          return false
        }
      }
      return true
    },
    start(): void {
      if (isAvailable && config) {
        const vl = (window as any).vitallens
        if (vl.onBpm) vl.onBpm = config.onBpm
        if (vl.start) vl.start()
        return
      }
      intervalId = setInterval(() => {
        mockBpm = Math.max(55, Math.min(120, Math.round(72 + (Math.random() * 8 - 4))))
        if (config) config.onBpm(mockBpm)
      }, 1000)
    },
    stop(): void {
      if (isAvailable) {
        const vl = (window as any).vitallens
        if (vl.stop) vl.stop()
        return
      }
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  }
}
