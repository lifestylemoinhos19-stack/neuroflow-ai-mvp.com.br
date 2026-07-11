import { supabase } from '@/lib/supabase/client'

export interface CameraErrorLog {
  message: string
  status?: string
  mode?: string
}

export async function logCameraError(error: CameraErrorLog): Promise<void> {
  console.error('[CameraError]', error.message, { status: error.status, mode: error.mode })
  try {
    await supabase.from('system_updates').insert({
      title: 'Camera Connection Error',
      description: error.message,
      type: 'camera_error',
      status: 'pending',
      payload: {
        error_status: error.status || 'error',
        capture_mode: error.mode || 'unknown',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    // Silent fail - don't block UI on logging errors
  }
}
