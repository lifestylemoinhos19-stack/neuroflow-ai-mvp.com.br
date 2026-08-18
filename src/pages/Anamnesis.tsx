import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Send, CheckCircle2, Loader2, Scale, Sparkles, Shield } from 'lucide-react'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { anamnesisQuestions } from '@/lib/anamnesis-questions'
import {
  createAnamnesisSession,
  createGuestAnamnesisSession,
  completeAnamnesisSession,
} from '@/services/anamnesis'
import { saveSingleResponse, logAuditAction } from '@/services/scales'
import { useToast } from '@/hooks/use-toast'
import { TmsSafetyAlert } from '@/components/TmsSafetyAlert'
import { checkTmsContraindication } from '@/lib/tms-safety'

interface ChatMessage {
  role: 'bot' | 'user'
  content: string
}

const chatQuestions = anamnesisQuestions.filter(
  (q) => q.type === 'free-text' || q.type === 'multiple-choice',
)

interface AnamnesisProps {
  /** When provided, the component runs in public guest mode (no auth required):
   *  the session is created via createGuestAnamnesisSession and linked to this guest_id. */
  guestId?: string
}

export default function Anamnesis({ guestId }: AnamnesisProps = {}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const isGuestMode = !!guestId
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [tmsAlertOpen, setTmsAlertOpen] = useState(false)
  const [tmsAlertMessage, setTmsAlertMessage] = useState('')
  const [tmsAlertLevel, setTmsAlertLevel] = useState<'critical' | 'warning'>('critical')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasAcknowledged) return
    const createSession = isGuestMode
      ? () => createGuestAnamnesisSession(guestId!)
      : () => createAnamnesisSession()
    createSession().then((session) => {
      if (session) {
        setSessionId(session.id)
        // logAuditAction requires an authed user; skip in guest mode.
        if (!isGuestMode) {
          logAuditAction('session_start', 'anamnesis_sessions', session.id)
        }
        setMessages([
          {
            role: 'bot',
            content:
              'Olá! Vou conduzir uma anamnese neurológica adaptativa. Responda no seu ritmo.',
          },
        ])
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: 'bot', content: chatQuestions[0].label }])
        }, 800)
      }
    })
  }, [hasAcknowledged, isGuestMode, guestId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const currentQuestion = chatQuestions[currentIndex]

  const handleSend = useCallback(
    async (value: string) => {
      if (!value.trim() || !sessionId || !currentQuestion) return
      setInputValue('')
      setMessages((prev) => [...prev, { role: 'user', content: value }])
      const tmsRisk = checkTmsContraindication(value)
      if (tmsRisk) {
        setTmsAlertMessage(tmsRisk.message)
        setTmsAlertLevel(tmsRisk.level)
        setTmsAlertOpen(true)
      }
      setIsSaving(true)
      await saveSingleResponse(sessionId, currentQuestion.key, currentQuestion.label, value)
      setIsSaving(false)
      const nextIndex = currentIndex + 1
      if (nextIndex < chatQuestions.length) {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setCurrentIndex(nextIndex)
          setMessages((prev) => [...prev, { role: 'bot', content: chatQuestions[nextIndex].label }])
        }, 700)
      } else {
        setIsTyping(true)
        await completeAnamnesisSession(sessionId)
        if (!isGuestMode) {
          logAuditAction('session_complete', 'anamnesis_sessions', sessionId)
        }
        setTimeout(() => {
          setIsTyping(false)
          setIsComplete(true)
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              content:
                'Anamnese concluída! Você pode responder às escalas clínicas na aba Escalas.',
            },
          ])
        }, 700)
        toast({ title: 'Anamnese concluída!', description: 'Respostas salvas com sucesso.' })
      }
    },
    [currentIndex, currentQuestion, sessionId, toast],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-subtle border-slate-100">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
              Anamnese Concluída
            </h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Suas respostas foram salvas. Continue com as escalas clínicas especializadas.
            </p>
            <div className="flex gap-3">
              {isGuestMode ? (
                <Button className="rounded-full" onClick={() => navigate('/minhas-escalas')}>
                  Voltar para minhas avaliações
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => navigate('/scales')}
                  >
                    Ir para Escalas
                  </Button>
                  <Button className="rounded-full" onClick={() => navigate('/dashboard')}>
                    Ver Dashboard
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!hasAcknowledged) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-subtle border-amber-200 bg-amber-50">
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">Aviso Importante</h2>
            <p className="text-slate-600 mb-2 max-w-md">
              <strong>
                NeuroFlow AI é uma ferramenta de triagem e NÃO substitui uma consulta médica formal.
              </strong>
            </p>
            <p className="text-sm text-slate-500 mb-6 max-w-md">
              Os resultados desta anamnese servem como apoio inicial e devem ser validados por um
              profissional de saúde qualificado.
            </p>
            <Button onClick={() => setHasAcknowledged(true)} className="rounded-full">
              Entendi, iniciar anamnese
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-[#00FFFF]" />
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
            Entrevista Adaptativa
          </h1>
        </div>
        <p className="text-sm text-slate-300 font-medium">
          Pergunta {Math.min(currentIndex + 1, chatQuestions.length)} de {chatQuestions.length}
        </p>
        <div className="mt-2 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-start gap-2">
          <Scale className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-200 leading-snug">{TELEMEDICINE_DISCLAIMER.text}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2.5 animate-fade-in-up',
              msg.role === 'user' && 'flex-row-reverse',
            )}
          >
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'bot' ? 'bg-primary/10' : 'bg-indigo-100',
              )}
            >
              {msg.role === 'bot' ? (
                <Brain className="h-4 w-4 text-primary" />
              ) : (
                <span className="text-xs font-bold text-indigo-700">Eu</span>
              )}
            </div>
            <div
              className={cn(
                'rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[78%] shadow-sm',
                msg.role === 'bot'
                  ? 'bg-slate-800/95 border border-slate-700 text-slate-100 rounded-tl-sm'
                  : 'bg-primary text-primary-foreground font-medium rounded-tr-sm',
              )}
            >
              {msg.role === 'bot' && (
                <span className="text-xs font-bold text-[#00FFFF] flex items-center gap-1 mb-1">
                  <Brain className="h-3.5 w-3.5" /> NeuroFlow AI
                </span>
              )}
              <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-medium">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-slate-800/95 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="text-xs font-bold text-[#00FFFF] whitespace-nowrap">
                NeuroFlow AI
              </span>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 rounded-full bg-[#00FFFF] animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
              <span className="text-xs text-slate-300 ml-1">IA processando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isComplete && currentQuestion && (
        <div className="border-t border-slate-800 pt-4 space-y-2.5">
          {currentQuestion.type === 'multiple-choice' && currentQuestion.choices ? (
            <div className="flex flex-wrap gap-2">
              {currentQuestion.choices.map((choice) => (
                <Button
                  key={choice}
                  variant="outline"
                  onClick={() => handleSend(choice)}
                  disabled={isSaving || isTyping}
                  className="rounded-full text-sm h-auto py-2.5 px-4 bg-slate-800/90 text-slate-100 border-slate-700 hover:border-[#00FFFF] hover:bg-[#00FFFF]/10 hover:text-white transition-all"
                >
                  {choice}
                </Button>
              ))}
            </div>
          ) : (
            <>
              {currentQuestion.quickReplies && currentQuestion.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.quickReplies.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend(reply)}
                      disabled={isSaving || isTyping}
                      className="rounded-full text-xs sm:text-sm h-auto py-2 px-3.5 bg-slate-800/90 text-slate-100 border-slate-700 hover:bg-[#00FFFF]/10 hover:border-[#00FFFF]/50 hover:text-white"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-[#00FFFF]" />
                      {reply}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua resposta..."
                  disabled={isSaving || isTyping}
                  className="rounded-full bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus-visible:ring-primary focus-visible:border-primary text-sm sm:text-base px-4 py-2.5"
                />
                <Button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isSaving || isTyping}
                  className="rounded-full h-10 w-10 p-0 shrink-0 bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#0A192F]" />
                  ) : (
                    <Send className="h-4 w-4 text-[#0A192F]" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      <TmsSafetyAlert
        open={tmsAlertOpen}
        onOpenChange={setTmsAlertOpen}
        message={tmsAlertMessage}
        level={tmsAlertLevel}
      />
    </div>
  )
}
