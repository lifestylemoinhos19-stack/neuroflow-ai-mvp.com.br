export interface AccuracyMetrics {
  mae: number
  rmse: number
  accuracyPercentage: number
  sampleCount: number
}

export interface ComparisonSample {
  timestamp: number
  cameraBpm: number | null
  sensorBpm: number | null
}

export class BiofeedbackAccuracyTester {
  private samples: ComparisonSample[] = []
  private readonly maxSamples = 300

  addSample(cameraBpm: number | null, sensorBpm: number | null): void {
    if (cameraBpm === null && sensorBpm === null) return
    this.samples.push({ timestamp: Date.now(), cameraBpm, sensorBpm })
    if (this.samples.length > this.maxSamples) this.samples.shift()
  }

  calculate(): AccuracyMetrics {
    const valid = this.samples.filter((s) => s.cameraBpm !== null && s.sensorBpm !== null)
    if (valid.length === 0) {
      return { mae: 0, rmse: 0, accuracyPercentage: 100, sampleCount: 0 }
    }
    const errors = valid.map((s) => Math.abs(s.cameraBpm! - s.sensorBpm!))
    const mae = errors.reduce((a, b) => a + b, 0) / errors.length
    const rmse = Math.sqrt(
      valid.reduce((acc, s) => acc + (s.cameraBpm! - s.sensorBpm!) ** 2, 0) / valid.length,
    )
    return {
      mae,
      rmse,
      accuracyPercentage: Math.max(0, 100 - mae),
      sampleCount: valid.length,
    }
  }

  generateReport(): string {
    const m = this.calculate()
    const lines = [
      '=== Biofeedback Accuracy Report ===',
      `Timestamp: ${new Date().toISOString()}`,
      `Valid Samples: ${m.sampleCount}`,
      `MAE: ${m.mae.toFixed(2)} BPM`,
      `RMSE: ${m.rmse.toFixed(2)} BPM`,
      `Accuracy: ${m.accuracyPercentage.toFixed(1)}%`,
      '',
      '--- Recent Samples (last 20) ---',
    ]
    this.samples.slice(-20).forEach((s, i) => {
      lines.push(
        `[${i + 1}] Camera: ${s.cameraBpm ?? 'N/A'} BPM | Sensor: ${s.sensorBpm ?? 'N/A'} BPM`,
      )
    })
    return lines.join('\n')
  }

  reset(): void {
    this.samples = []
  }

  getSampleCount(): number {
    return this.samples.length
  }
}

export function calculateFusedBpm(
  cameraBpm: number | null,
  sensorBpm: number | null,
): number | null {
  if (cameraBpm !== null && sensorBpm !== null) {
    return Math.round(cameraBpm * 0.6 + sensorBpm * 0.4)
  }
  return cameraBpm ?? sensorBpm
}
