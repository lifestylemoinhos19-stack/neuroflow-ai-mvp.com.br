import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Brain, Loader2, Lock, UserPlus, LogIn, AlertCircle, MailCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const { signIn, signUp, resendConfirmation } = useAuth()
  const { toast } = useToast()
  const hasGuestData =
    typeof window !== 'undefined' && !!localStorage.getItem('neuroflow_guest_token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setEmailError(null)
    setShowEmailConfirmation(false)
    setCanResend(false)
    setResendMessage(null)

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Erro', description: 'As senhas não coincidem.' })
        return
      }
      if (!privacyConsent) {
        toast({
          variant: 'destructive',
          title: 'Consentimento necessário',
          description: 'Você deve aceitar os Termos de Uso e a Política de Privacidade (LGPD).',
        })
        return
      }
    }

    setIsLoading(true)
    try {
      if (isSignUp) {
        const { error, needsEmailConfirmation } = await signUp(email, password, privacyConsent)
        if (error) {
          if (error.toLowerCase().includes('já') || error.toLowerCase().includes('already')) {
            setEmailError('Este e-mail já está cadastrado.')
          } else {
            toast({ variant: 'destructive', title: 'Erro no cadastro', description: error })
          }
        } else if (needsEmailConfirmation) {
          setShowEmailConfirmation(true)
          toast({
            title: 'Confirmação necessária',
            description: 'Verifique seu e-mail para o link de confirmação.',
          })
        } else {
          toast({ title: 'Conta criada!', description: 'Faça login para continuar.' })
          setIsSignUp(false)
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setLoginError(error)
          const lc = error.toLowerCase()
          setCanResend(lc.includes('não confirmado') || lc.includes('not confirmed'))
          toast({ variant: 'destructive', title: 'Erro no login', description: error })
        } else {
          toast({
            title: 'Autenticação em duas etapas necessária',
            description: 'Verifique seu dispositivo. (Dica: 123456)',
          })
        }
      }
    } catch (err: any) {
      setLoginError('Erro inesperado. Tente novamente.')
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) return
    setResending(true)
    setResendMessage(null)
    try {
      const { error } = await resendConfirmation(email)
      if (error) {
        setResendMessage(error)
      } else {
        setResendMessage(
          'E-mail de confirmação reenviado! Verifique sua caixa de entrada e o spam.',
        )
        setCanResend(false)
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A192F] px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-[#00FFFF]/10 rounded-2xl flex items-center justify-center">
            <Brain className="h-8 w-8 text-[#00FFFF]" />
          </div>
        </div>
        <Card className="shadow-subtle border-[#00FFFF]/20 bg-[#0A192F]/80">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-display font-bold text-white">
              NeuroFlow AI
            </CardTitle>
            <CardDescription className="text-white/85">
              {isSignUp ? 'Crie sua conta segura' : 'Acesse seu painel clínico seguro'}
            </CardDescription>
            {hasGuestData && !isSignUp && (
              <p className="text-xs text-[#00FFFF] bg-[#00FFFF]/10 rounded-lg p-2 mt-2 border border-[#00FFFF]/20">
                Suas avaliações anteriores serão vinculadas automaticamente à sua conta.
              </p>
            )}
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {showEmailConfirmation && (
                <div className="flex items-start gap-3 rounded-lg bg-[#00FFFF]/10 p-4 border border-[#00FFFF]/30 animate-fade-in">
                  <MailCheck className="h-5 w-5 text-[#00FFFF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#00FFFF]">
                      Verifique seu e-mail para o link de confirmação
                    </p>
                    <p className="text-xs text-white/85 mt-1">
                      Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link
                      para ativar sua conta.
                    </p>
                  </div>
                </div>
              )}
              {canResend && (
                <div className="flex items-start gap-3 rounded-lg bg-amber-400/10 p-4 border border-amber-400/30 animate-fade-in">
                  <MailCheck className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-200">
                      Não recebeu o e-mail de confirmação?
                    </p>
                    <p className="text-xs text-white/85 mt-1 mb-2">
                      Podemos reenviar o link de ativação para <strong>{email}</strong>. O Supabase
                      limita o envio a 4 e-mails/hora no plano gratuito.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={resending || !email}
                      className="bg-amber-400 text-slate-950 hover:bg-amber-400/90"
                    >
                      {resending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MailCheck className="h-4 w-4 mr-2" />
                      )}
                      Reenviar e-mail
                    </Button>
                  </div>
                </div>
              )}
              {resendMessage && (
                <div className="flex items-start gap-3 rounded-lg bg-[#00FFFF]/10 p-3 border border-[#00FFFF]/30 animate-fade-in">
                  <MailCheck className="h-5 w-5 text-[#00FFFF] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#00FFFF]">{resendMessage}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(null)
                    setLoginError(null)
                  }}
                  className="bg-white/5 border-[#00FFFF]/40 text-[#E6F1FF] placeholder:text-white/70 focus-visible:border-[#00FFFF] focus-visible:ring-[#00FFFF]/30"
                />
                {emailError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setLoginError(null)
                  }}
                  className="bg-white/5 border-[#00FFFF]/40 text-[#E6F1FF] placeholder:text-white/70 focus-visible:border-[#00FFFF] focus-visible:ring-[#00FFFF]/30"
                />
                {loginError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/90">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-[#00FFFF]/40 text-[#E6F1FF] placeholder:text-white/70 focus-visible:border-[#00FFFF] focus-visible:ring-[#00FFFF]/30"
                  />
                </div>
              )}
              <div className="flex items-start space-x-3 rounded-lg bg-white/5 p-3 border border-white/10">
                <Checkbox
                  id="privacy"
                  checked={privacyConsent}
                  onCheckedChange={(v) => setPrivacyConsent(v === true)}
                  className="mt-0.5 border-white/30"
                />
                <div className="text-sm leading-relaxed">
                  <Label htmlFor="privacy" className="cursor-pointer font-medium text-white/80">
                    Li e aceito os{' '}
                    <a href="#" className="text-[#00FFFF] hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="text-[#00FFFF] hover:underline">
                      Política de Privacidade (LGPD)
                    </a>
                  </Label>
                  <p className="text-xs text-white/70 mt-0.5">
                    Seus dados de saúde serão criptografados (AES-256) e tratados conforme a LGPD.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isSignUp ? (
                  <UserPlus className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {isSignUp ? 'Criar conta' : 'Entrar com segurança'}
              </Button>
              <div className="text-center text-sm text-white/75">
                {isSignUp ? (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false)
                        setLoginError(null)
                        setEmailError(null)
                        setShowEmailConfirmation(false)
                        setCanResend(false)
                        setResendMessage(null)
                      }}
                      className="text-[#00FFFF] hover:underline font-medium inline-flex items-center"
                    >
                      <LogIn className="h-3 w-3 mr-1" />
                      Entrar
                    </button>
                  </>
                ) : (
                  <>
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true)
                        setLoginError(null)
                        setEmailError(null)
                        setCanResend(false)
                        setResendMessage(null)
                      }}
                      className="text-[#00FFFF] hover:underline font-medium inline-flex items-center"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Criar conta
                    </button>
                  </>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
