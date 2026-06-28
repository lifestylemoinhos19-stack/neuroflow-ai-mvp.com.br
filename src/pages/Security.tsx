import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Key,
  Smartphone,
  Laptop,
  Download,
  Lock,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ProfileData {
  privacy_consent: boolean | null
  role: string | null
  full_name: string | null
}

export default function Security() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('privacy_consent, role, full_name')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as ProfileData)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const toggleConsent = async (consent: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update({
        privacy_consent: consent,
        privacy_consent_accepted_at: consent ? new Date().toISOString() : null,
      })
      .eq('id', user.id)
      .select('privacy_consent, role, full_name')
      .single()
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o consentimento.',
      })
      return
    }
    setProfile(data as ProfileData)
    toast({
      title: consent ? 'Consentimento ativado' : 'Consentimento revogado',
      description: consent
        ? 'Seus dados serão processados conforme a LGPD.'
        : 'Seus dados não serão processados para fins analíticos.',
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
          Segurança & Privacidade
        </h1>
        <p className="text-slate-500">Gerencie a proteção da sua conta e dados de saúde.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-subtle border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-900">
              <Shield className="h-5 w-5 mr-2 text-emerald-600" /> Autenticação 2F (MFA)
            </CardTitle>
            <CardDescription>Exigir código extra no login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-emerald-900 font-bold">MFA via App</Label>
                <p className="text-sm text-emerald-700/80">Atualmente ativo e obrigatório.</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="pt-4 border-t border-emerald-100">
              <Button
                variant="outline"
                className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              >
                <Key className="h-4 w-4 mr-2" /> Gerenciar Chaves
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-slate-100">
          <CardHeader>
            <CardTitle>Códigos de Recuperação</CardTitle>
            <CardDescription>Use caso perca acesso ao seu app MFA.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Você tem 8 códigos não utilizados. Guarde-os em um local seguro.
            </p>
            <Button variant="secondary" className="w-full">
              <Download className="h-4 w-4 mr-2" /> Baixar Códigos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle border-indigo-100 bg-indigo-50/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2 text-indigo-600" /> Privacidade & LGPD
          </CardTitle>
          <CardDescription>Gerencie seu consentimento de tratamento de dados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-100">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Consentimento de Tratamento de Dados</p>
                <p className="text-sm text-slate-500">
                  Permite o processamento dos seus dados de saúde para análise pela IA.
                </p>
              </div>
            </div>
            <Switch
              checked={profile?.privacy_consent ?? false}
              disabled={loading}
              onCheckedChange={toggleConsent}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-100">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Criptografia AES-256</p>
                <p className="text-sm text-slate-500">
                  Seus dados PII e respostas de anamnese são criptografados em repouso.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
              Ativo
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" /> Exportar Meus Dados
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              Solicitar Exclusão
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </CardFooter>
      </Card>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
          <CardDescription>Dispositivos atualmente conectados à sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center">
              <Laptop className="h-8 w-8 text-slate-400 mr-4" />
              <div>
                <p className="font-medium text-slate-900">MacBook Pro - Safari</p>
                <p className="text-xs text-slate-500">São Paulo, BR • Sessão atual</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
              Ativo
            </Badge>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-slate-400 mr-4" />
              <div>
                <p className="font-medium text-slate-900">iPhone 14 - App Nativo</p>
                <p className="text-xs text-slate-500">São Paulo, BR • Há 2 dias</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Revogar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
