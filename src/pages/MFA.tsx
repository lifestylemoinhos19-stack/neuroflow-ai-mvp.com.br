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
    <div className="min-h-screen flex items-center justify-center bg-[#0A192F] px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          className="mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Login
        </Button>
        <Card className="shadow-subtle border-white/10 bg-white/5">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 bg-[#00FFFF]/10 rounded-full flex items-center justify-center relative">
                <ShieldCheck className="h-6 w-6 text-[#00FFFF]" />
                <span className="absolute -inset-1 rounded-full border-2 border-[#00FFFF]/20 animate-pulse-ring" />
              </div>
            </div>
            <CardTitle className="text-2xl font-display font-bold text-white">
              Verificação em 2 Etapas
            </CardTitle>
            <CardDescription className="text-slate-400">
              Digite o código de 6 dígitos do seu autenticador. (Dica: 123456)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={isLoading}
              containerClassName="gap-2"
            >
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot
                  index={0}
                  className="bg-white/10 border-[#00FFFF]/40 text-white placeholder:text-white/40 ring-[#00FFFF] focus-visible:ring-[#00FFFF]"
                />
                <InputOTPSlot
                  index={1}
                  className="bg-white/10 border-[#00FFFF]/40 text-white placeholder:text-white/40 ring-[#00FFFF] focus-visible:ring-[#00FFFF]"
                />
                <InputOTPSlot
                  index={2}
                  className="bg-white/10 border-[#00FFFF]/40 text-white placeholder:text-white/40 ring-[#00FFFF] focus-visible:ring-[#00FFFF]"
                />
              </InputOTPGroup>
              <InputOTPSeparator className="text-[#00FFFF]/60" />
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot
                  index={3}
                  className="bg-white/10 border-[#00FFFF]/40 text-white placeholder:text-white/40 ring-[#00FFFF] focus-visible:ring-[#00FFFF]"
                />
                <InputOTPSlot
                  index={4}
                  className="bg-white/10 border-[#00FFFF]/40 text-white placeholder:text-white/40 ring-[#00FFFF] focus-visible:ring-[#00FFFF]"
                />
                <InputOTPSlot
                  index={5}
                  className="bg-white/10 border-[#00FFFF]/40 text-white placeholder:text-white/40 ring-[#00FFFF] focus-visible:ring-[#00FFFF]"
                />
              </InputOTPGroup>
            </InputOTP>
            <div className="text-sm text-slate-400">
              O código expira em <span className="font-medium text-white">{timeLeft}s</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
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
