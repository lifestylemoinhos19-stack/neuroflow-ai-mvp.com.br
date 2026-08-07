import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { mini500Modules, Mini500Answers } from '@/lib/mini500-data'
import { scoreAllModules, generateSummaryText as _unused } from '@/lib/mini500-scoring'
import { generateSummaryText } from '@/lib/mini500-interpretation'
import { getVisibleQuestions } from '@/lib/mini500-skip-logic'
import { generateInterpretations, getCriticalAlerts } from '@/lib/mini500-interpretation'
import {
  createMini500Session,
  saveMini500Response,
  completeMini500Session,
  saveMini500Interpretations,
  Mini500PatientInfo,
} from '@/services/mini500-service'
import { Mini500ProgressBar } from '@/components/mini500/Mini500ProgressBar'
import { Mini500PatientForm } from '@/components/mini500/Mini500PatientForm'
import { Mini500ModuleView } from '@/components/mini500/Mini500ModuleView'
import { Mini500Summary } from '@/components/mini500/Mini500Summary'

type Step = 'patient' | 'interview' | 'summary'
const DRAFT_KEY = 'mini500_draft'
const TOTAL_MODULES = mini500Modules.length

const EMPTY_PATIENT: Mini500PatientInfo = {
  name: '',
  protocol: '',
  interviewDate: '',
  birthDate: '',
  interviewerName: '',
  startTime: '',
  endTime: '',
}

export default function Mini500() {
  const [step, setStep] = useState<Step>('patient')
  const [currentModule, setCurrentModule] = useState(0)
  const [answers, setAnswers] = useState<Mini500Answers>({})
  const [patientInfo, setPatientInfo] = useState<Mini500PatientInfo>(EMPTY_PATIENT)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.patientInfo) setPatientInfo({ ...EMPTY_PATIENT, ...parsed.patientInfo })
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

  const handleStart = async (info: Mini500PatientInfo) => {
    setPatientInfo(info)
    const id = await createMini500Session(info)
    if (!id) {
      toast.error('Erro ao criar sessão. Verifique sua autenticação.')
      return
    }
    setSessionId(id)
    setStep('interview')
    setCurrentModule(0)
    toast.success('Entrevista MINI 5.0.0 iniciada!')
  }

  const handleAnswer = (key: string, label: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value }
      const mod = mini500Modules[currentModule]
      if (mod) {
        const visibleKeys = new Set(getVisibleQuestions(mod, next).map((q) => q.key))
        mod.questions.forEach((q) => {
          if (!visibleKeys.has(q.key) && q.key !== key) delete next[q.key]
        })
      }
      return next
    })
    if (sessionId) {
      setSaving(true)
      saveMini500Response(sessionId, key, label, value).finally(() => setSaving(false))
    }
  }

  const handlePrev = () => {
    if (currentModule > 0) setCurrentModule((p) => p - 1)
  }
  const handleNext = () => {
    if (currentModule < TOTAL_MODULES - 1) setCurrentModule((p) => p + 1)
  }

  const handleFinish = async () => {
    const endTime = new Date().toTimeString().slice(0, 5)
    const updatedInfo = { ...patientInfo, endTime }
    setPatientInfo(updatedInfo)

    if (sessionId) {
      await completeMini500Session(sessionId, { ...updatedInfo, source: 'mini500' })
      const results = scoreAllModules(mini500Modules, answers)
      const interpretations = generateInterpretations(results)
      const alerts = getCriticalAlerts(interpretations)
      const summary = generateSummaryText(results)
      const severity = alerts.length > 0 ? 'high' : interpretations.length > 0 ? 'moderate' : 'low'
      await saveMini500Interpretations(sessionId, summary, severity, interpretations)
    }
    setStep('summary')
    toast.success('Entrevista finalizada! Resultados e interpretações gerados.')
  }

  const handleRestart = () => {
    localStorage.removeItem(DRAFT_KEY)
    setAnswers({})
    setPatientInfo(EMPTY_PATIENT)
    setSessionId(null)
    setCurrentModule(0)
    setStep('patient')
  }

  if (step === 'patient') {
    return <Mini500PatientForm onSubmit={handleStart} initialInfo={patientInfo} />
  }

  if (step === 'summary') {
    const results = scoreAllModules(mini500Modules, answers)
    const interpretations = generateInterpretations(results)
    const alerts = getCriticalAlerts(interpretations)
    const summary = generateSummaryText(results)
    return (
      <Mini500Summary
        patientInfo={patientInfo}
        results={results}
        interpretations={interpretations}
        alerts={alerts}
        summary={summary}
        onRestart={handleRestart}
      />
    )
  }

  const isFirst = currentModule === 0
  const isLast = currentModule === TOTAL_MODULES - 1
  const mod = mini500Modules[currentModule]
  const visibleCount = getVisibleQuestions(mod, answers).length
  const answeredCount = getVisibleQuestions(mod, answers).filter(
    (q) => answers[q.key] !== undefined,
  ).length

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 sticky top-0 z-10 pt-2 pb-3 bg-[#0A192F]/95 backdrop-blur-sm">
        <Mini500ProgressBar current={currentModule + 1} total={TOTAL_MODULES} />
        {visibleCount > 0 && (
          <p className="text-xs text-[#E6F1FF]/80 mt-1.5">
            {answeredCount}/{visibleCount} perguntas respondidas neste módulo
          </p>
        )}
      </div>
      <Mini500ModuleView module={mod} answers={answers} onAnswer={handleAnswer} />
      <div className="flex items-center justify-between mt-6 mb-8">
        <Button
          onClick={handlePrev}
          disabled={isFirst}
          variant="outline"
          className="border-[#233554] text-[#E6F1FF] hover:bg-[#233554] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 text-[#00FFFF]/80 animate-spin" />}
          {isLast ? (
            <Button
              onClick={handleFinish}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
            >
              <Flag className="h-4 w-4 mr-2" /> Finalizar
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
