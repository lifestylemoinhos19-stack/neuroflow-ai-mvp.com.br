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
import { Brain, Loader2, Lock, UserPlus, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('lifestylemoinhos19@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        const { error } = await signUp(email, password, privacyConsent)
        if (error) {
          toast({ variant: 'destructive', title: 'Erro no cadastro', description: error })
        } else {
          toast({ title: 'Conta criada!', description: 'Faça login para continuar.' })
          setIsSignUp(false)
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          toast({ variant: 'destructive', title: 'Erro no login', description: error })
        } else {
          toast({
            title: 'Autenticação em duas etapas necessária',
            description: 'Verifique seu dispositivo. (Dica: 123456)',
          })
        }
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>
        <Card className="shadow-subtle border-slate-100">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-display font-bold">NeuroFlow AI</CardTitle>
            <CardDescription>
              {isSignUp ? 'Crie sua conta segura' : 'Acesse seu painel clínico seguro'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 focus-visible:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 focus-visible:bg-white"
                />
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-50 focus-visible:bg-white"
                  />
                </div>
              )}
              <div className="flex items-start space-x-3 rounded-lg bg-slate-50 p-3 border border-slate-100">
                <Checkbox
                  id="privacy"
                  checked={privacyConsent}
                  onCheckedChange={(v) => setPrivacyConsent(v === true)}
                  className="mt-0.5"
                />
                <div className="text-sm leading-relaxed">
                  <Label htmlFor="privacy" className="cursor-pointer font-medium text-slate-700">
                    Aceito os{' '}
                    <a href="#" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidade (LGPD)
                    </a>
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seus dados de saúde serão criptografados (AES-256) e tratados conforme a LGPD.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isSignUp ? (
                  <UserPlus className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {isSignUp ? 'Criar conta' : 'Entrar com segurança'}
              </Button>
              <div className="text-center text-sm text-slate-500">
                {isSignUp ? (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-primary hover:underline font-medium inline-flex items-center"
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
                      onClick={() => setIsSignUp(true)}
                      className="text-primary hover:underline font-medium inline-flex items-center"
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
