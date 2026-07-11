import { logCameraError } from '@/lib/camera-error-logger'

export type CameraInitStatus =
  | 'connecting'
  | 'ready'
  | 'calibrating'
  | 'done'
  | 'permission_denied'
  | 'device_in_use'
  | 'not_found'
  | 'unsupported'
  | 'error'

export const MAX_CAMERA_RETRIES = 3
export const CAMERA_RETRY_DELAYS = [1000, 2000, 4000]

interface CameraErrorInfo {
  status: CameraInitStatus
  message: string
}

export function classifyCameraError(err: any): CameraErrorInfo {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return {
      status: 'permission_denied',
      message: 'Camera access denied. Please check your browser permissions.',
    }
  }
  if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
    return {
      status: 'device_in_use',
      message: 'Camera is busy. Please close other apps using the camera and try again.',
    }
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return {
      status: 'not_found',
      message: 'No camera found. Please connect a camera and try again.',
    }
  }
  if (err?.name === 'NotSupportedError') {
    return {
      status: 'unsupported',
      message: 'Camera is not supported on this device.',
    }
  }
  return {
    status: 'error',
    message: err?.message || 'An unexpected error occurred while accessing the camera.',
  }
}

export function shouldRetryCameraError(err: any): boolean {
  return err?.name !== 'NotAllowedError' && err?.name !== 'SecurityError'
}

export async function logCameraFailure(err: any, status: string): Promise<void> {
  const errorName = err?.name || 'Unknown'
  const errorMessage = err?.message || 'No message'
  console.error(`[Camera] ${errorName}: ${errorMessage}`, { status, error: err })
  await logCameraError({
    message: `${errorName}: ${errorMessage}`,
    status,
    mode: 'camera_rppg',
  })
}
