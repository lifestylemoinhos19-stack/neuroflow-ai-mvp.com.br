import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function MFA() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const { verifyMfa, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const handleSubmit = async () => {
    if (code.length !== 6) return
    setIsLoading(true)
    try {
      await verifyMfa(code)
      toast({ title: 'Verificado', description: 'Acesso seguro concedido.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro de verificação', description: error.message })
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (code.length === 6) {
      handleSubmit()
    }
  }, [code])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <Button variant="ghost" size="sm" onClick={() => logout()} className="mb-4 text-slate-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Login
        </Button>
        <Card className="shadow-subtle border-slate-100">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center relative">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <span className="absolute -inset-1 rounded-full border-2 border-emerald-500/20 animate-pulse-ring" />
              </div>
            </div>
            <CardTitle className="text-2xl font-display font-bold">
              Verificação em 2 Etapas
            </CardTitle>
            <CardDescription>
              Digite o código de 6 dígitos do seu autenticador. (Dica: 123456)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="text-sm text-slate-500">
              O código expira em <span className="font-medium text-slate-800">{timeLeft}s</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button
              variant="outline"
              className="w-full"
              disabled={timeLeft > 0 || isLoading}
              onClick={() => setTimeLeft(60)}
            >
              Reenviar código
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
