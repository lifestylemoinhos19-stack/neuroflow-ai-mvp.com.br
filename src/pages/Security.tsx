import { useState, useEffect } from 'react'
import { PublicPageShell } from '@/components/PublicPageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Key, HeartPulse, Download, AlertTriangle, Laptop } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function Security() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setIsAuthed(true)
        const { data } = await supabase
          .from('profiles')
          .select('privacy_consent')
          .eq('id', user.id)
          .single()
        if (data) setPrivacyConsent(data.privacy_consent ?? false)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const toggleConsent = async (consent: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({
        privacy_consent: consent,
        privacy_consent_accepted_at: consent ? new Date().toISOString() : null,
      })
      .eq('id', user.id)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar.' })
      return
    }
    setPrivacyConsent(consent)
    toast({ title: consent ? 'Consentimento ativado' : 'Consentimento revogado' })
  }

  return (
    <PublicPageShell>
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Segurança &amp; Privacidade
        </h1>
        <p className="text-base text-white/70 leading-relaxed max-w-2xl">
          Gerencie a proteção da sua conta e dados de saúde. O NeuroFlow AI segue os mais rigorosos
          padrões de segurança e conformidade.
        </p>
      </div>

      <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Lock className="h-5 w-5 text-[#00FFFF]" /> Proteção de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base text-white/70 leading-relaxed">
          <p>
            Seus dados são protegidos com criptografia AES-256 em repouso e TLS 1.3 em trânsito.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Dados PII (nome, e-mail, documento) são criptografados no banco de dados</li>
            <li>Respostas de anamnese utilizam criptografia específica via funções PostgreSQL</li>
            <li>Acesso controlado por RLS (Row-Level Security) do Supabase</li>
            <li>Conformidade total com a LGPD (Lei nº 13.709/2018)</li>
          </ul>
          <Badge variant="outline" className="text-[#3DFFB0] border-[#3DFFB0]/30 bg-[#3DFFB0]/10">
            Criptografia Ativa
          </Badge>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Shield className="h-5 w-5 text-[#00FFFF]" /> Política de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base text-white/70 leading-relaxed">
          <p>Você tem controle total sobre como seus dados de saúde são processados.</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Consentimento explícito é necessário para processamento pela IA</li>
            <li>Você pode revogar o consentimento a qualquer momento</li>
            <li>Solicite exportação ou exclusão dos seus dados quando desejar</li>
            <li>Nenhum dado é compartilhado com terceiros sem consentimento</li>
          </ul>
          {isAuthed ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#0A192F] border border-[#00FFFF]/10">
              <div>
                <p className="font-medium text-white">Consentimento de Tratamento de Dados</p>
                <p className="text-sm text-white/50">
                  Permite processamento dos seus dados para análise pela IA.
                </p>
              </div>
              <Switch checked={privacyConsent} disabled={loading} onCheckedChange={toggleConsent} />
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#0A192F] border border-[#00FFFF]/10">
              <p className="text-sm text-white/50">
                <Link to="/login" className="text-[#00FFFF] hover:underline">
                  Faça login
                </Link>{' '}
                para gerenciar seu consentimento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <HeartPulse className="h-5 w-5 text-[#00FFFF]" /> Segurança do Biofeedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base text-white/70 leading-relaxed">
          <p>
            O sistema de biofeedback foi projetado com orientação clínica para máxima segurança.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Sensores não invasivos: câmera (rPPG) ou sensor Bluetooth de dedo</li>
            <li>Não há estimulação elétrica ou intervenção física no usuário</li>
            <li>Dados de frequência cardíaca processados localmente quando possível</li>
            <li>Sessões são limitadas em duração para evitar fadiga</li>
            <li>Sistema não substitui avaliação médica presencial</li>
          </ul>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#FF5C5C]/5 border border-[#FF5C5C]/20">
            <AlertTriangle className="h-5 w-5 text-[#FF5C5C] shrink-0 mt-0.5" />
            <p className="text-sm text-white/60">
              Este sistema é uma ferramenta de apoio e NÃO substitui a avaliação médica para
              diagnóstico.
            </p>
          </div>
        </CardContent>
      </Card>

      {isAuthed && (
        <>
          <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Key className="h-5 w-5 text-[#00FFFF]" /> Autenticação 2F (MFA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base text-white/70 leading-relaxed">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">MFA via App</p>
                  <p className="text-sm text-white/50">Atualmente ativo e obrigatório.</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[#3DFFB0] border-[#3DFFB0]/30 bg-[#3DFFB0]/10"
                >
                  Ativo
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full border-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF]/5"
              >
                <Download className="h-4 w-4 mr-2" /> Baixar Códigos de Recuperação
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
            <CardHeader>
              <CardTitle className="text-xl text-white">Sessões Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0A192F] border border-[#00FFFF]/10">
                <div className="flex items-center gap-3">
                  <Laptop className="h-6 w-6 text-white/40" />
                  <div>
                    <p className="font-medium text-white">Navegador Web</p>
                    <p className="text-xs text-white/50">Sessão atual</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[#3DFFB0] border-[#3DFFB0]/30 bg-[#3DFFB0]/10"
                >
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 border-[#00FFFF]/20 text-white hover:bg-white/5"
            >
              <Download className="h-4 w-4 mr-2" /> Exportar Meus Dados
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#FF5C5C]/20 text-[#FF5C5C] hover:bg-[#FF5C5C]/5"
            >
              Solicitar Exclusão
            </Button>
          </div>
        </>
      )}

      <div className="mt-10 pt-6 border-t border-[#00FFFF]/10 flex flex-wrap gap-4 text-sm">
        <Link to="/terms" className="text-white/50 hover:text-[#00FFFF] transition-colors">
          Termos de Uso
        </Link>
        <Link to="/about" className="text-white/50 hover:text-[#00FFFF] transition-colors">
          Institucional
        </Link>
      </div>
    </PublicPageShell>
  )
}
