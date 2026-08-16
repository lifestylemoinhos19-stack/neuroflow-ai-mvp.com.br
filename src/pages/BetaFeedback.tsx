import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CrystalParticles } from '@/components/CrystalParticles'
import { Diamond, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveBetaFeedback } from '@/services/beta-feedback'
import { toast } from 'sonner'

export default function BetaFeedback() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { sessionId?: string } | null

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [childExperience, setChildExperience] = useState('')
  const [parentComments, setParentComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showParticles, setShowParticles] = useState(true)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação de 1 a 5 cristais.')
      return
    }
    setSubmitting(true)
    const { error } = await saveBetaFeedback({
      rating,
      parent_comments: parentComments,
      child_experience: childExperience,
      session_id: state?.sessionId || null,
    })
    setSubmitting(false)

    if (error) {
      toast.error('Erro ao salvar feedback: ' + error)
      return
    }

    setSubmitted(true)
    setShowParticles(true)
    toast.success('Feedback enviado com sucesso! Obrigado pela participação.')

    setTimeout(() => {
      navigate('/')
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-medium">
        <CrystalParticles show={showParticles} />
        <div className="z-10 text-center animate-fade-in-up">
          <CheckCircle2 className="h-16 w-16 text-[#00FFFF] mx-auto mb-4" />
          <h1 className="text-2xl font-medium text-white mb-2">Obrigado pelo seu feedback!</h1>
          <p className="text-white/85 font-medium text-sm">
            Sua opinião nos ajuda a melhorar a experiência do Explorador da Calma.
          </p>
          <p className="text-white/70 font-medium text-xs mt-4">Redirecionando para o painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-medium">
      <CrystalParticles show={showParticles} />

      <div className="absolute inset-0 pointer-events-none opacity-10">
        <Diamond
          className="absolute top-20 left-10 text-[#00FFFF] h-6 w-6 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute bottom-32 right-16 text-[#00FFFF] h-5 w-5 animate-float"
          fill="currentColor"
          style={{ animationDuration: '5s' }}
        />
      </div>

      <div className="z-10 max-w-lg w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <span className="text-[#00FFFF]/85 text-sm font-medium tracking-wide uppercase">
            Feedback Beta
          </span>
          <h1 className="text-3xl font-medium text-white tracking-tight mt-2 mb-2">
            Conte-nos sua experiência
          </h1>
          <p className="text-white/85 font-medium text-sm">
            Sua opinião é essencial para refinarmos o Explorador da Calma
          </p>
        </div>

        <div className="bg-white/5 rounded-3xl border border-[#00FFFF]/20 p-6 sm:p-8 backdrop-blur-sm space-y-6">
          <div>
            <Label className="text-white/80 font-medium text-sm mb-3 block">
              Como você avalia a experiência? (1 a 5 cristais)
            </Label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Diamond
                    className={cn(
                      'h-10 w-10 transition-colors',
                      (hoverRating || rating) >= value ? 'text-[#00FFFF]' : 'text-white/70',
                    )}
                    fill="currentColor"
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-white/75 font-medium mt-2">
              {rating === 0
                ? 'Toque nos cristais para avaliar'
                : rating === 1
                  ? 'Precisa melhorar'
                  : rating === 2
                    ? 'Abaixo das expectativas'
                    : rating === 3
                      ? 'Experiência razoável'
                      : rating === 4
                        ? 'Boa experiência'
                        : 'Experiência incrível!'}
            </p>
          </div>

          <div>
            <Label
              htmlFor="child-experience"
              className="text-white/80 font-medium text-sm mb-2 block"
            >
              Como foi a experiência do seu filho?
            </Label>
            <Textarea
              id="child-experience"
              value={childExperience}
              onChange={(e) => setChildExperience(e.target.value)}
              placeholder="Descreva como seu filho reagiu ao jogo, se se engajou, se percebeu mudanças..."
              className="bg-white/5 border-[#00FFFF]/20 text-white placeholder:text-white/70 rounded-xl min-h-[100px] resize-none focus-visible:border-[#00FFFF]/40"
            />
          </div>

          <div>
            <Label
              htmlFor="parent-comments"
              className="text-white/80 font-medium text-sm mb-2 block"
            >
              Observações dos pais
            </Label>
            <Textarea
              id="parent-comments"
              value={parentComments}
              onChange={(e) => setParentComments(e.target.value)}
              placeholder="Compartilhe suas impressões como responsável: facilidade de uso, relevância do biofeedback, sugestões..."
              className="bg-white/5 border-[#00FFFF]/20 text-white placeholder:text-white/70 rounded-xl min-h-[100px] resize-none focus-visible:border-[#00FFFF]/40"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] font-medium rounded-full h-12"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {submitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1 bg-white/5 border-[#00FFFF]/20 text-white hover:bg-white/10 font-medium rounded-full h-12"
            >
              Voltar ao Painel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
