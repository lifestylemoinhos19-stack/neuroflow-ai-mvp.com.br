import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { miniModules, MiniAnswers } from '@/lib/mini-data'
import { scoreAllModules } from '@/lib/mini-scoring'
import {
  createMiniSession,
  saveMiniResponse,
  completeMiniSession,
  MiniPatientInfo,
} from '@/services/mini-interview'
import { MiniProgressBar } from '@/components/mini/MiniProgressBar'
import { MiniPatientForm } from '@/components/mini/MiniPatientForm'
import { MiniModuleView } from '@/components/mini/MiniModuleView'
import { MiniSummary } from '@/components/mini/MiniSummary'

type Step = 'patient' | 'interview' | 'summary'
const DRAFT_KEY = 'mini_interview_draft'
const TOTAL_MODULES = miniModules.length

export default function MiniInterview() {
  const [step, setStep] = useState<Step>('patient')
  const [currentModule, setCurrentModule] = useState(0)
  const [answers, setAnswers] = useState<MiniAnswers>({})
  const [patientInfo, setPatientInfo] = useState<MiniPatientInfo>({
    name: '',
    protocol: '',
    interviewDate: '',
    birthDate: '',
  })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.patientInfo) setPatientInfo(parsed.patientInfo)
        if (parsed.currentModule) setCurrentModule(parsed.currentModule)
        if (parsed.step) setStep(parsed.step)
        if (parsed.sessionId) setSessionId(parsed.sessionId)
      }
    } catch {
      /* ignore */
    }
    setDraftLoaded(true)
  }, [])

  useEffect(() => {
    if (!draftLoaded) return
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ step, currentModule, answers, patientInfo, sessionId }),
    )
  }, [step, currentModule, answers, patientInfo, sessionId, draftLoaded])

  const handleStart = async (info: MiniPatientInfo) => {
    setPatientInfo(info)
    const id = await createMiniSession(info)
    if (!id) {
      toast.error('Erro ao criar sessão. Verifique sua autenticação.')
      return
    }
    setSessionId(id)
    setStep('interview')
    setCurrentModule(0)
    toast.success('Entrevista iniciada com sucesso!')
  }

  const handleAnswer = (key: string, label: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (sessionId) {
      setSaving(true)
      saveMiniResponse(sessionId, key, label, value).finally(() => setSaving(false))
    }
  }

  const handlePrev = () => {
    if (currentModule > 0) setCurrentModule((prev) => prev - 1)
  }

  const handleNext = () => {
    if (currentModule < TOTAL_MODULES - 1) setCurrentModule((prev) => prev + 1)
  }

  const handleFinish = async () => {
    if (sessionId) {
      await completeMiniSession(sessionId)
    }
    setStep('summary')
    toast.success('Entrevista finalizada! Resultados gerados.')
  }

  const handleRestart = () => {
    localStorage.removeItem(DRAFT_KEY)
    setAnswers({})
    setPatientInfo({ name: '', protocol: '', interviewDate: '', birthDate: '' })
    setSessionId(null)
    setCurrentModule(0)
    setStep('patient')
  }

  if (step === 'patient') {
    return <MiniPatientForm onSubmit={handleStart} initialInfo={patientInfo} />
  }

  if (step === 'summary') {
    const results = scoreAllModules(miniModules, answers)
    return <MiniSummary patientInfo={patientInfo} results={results} onRestart={handleRestart} />
  }

  const isFirst = currentModule === 0
  const isLast = currentModule === TOTAL_MODULES - 1

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 sticky top-0 z-10 pt-2 pb-3 bg-[#0A192F]/95 backdrop-blur-sm">
        <MiniProgressBar current={currentModule + 1} total={TOTAL_MODULES} />
      </div>

      <MiniModuleView
        module={miniModules[currentModule]}
        answers={answers}
        onAnswer={handleAnswer}
      />

      <div className="flex items-center justify-between mt-6 mb-8">
        <Button
          onClick={handlePrev}
          disabled={isFirst}
          variant="outline"
          className="border-[#233554] text-[#E6F1FF] hover:bg-[#233554] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 text-[#00FFFF]/50 animate-spin" />}
          {isLast ? (
            <Button
              onClick={handleFinish}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
            >
              <Flag className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
