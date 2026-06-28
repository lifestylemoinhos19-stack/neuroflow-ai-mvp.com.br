import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { anamnesisQuestions } from '@/lib/anamnesis-questions'
import { createAnamnesisSession, completeAnamnesisSession } from '@/services/anamnesis'
import { saveSingleResponse, logAuditAction } from '@/services/scales'
import { useToast } from '@/hooks/use-toast'

interface ChatMessage {
  role: 'bot' | 'user'
  content: string
}

const chatQuestions = anamnesisQuestions.filter(
  (q) => q.type === 'free-text' || q.type === 'multiple-choice',
)

export default function Anamnesis() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createAnamnesisSession().then((session) => {
      if (session) {
        setSessionId(session.id)
        logAuditAction('session_start', 'anamnesis_sessions', session.id)
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
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const currentQuestion = chatQuestions[currentIndex]

  const handleSend = useCallback(
    async (value: string) => {
      if (!value.trim() || !sessionId || !currentQuestion) return
      setInputValue('')
      setMessages((prev) => [...prev, { role: 'user', content: value }])
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
        logAuditAction('session_complete', 'anamnesis_sessions', sessionId)
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

  const handleChoice = (choice: string) => handleSend(choice)

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
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Entrevista Adaptativa
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Pergunta {Math.min(currentIndex + 1, chatQuestions.length)} de {chatQuestions.length}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2.5 animate-fade-in-up',
              msg.role === 'user' ? 'flex-row-reverse' : '',
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
                'rounded-2xl px-4 py-2.5 max-w-[80%]',
                msg.role === 'bot'
                  ? 'bg-white border border-slate-100 text-slate-700'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex gap-1">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 rounded-full bg-slate-300 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isComplete && currentQuestion && (
        <div className="border-t border-slate-100 pt-4">
          {currentQuestion.type === 'multiple-choice' && currentQuestion.choices ? (
            <div className="space-y-2">
              {currentQuestion.choices.map((choice) => (
                <Button
                  key={choice}
                  variant="outline"
                  onClick={() => handleChoice(choice)}
                  disabled={isSaving || isTyping}
                  className="w-full justify-start rounded-xl text-sm h-auto py-3 px-4"
                >
                  {choice}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua resposta..."
                disabled={isSaving || isTyping}
                className="rounded-full bg-slate-50"
              />
              <Button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isSaving || isTyping}
                className="rounded-full h-10 w-10 p-0 shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
