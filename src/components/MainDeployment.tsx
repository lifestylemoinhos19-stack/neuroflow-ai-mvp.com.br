import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CameraOnboarding } from '@/components/CameraOnboarding'
import { GameEngine } from '@/components/GameEngine'
import type { GameController } from '@/lib/game-controller'
import { useAuth } from '@/contexts/auth-context'
import { Rocket, BarChart3, RotateCcw } from 'lucide-react'
import { FieldTestBatchPanel } from '@/components/FieldTestBatchPanel'
import { FeedbackMonitorPanel } from '@/components/FeedbackMonitorPanel'

type DeploymentState = 'idle' | 'onboarding' | 'focus' | 'ended'

interface OnboardingData {
  bpm: number
  calibratedAt: string
}

interface SessionSummary {
  state: DeploymentState
  sessionId: string | null
  userId: string | null
  startedAt: string | null
  endedAt: string | null
  durationMs: number | null
  onboarding: OnboardingData | null
}

interface MainDeploymentProps {
  sessionId?: string
  userId?: string
  autoStart?: boolean
}

export function MainDeployment({ sessionId, userId, autoStart = false }: MainDeploymentProps) {
  const [deployState, setDeployState] = useState<DeploymentState>('idle')
  const [controller, setController] = useState<GameController | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [endedAt, setEndedAt] = useState<string | null>(null)
  const { user } = useAuth()

  const effectiveUserId = userId || user?.id || null

  const handleStart = useCallback(() => {
    setStartedAt(new Date().toISOString())
    setDeployState('onboarding')
  }, [])

  useEffect(() => {
    if (autoStart && deployState === 'idle') {
      handleStart()
    }
  }, [autoStart, deployState, handleStart])

  const handleOnboardingComplete = useCallback((ctrl: GameController) => {
    const data: OnboardingData = {
      bpm: ctrl.getState().bpm,
      calibratedAt: new Date().toISOString(),
    }
    setController(ctrl)
    setOnboardingData(data)
    setDeployState('focus')
  }, [])

  const handleSessionEnd = useCallback(() => {
    if (controller) {
      controller.stop()
      controller.dispose()
    }
    setEndedAt(new Date().toISOString())
    setDeployState('ended')
  }, [controller])

  const handleReset = useCallback(() => {
    if (controller) {
      controller.dispose()
    }
    setController(null)
    setOnboardingData(null)
    setStartedAt(null)
    setEndedAt(null)
    setDeployState('idle')
  }, [controller])

  if (deployState === 'idle') {
    return (
      <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                border: '2px solid #00FFFF',
                boxShadow: '0 0 30px rgba(0, 255, 255, 0.33)',
              }}
            >
              <Rocket className="h-10 w-10 text-[#00FFFF]" />
            </div>
            <h1 className="text-2xl font-bold text-[#E6F1FF] mb-2">
              NeuroFlow AI - Sessao de Foco
            </h1>
            <p className="text-sm text-[#00FFFF]/85 mb-8">
              Pronto para testes de campo e calibracao de dispositivos
            </p>
            <Button
              onClick={handleStart}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8 py-3 text-base font-semibold"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.33)' }}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Iniciar Deploy
            </Button>
            {effectiveUserId && (
              <p className="text-xs text-white/70 mt-4">User: {effectiveUserId.slice(0, 8)}...</p>
            )}
            {sessionId && (
              <p className="text-xs text-white/70 mt-1">Session: {sessionId.slice(0, 8)}...</p>
            )}
          </div>
          <div className="mt-8 space-y-6">
            <FieldTestBatchPanel userId={effectiveUserId || undefined} />
            <FeedbackMonitorPanel />
          </div>
        </div>
      </div>
    )
  }

  if (deployState === 'onboarding') {
    return <CameraOnboarding onComplete={handleOnboardingComplete} />
  }

  if (deployState === 'focus' && controller) {
    return <GameEngine controller={controller} onExit={handleSessionEnd} />
  }

  if (deployState === 'ended') {
    const durationMs =
      startedAt && endedAt ? new Date(endedAt).getTime() - new Date(startedAt).getTime() : null
    const summary: SessionSummary = {
      state: 'ended',
      sessionId: sessionId || null,
      userId: effectiveUserId,
      startedAt,
      endedAt,
      durationMs,
      onboarding: onboardingData,
    }
    return (
      <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                border: '2px solid #00FFFF',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.33)',
              }}
            >
              <BarChart3 className="h-8 w-8 text-[#00FFFF]" />
            </div>
            <h1 className="text-xl font-bold text-[#E6F1FF]">Session Ended</h1>
            <p className="text-sm text-[#00FFFF]/85">Deployment Summary</p>
          </div>
          <pre
            className="bg-black/40 border border-[#00FFFF]/20 rounded-xl p-4 text-xs text-[#E6F1FF]/80 overflow-auto max-h-96"
            style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.33)' }}
          >
            {JSON.stringify(summary, null, 2)}
          </pre>
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleReset}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Novo Deploy
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
