import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Heart, Settings, X, Pause, Play, AlertCircle, Map, Diamond } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function FocusSession() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)

  const [bpm, setBpm] = useState(72)
  const [energy, setEnergy] = useState(72)
  const [mockSensor, setMockSensor] = useState(true)
  const [mockBpmTarget, setMockBpmTarget] = useState(72)

  const stateLevel = bpm < 75 ? 'calm' : bpm < 90 ? 'alert' : 'agitated'

  const bgColors = {
    calm: 'from-[#cffafe] via-[#e0f2fe] to-white',
    alert: 'from-[#bae6fd] via-[#bfdbfe] to-white',
    agitated: 'from-[#f1f5f9] via-[#e2e8f0] to-white',
  }

  useEffect(() => {
    const initSession = async () => {
      if (!user) return
      const { data } = await supabase
        .from('focus_sessions')
        .insert({ user_id: user.id, settings: { duration: 25 * 60 } })
        .select('id')
        .single()

      if (data) setSessionId(data.id)
    }
    initSession()
  }, [user])

  useEffect(() => {
    let interval: any = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      handleSessionComplete()
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  useEffect(() => {
    if (!isActive || !sessionId) return

    const interval = setInterval(async () => {
      let currentBpm = bpm
      if (mockSensor) {
        const diff = mockBpmTarget - currentBpm
        currentBpm += diff * 0.2 + (Math.random() * 4 - 2)
        currentBpm = Math.max(50, Math.min(150, Math.round(currentBpm)))
        setBpm(currentBpm)
      }

      let newEnergy = energy
      if (currentBpm < 80) newEnergy = Math.min(100, energy + 0.5)
      else if (currentBpm > 90) newEnergy = Math.max(0, energy - 1)
      setEnergy(newEnergy)

      await supabase
        .from('focus_biofeedback_logs')
        .insert({
          session_id: sessionId,
          bpm: currentBpm,
          vrc: 0,
        })
        .catch(() => {})
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, mockSensor, mockBpmTarget, bpm, energy, sessionId])

  const handleSessionComplete = async () => {
    if (sessionId) {
      await supabase
        .from('focus_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)
      try {
        const { data } = await supabase.functions.invoke('calculate-vrc', {
          body: { sessionId },
        })
        if (data?.vrc) {
          toast({
            title: 'Sessão Concluída!',
            description: `Seu VRC médio foi de ${data.vrc.toFixed(2)} ms.`,
          })
        } else {
          toast({
            title: 'Sessão Concluída!',
            description: 'Sessão de foco registrada com sucesso.',
          })
        }
      } catch {
        /* intentionally ignored */
      }
    }
    navigate('/')
  }

  const handleCancel = async () => {
    if (sessionId) {
      await supabase
        .from('focus_sessions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', sessionId)
    }
    navigate('/')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div
      className={cn(
        'min-h-screen w-full flex flex-col transition-colors duration-1000 bg-gradient-to-b overflow-hidden relative',
        bgColors[stateLevel],
      )}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <Diamond
          className="absolute top-32 left-10 text-cyan-400 h-6 w-6 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute top-64 right-20 text-blue-400 h-4 w-4 animate-float"
          style={{ animationDuration: '6s' }}
          fill="currentColor"
        />
        <Diamond
          className="absolute bottom-40 left-20 text-cyan-500 h-5 w-5 animate-float"
          style={{ animationDuration: '2s' }}
          fill="currentColor"
        />
      </div>

      <header className="p-6 pb-2 z-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2 w-full justify-between">
          <div className="flex items-center">
            <Map className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="font-bold text-slate-800 tracking-tight text-sm">NeuroFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full flex items-center shadow-sm text-sm font-bold text-cyan-700">
              <Diamond className="h-4 w-4 mr-1" fill="currentColor" /> 1370
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 rounded-full shadow-sm text-slate-600 hover:text-slate-900"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações de Biofeedback</h4>
                  <div className="flex items-center justify-between">
                    <Label>Sensor Mock (Simulação)</Label>
                    <Switch checked={mockSensor} onCheckedChange={setMockSensor} />
                  </div>
                  {mockSensor && (
                    <div className="space-y-2">
                      <Label>BPM Alvo ({mockBpmTarget})</Label>
                      <Slider
                        value={[mockBpmTarget]}
                        onValueChange={(v) => setMockBpmTarget(v[0])}
                        min={50}
                        max={150}
                        step={1}
                      />
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-800 tracking-tight mt-2">
          O EXPLORADOR DA CALMA
        </h1>
        <p className="text-slate-600 font-medium text-sm mt-1">Nível: 4 | Cristais Coletados: 12</p>
        <p className="text-slate-800 font-bold mt-2 bg-white/50 px-4 py-1.5 rounded-full text-sm shadow-sm border border-white">
          Objetivo: Alcance 75% de Energia para o próximo destino!
        </p>

        {stateLevel === 'agitated' && (
          <div className="mt-4 animate-in slide-in-from-top-2 flex items-center bg-white/80 text-slate-700 px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <AlertCircle className="h-5 w-5 mr-2 text-slate-500" />
            <span className="font-medium text-sm text-left">
              Seu corpo está agitado. Faça uma micro-pausa para respiração profunda.
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 relative flex items-center justify-center w-full max-w-md mx-auto px-6">
        <div
          className={cn(
            'relative z-10 transition-all duration-1000 animate-float',
            stateLevel === 'calm' ? 'opacity-100' : 'opacity-90',
          )}
          style={{
            animationDuration: stateLevel === 'calm' ? '6s' : stateLevel === 'alert' ? '4s' : '2s',
          }}
        >
          <img
            src="https://img.usecurling.com/p/256/256?q=hot%20air%20balloon%20cute%20character&color=cyan"
            alt="Explorador da Calma"
            className="w-56 h-56 object-contain drop-shadow-2xl"
            style={{ filter: stateLevel === 'agitated' ? 'grayscale(0.4)' : 'none' }}
          />
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <span className="text-xs font-bold text-slate-600 mb-2 w-16 text-center leading-tight">
            Energia da Calma
          </span>
          <div className="h-64 w-10 bg-white/60 backdrop-blur-md rounded-full border-2 border-white/80 p-1 relative overflow-hidden flex flex-col justify-end shadow-sm">
            <div
              className={cn(
                'w-full rounded-full transition-all duration-1000 flex items-start justify-center pt-2',
                energy >= 75
                  ? 'bg-emerald-400/80'
                  : energy >= 40
                    ? 'bg-cyan-400/80'
                    : 'bg-amber-400/80',
              )}
              style={{ height: `${energy}%` }}
            >
              <span className="text-white text-[10px] font-black">{Math.round(energy)}%</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center bg-white/80 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-white">
            <Heart
              className={cn(
                'h-5 w-5 mb-1',
                stateLevel === 'calm'
                  ? 'text-cyan-500 animate-pulse'
                  : stateLevel === 'alert'
                    ? 'text-blue-500 animate-pulse'
                    : 'text-slate-400',
              )}
              style={{ animationDuration: `${60 / bpm}s` }}
            />
            <span className="text-[10px] text-slate-500 font-medium">BPM Atual</span>
            <span className="font-bold text-slate-800">{bpm} bpm</span>
          </div>
        </div>
      </main>

      <footer className="p-6 z-10 flex flex-col items-center bg-gradient-to-t from-white/80 to-transparent">
        <div className="text-4xl font-display font-black text-slate-800 mb-6 font-variant-numeric: tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm"
            onClick={handleCancel}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            className="h-16 w-16 rounded-full shadow-floating bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <Pause className="h-7 w-7 text-white" />
            ) : (
              <Play className="h-7 w-7 text-white ml-1" />
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
