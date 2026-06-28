import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ClipboardList,
  RotateCcw,
} from 'lucide-react'
import { anamnesisQuestions, AnamnesisQuestion } from '@/lib/anamnesis-questions'
import { FreeTextInput } from '@/components/anamnesis/FreeTextInput'
import { MultipleChoiceInput } from '@/components/anamnesis/MultipleChoiceInput'
import { LikertScaleInput } from '@/components/anamnesis/LikertScaleInput'
import {
  createAnamnesisSession,
  saveAnamnesisResponses,
  completeAnamnesisSession,
  AnamnesisResponseInput,
} from '@/services/anamnesis'
import { useToast } from '@/hooks/use-toast'

type AnswerMap = Record<string, string | number>

export default function Anamnesis() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const totalQuestions = anamnesisQuestions.length
  const question = anamnesisQuestions[currentIndex]
  const progress = Math.round((currentIndex / totalQuestions) * 100)

  const currentAnswer = answers[question.key]

  const isAnswerValid = useCallback((q: AnamnesisQuestion, ans: unknown): boolean => {
    if (ans === undefined || ans === null) return false
    if (typeof ans === 'string') return ans.trim().length > 0
    if (typeof ans === 'number') return ans >= (q.likertMin || 1) && ans <= (q.likertMax || 5)
    return false
  }, [])

  useEffect(() => {
    if (!sessionId) {
      createAnamnesisSession().then((session) => {
        if (session) setSessionId(session.id)
      })
    }
  }, [sessionId])

  const handleNext = () => {
    if (!isAnswerValid(question, currentAnswer)) return
    if (currentIndex < totalQuestions - 1) {
      setDirection('forward')
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection('backward')
      setCurrentIndex(currentIndex - 1)
    }
  }

  const setAnswer = (value: string | number) => {
    setAnswers((prev) => ({ ...prev, [question.key]: value }))
  }

  const handleSubmit = async () => {
    if (!sessionId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Sessão não iniciada.' })
      return
    }

    setIsSubmitting(true)
    const responses: AnamnesisResponseInput[] = anamnesisQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.label,
      response_value: answers[q.key],
    }))

    const saved = await saveAnamnesisResponses(sessionId, responses)
    if (!saved) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as respostas. Tente novamente.',
      })
      setIsSubmitting(false)
      return
    }

    await completeAnamnesisSession(sessionId)
    setIsSubmitting(false)
    setIsComplete(true)
    toast({
      title: 'Anamnese concluída!',
      description: 'Os dados foram salvos para análise.',
    })
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentIndex(0)
    setIsComplete(false)
    setSessionId(null)
    setDirection('forward')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleNext()
    }
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
              Anamnese Concluída
            </h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Suas respostas foram salvas com sucesso e serão utilizadas pela IA para gerar insights
              personalizados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRestart} variant="outline" className="rounded-full">
                <RotateCcw className="h-4 w-4 mr-2" /> Nova Anamnese
              </Button>
              <Button onClick={() => navigate('/')} className="rounded-full">
                Voltar ao Painel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Anamnese Adaptativa</span>
          {question.protocol && (
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
              {question.protocol}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
          Avaliação Neurológica
        </h1>
        <p className="text-slate-500 mt-1">
          Responda às perguntas sequencialmente. Suas respostas são salvas automaticamente.
        </p>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            Pergunta {currentIndex + 1} de {totalQuestions}
          </span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" aria-label="Progresso da anamnese" />
      </div>

      <Card
        key={currentIndex}
        className={`shadow-subtle border-slate-100 ${
          direction === 'forward' ? 'animate-slide-in-right' : 'animate-fade-in-up'
        }`}
      >
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-slate-900 leading-snug">
            {question.label}
          </CardTitle>
          {question.description && (
            <CardDescription className="text-sm">{question.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {question.type === 'free-text' && (
            <FreeTextInput
              question={question}
              value={(currentAnswer as string) || ''}
              onChange={setAnswer}
            />
          )}
          {question.type === 'multiple-choice' && (
            <MultipleChoiceInput
              question={question}
              value={(currentAnswer as string) || ''}
              onChange={setAnswer}
            />
          )}
          {question.type === 'likert-scale' && (
            <LikertScaleInput
              question={question}
              value={currentAnswer != null ? (currentAnswer as number) : null}
              onChange={setAnswer}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="rounded-full"
          aria-label="Pergunta anterior"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isAnswerValid(question, currentAnswer) || isSubmitting}
          className="rounded-full"
          aria-label={
            currentIndex === totalQuestions - 1 ? 'Concluir anamnese' : 'Próxima pergunta'
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
            </>
          ) : currentIndex === totalQuestions - 1 ? (
            <>
              Concluir <CheckCircle2 className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Próxima <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Pressione Ctrl+Enter para avançar rapidamente
      </p>
    </div>
  )
}
