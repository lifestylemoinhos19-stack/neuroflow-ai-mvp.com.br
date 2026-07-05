import { runAllFieldTests, aggregateResults, type FieldTestResult } from '@/lib/field-test-engine'
import { TEAM_DEVICES, type TeamDevice } from '@/lib/team-devices'
import { captureFieldTestMetrics } from '@/lib/sensitivity-tuning'

export type LogLevel = 'info' | 'success' | 'error' | 'warning'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  deviceId?: string
}

export interface DeviceTestResult {
  device: TeamDevice
  success: boolean
  avgMae?: number
  avgRmse?: number
  totalSamples?: number
  error?: string
  startedAt: string
  completedAt: string
}

export interface BatchTestSummary {
  totalDevices: number
  successCount: number
  failedCount: number
  results: DeviceTestResult[]
  startedAt: string
  completedAt: string
}

export interface BatchTestOptions {
  stopOnError?: boolean
  userId?: string
  onLog?: (entry: LogEntry) => void
  onProgress?: (deviceIndex: number, total: number, result: DeviceTestResult) => void
}

function logToConsole(entry: LogEntry): void {
  const labelStyle =
    'background: #0A192F; color: #E6F1FF; font-weight: bold; padding: 2px 6px; border-radius: 3px'
  const valueStyle = 'color: #00FFFF; font-weight: bold'
  const ts = entry.timestamp

  switch (entry.level) {
    case 'success':
      console.log('%c[NeuroFlow]%c ' + ts + ' \u2713 ' + entry.message, labelStyle, valueStyle)
      break
    case 'error':
      console.log(
        '%c[NeuroFlow]%c ' + ts + ' \u2717 ' + entry.message,
        labelStyle,
        'color: #FF4444; font-weight: bold',
      )
      break
    case 'warning':
      console.log(
        '%c[NeuroFlow]%c ' + ts + ' \u26A0 ' + entry.message,
        labelStyle,
        'color: #FFD700; font-weight: bold',
      )
      break
    default:
      console.log('%c[NeuroFlow]%c ' + ts + ' ' + entry.message, labelStyle, valueStyle)
  }
}

export async function runFieldTestAutomation(
  devices: TeamDevice[] = TEAM_DEVICES,
  options: BatchTestOptions = {},
): Promise<BatchTestSummary> {
  const { stopOnError = false, userId, onLog, onProgress } = options
  const results: DeviceTestResult[] = []
  const startedAt = new Date().toISOString()

  const log = (level: LogLevel, message: string, deviceId?: string): void => {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level, message, deviceId }
    logToConsole(entry)
    onLog?.(entry)
  }

  log('info', 'Iniciando batch test para ' + devices.length + ' dispositivos...')

  for (let i = 0; i < devices.length; i++) {
    const device = devices[i]
    const deviceStartedAt = new Date().toISOString()

    log(
      'info',
      '[' +
        (i + 1) +
        '/' +
        devices.length +
        '] Testando ' +
        device.label +
        ' (' +
        device.id +
        ')...',
      device.id,
    )

    try {
      const fieldResults: FieldTestResult[] = await runAllFieldTests()
      const { avgMae, avgRmse, totalSamples } = aggregateResults(fieldResults)
      const deviceCompletedAt = new Date().toISOString()

      if (userId) {
        await captureFieldTestMetrics(
          userId,
          {
            mae: avgMae,
            rmse: avgRmse,
            samples: totalSamples,
            durationMs: new Date(deviceCompletedAt).getTime() - new Date(deviceStartedAt).getTime(),
          },
          null,
          {
            model: 'neuroflow_v1',
            device_id: device.id,
            device_label: device.label,
            owner: device.owner,
            type: 'batch_field_test',
          },
        )
      }

      const result: DeviceTestResult = {
        device,
        success: true,
        avgMae,
        avgRmse,
        totalSamples,
        startedAt: deviceStartedAt,
        completedAt: deviceCompletedAt,
      }
      results.push(result)
      log(
        'success',
        device.label +
          ': MAE=' +
          avgMae.toFixed(2) +
          ' RMSE=' +
          avgRmse.toFixed(2) +
          ' Samples=' +
          totalSamples,
        device.id,
      )
      onProgress?.(i + 1, devices.length, result)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const result: DeviceTestResult = {
        device,
        success: false,
        error: errorMsg,
        startedAt: deviceStartedAt,
        completedAt: new Date().toISOString(),
      }
      results.push(result)
      log('error', device.label + ': FALHA - ' + errorMsg, device.id)
      onProgress?.(i + 1, devices.length, result)

      if (stopOnError) {
        log('warning', 'stopOnError=true: Interrompendo testes restantes.', device.id)
        break
      }
    }
  }

  const completedAt = new Date().toISOString()
  const successCount = results.filter((r) => r.success).length
  const failedCount = results.filter((r) => !r.success).length

  log(
    'info',
    'Batch concluido: ' +
      successCount +
      '/' +
      devices.length +
      ' sucesso, ' +
      failedCount +
      ' falhas.',
  )

  return {
    totalDevices: devices.length,
    successCount,
    failedCount,
    results,
    startedAt,
    completedAt,
  }
}
