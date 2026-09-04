import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Scale,
  FileDown,
  MessageSquarePlus,
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  User,
  ArrowRight,
  ClipboardList,
  Layers,
  FileCheck,
  LineChart as LineChartIcon,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'
import { CLINIC_BRANDING } from '@/lib/clinic-branding'
import { ClinicalFeedbackDialog } from '@/components/ClinicalFeedbackDialog'
import { PatientHistoryDialog } from '@/components/PatientHistoryDialog'
import { exportReport } from '@/lib/pdf-export'
import { generateConsolidatedPatientPdf } from '@/lib/laudo-consolidado-pdf'
import { FocusAnalytics } from '@/components/FocusAnalytics'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  getClinicalDashboardData,
  ClinicalSessionItem,
  ClinicalDashboardMetrics,
  UNIDENTIFIED_PATIENT_LABEL,
} from '@/services/clinical-dashboard'
import { translateStatus } from '@/services/admin-sessions'
import type { SessionWithRisk } from '@/services/sessions'

export default function Dashboard() {
  const { isAdmin, isDoctor, user } = useAuth()
  const isClinicalStaff = isAdmin || isDoctor

  const [sessions, setSessions] = useState<ClinicalSessionItem[]>([])
  const [metrics, setMetrics] = useState<ClinicalDashboardMetrics>({
    totalAssessments: 0,
    completedCount: 0,
    inProgressCount: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    identifiedPatientsCount: 0,
    uniquePatientsCount: 0,
    pendingAssignmentsCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null)
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<{
    guestId: string
    patientName: string
  } | null>(null)
  const [generatingConsolidatedId, setGeneratingConsolidatedId] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending'>(
    'all',
  )
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await getClinicalDashboardData(isClinicalStaff)
      setSessions(res.sessions)
      setMetrics(res.metrics)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [isClinicalStaff])

  // Filtragem local das sessões
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Filtro de texto (nome do paciente, tipo de teste, status)
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase()
        const matchName = s.patient_name.toLowerCase().includes(query)
        const matchType = s.type.toLowerCase().includes(query)
        const matchStatus = translateStatus(s.status).toLowerCase().includes(query)
        if (!matchName && !matchType && !matchStatus) return false
      }

      // Filtro de status
      if (statusFilter === 'completed' && s.status !== 'completed') return false
      if (
        statusFilter === 'in_progress' &&
        s.status !== 'in_progress' &&
        s.status !== 'in-progress'
      )
        return false
      if (statusFilter === 'pending' && s.status !== 'pending') return false

      // Filtro de risco
      if (riskFilter !== 'all' && s.riskLevel !== riskFilter) return false

      return true
    })
  }, [sessions, searchFilter, statusFilter, riskFilter])

  const overallRisk =
    metrics.highRiskCount > 0
      ? 'high'
      : metrics.mediumRiskCount > 0
        ? 'medium'
        : metrics.lowRiskCount > 0
          ? 'low'
          : null

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      // Converte para o modelo SessionWithRisk esperado pelo gerador de PDF
      const pdfSessions: SessionWithRisk[] = filteredSessions.map((s) => ({
        id: s.session_id,
        status: s.status,
        started_at: s.started_at,
        completed_at: s.completed_at,
        riskLevel: s.riskLevel,
        mchatScore: s.mchatScore,
        snapivInattention: s.snapivInattention,
        snapivHyperactivity: s.snapivHyperactivity,
        responseCount: s.responseCount,
      }))
      exportReport(pdfSessions)
      setExporting(false)
    }, 400)
  }

  const statusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'completed') {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-200 font-medium flex items-center gap-1 w-fit"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Concluída
        </Badge>
      )
    }
    if (s === 'pending') {
      return (
        <Badge
          variant="outline"
          className="bg-[#FAF5EB] text-[#7B5B3A] border-[#C4A35A]/40 font-medium flex items-center gap-1 w-fit"
        >
          <Clock className="h-3 w-3 text-[#C4A35A]" />
          Pendente
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-800 border-amber-200 font-medium flex items-center gap-1 w-fit"
      >
        <Clock className="h-3 w-3 text-amber-600" />
        Em Progresso
      </Badge>
    )
  }

  const riskBadge = (level: string | null) => {
    if (!level) return <span className="text-slate-400 text-xs">—</span>
    const config = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-amber-100 text-amber-800 border-amber-300',
      low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    }
    const labels = { high: 'Risco Alto', medium: 'Risco Médio', low: 'Risco Baixo' }
    return (
      <span
        className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1',
          config[level as keyof typeof config],
        )}
      >
        {level === 'high' && '⚠️ '}
        {labels[level as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Destaque com Identidade Casa Branca Saúde */}
      <div className="rounded-2xl bg-gradient-to-br from-[#3E2723] via-[#7B5B3A] to-[#6D5D4B] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#C4A35A]/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#C4A35A]/20 to-transparent blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5EB]/15 text-[#FAF5EB] border border-[#C4A35A]/40 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#C4A35A]" />
                {CLINIC_BRANDING.name} &bull; Moinhos de Vento
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="h-3 w-3" /> LGPD &amp; PII Descriptografado
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
              Dashboard Clínico &bull; Monitoramento de Pacientes
            </h1>
            <p className="text-[#FAF5EB]/85 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
              Visão clínica centralizada: identificação de pacientes, acompanhamento de escalas,
              análises de risco DSM-5-TR / CID-11 e gestão diagnóstica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboard}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-full h-11 px-4"
              title="Atualizar dados"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || filteredSessions.length === 0}
              className="bg-[#C4A35A] hover:bg-[#b09045] text-slate-950 font-bold rounded-full h-11 px-6 shadow-lg transition-transform active:scale-95"
            >
              {exporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Exportar Relatório PDF
            </Button>
          </div>
        </div>

        {/* Barra de atalhos rápidos clínicos */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#FAF5EB]/70 uppercase tracking-wider mr-2">
            Acesso Rápido:
          </span>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-[#FAF5EB]/20 hover:bg-[#FAF5EB]/30 text-white border border-[#C4A35A]/30 text-xs rounded-full h-8 px-3"
          >
            <Link to="/anamnesis">
              <ClipboardList className="h-3.5 w-3.5 mr-1 text-[#C4A35A]" /> Nova Anamnese
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-[#FAF5EB]/20 hover:bg-[#FAF5EB]/30 text-white border border-[#C4A35A]/30 text-xs rounded-full h-8 px-3"
          >
            <Link to="/scales">
              <Layers className="h-3.5 w-3.5 mr-1 text-[#C4A35A]" /> Aplicar Escala
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-[#FAF5EB]/20 hover:bg-[#FAF5EB]/30 text-white border border-[#C4A35A]/30 text-xs rounded-full h-8 px-3"
          >
            <Link to="/mini">
              <FileCheck className="h-3.5 w-3.5 mr-1 text-[#C4A35A]" /> MINI 5.0.0
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-[#FAF5EB]/20 hover:bg-[#FAF5EB]/30 text-white border border-[#C4A35A]/30 text-xs rounded-full h-8 px-3"
          >
            <Link to="/historico">
              <LineChartIcon className="h-3.5 w-3.5 mr-1 text-[#C4A35A]" /> Evolução Temporal
            </Link>
          </Button>
          {isAdmin && (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-[#FAF5EB]/20 hover:bg-[#FAF5EB]/30 text-white border border-[#C4A35A]/30 text-xs rounded-full h-8 px-3 ml-auto"
            >
              <Link to="/admin/painel">Painel Administrativo Completo &rarr;</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Disclaimers Médicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-[#C4A35A]/30 bg-[#FAF5EB]/70">
          <CardContent className="p-3.5 flex items-start gap-2.5">
            <Scale className="h-4 w-4 text-[#7B5B3A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6D5D4B] leading-relaxed">{TELEMEDICINE_DISCLAIMER.text}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/80">
          <CardContent className="p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-800 leading-relaxed">
              A soberania médica da {CLINIC_BRANDING.name} é absoluta. Todos os escores e métricas
              devem ser validados presencial ou telemedicamente pela equipe clínica.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Métricas em Destaque (Cores Casa Branca: marrom / dourado / bege) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total de Avaliações */}
        <Card className="border-[#7B5B3A]/20 bg-white shadow-subtle hover:border-[#7B5B3A]/40 transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#6D5D4B] uppercase tracking-wider">
                Total
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#FAF5EB] text-[#7B5B3A] flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-[#3E2723]">
              {loading ? <Skeleton className="h-8 w-12" /> : metrics.totalAssessments}
            </p>
            <p className="text-[11px] text-[#6D5D4B] mt-1">Sessões &amp; Escalas</p>
          </CardContent>
        </Card>

        {/* Pacientes Identificados */}
        <Card className="border-[#C4A35A]/30 bg-gradient-to-br from-[#FAF5EB] to-white shadow-subtle hover:border-[#C4A35A] transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#7B5B3A] uppercase tracking-wider">
                Pacientes
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#C4A35A]/20 text-[#7B5B3A] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-[#7B5B3A]">
              {loading ? <Skeleton className="h-8 w-12" /> : metrics.identifiedPatientsCount}
            </p>
            <p className="text-[11px] text-[#6D5D4B] mt-1">Identificados no sistema</p>
          </CardContent>
        </Card>

        {/* Concluídas */}
        <Card className="border-emerald-200 bg-white shadow-subtle hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Concluídas
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-700">
              {loading ? <Skeleton className="h-8 w-12" /> : metrics.completedCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Finalizadas com êxito</p>
          </CardContent>
        </Card>

        {/* Em Progresso */}
        <Card className="border-amber-200 bg-white shadow-subtle hover:border-amber-300 transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Em Andamento
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-amber-700">
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                metrics.inProgressCount + metrics.pendingAssignmentsCount
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Aguardando término</p>
          </CardContent>
        </Card>

        {/* Risco Alto */}
        <Card className="border-red-200 bg-white shadow-subtle hover:border-red-300 transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                Risco Alto
              </span>
              <div className="h-8 w-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-red-600">
              {loading ? <Skeleton className="h-8 w-12" /> : metrics.highRiskCount}
            </p>
            <p className="text-[11px] text-red-500 mt-1">Atenção prioritária</p>
          </CardContent>
        </Card>

        {/* Risco Médio / Baixo */}
        <Card className="border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Risco Médio/Baixo
              </span>
              <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-slate-800">
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                metrics.mediumRiskCount + metrics.lowRiskCount
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics.mediumRiskCount} médio &bull; {metrics.lowRiskCount} baixo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Panorama de Risco Geral da Clínica */}
      <Card className="shadow-subtle border-[#C4A35A]/30 bg-gradient-to-r from-white via-[#FAF5EB]/40 to-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              {(['high', 'medium', 'low'] as const).map((risk) => (
                <div key={risk} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'h-14 w-14 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-xs shadow-sm',
                      overallRisk === risk
                        ? cn(
                            risk === 'high'
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-110'
                              : risk === 'medium'
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50 scale-110'
                                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110',
                          )
                        : 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {risk === 'high' ? 'Alto' : risk === 'medium' ? 'Médio' : 'Baixo'}
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-bold',
                      overallRisk === risk ? 'text-[#3E2723]' : 'text-slate-400',
                    )}
                  >
                    {risk === 'high'
                      ? `${metrics.highRiskCount} sessões`
                      : risk === 'medium'
                        ? `${metrics.mediumRiskCount} sessões`
                        : `${metrics.lowRiskCount} sessões`}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7B5B3A]">
                Estatuto Clínico da Carteira
              </p>
              <p className="text-xl font-display font-bold text-[#3E2723]">
                {overallRisk === 'high'
                  ? '⚠️ Casos com Risco Elevado Requerem Revisão'
                  : overallRisk === 'medium'
                    ? '🔔 Indicadores em Nível Moderado'
                    : overallRisk === 'low'
                      ? '✅ Indicadores Estáveis em Risco Baixo'
                      : 'Nenhuma testagem computada'}
              </p>
              <p className="text-xs text-[#6D5D4B] mt-1">
                Visualização integrada de {metrics.totalAssessments} avaliações distribuídas entre{' '}
                {metrics.identifiedPatientsCount} pacientes cadastrados na Casa Branca Saúde.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Principal de Testagens com Identificação dos Pacientes */}
      <Card className="shadow-subtle border-slate-200">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-display text-[#3E2723]">
                <Activity className="h-5 w-5 text-[#7B5B3A]" /> Testagens e Avaliações Clínicas
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm">
                Lista nominal de pacientes com descriptografia PII em tempo real, status e
                indicadores de risco.
              </CardDescription>
            </div>

            {/* Contagem de registros exibidos */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-white border-[#C4A35A]/50 text-[#7B5B3A] font-semibold text-xs py-1 px-3"
              >
                {filteredSessions.length} {filteredSessions.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome do paciente, teste ou status..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-9 text-sm bg-white"
              />
            </div>

            <div className="sm:col-span-3 flex items-center gap-1">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'h-9 text-xs flex-1',
                  statusFilter === 'all' && 'bg-[#7B5B3A] hover:bg-[#6D5D4B] text-white',
                )}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
                className={cn(
                  'h-9 text-xs flex-1',
                  statusFilter === 'completed' && 'bg-emerald-700 hover:bg-emerald-800 text-white',
                )}
              >
                Concluídos
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
                className={cn(
                  'h-9 text-xs flex-1',
                  statusFilter === 'in_progress' && 'bg-amber-600 hover:bg-amber-700 text-white',
                )}
              >
                Em Andamento
              </Button>
            </div>

            <div className="sm:col-span-3 flex items-center gap-1">
              <Button
                variant={riskFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRiskFilter('all')}
                className={cn(
                  'h-9 text-xs flex-1',
                  riskFilter === 'all' && 'bg-[#7B5B3A] hover:bg-[#6D5D4B] text-white',
                )}
              >
                Qualquer Risco
              </Button>
              <Button
                variant={riskFilter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRiskFilter('high')}
                className={cn(
                  'h-9 text-xs flex-1',
                  riskFilter === 'high' && 'bg-red-600 hover:bg-red-700 text-white',
                )}
              >
                Alto
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-slate-500 font-medium">
                Nenhum registro encontrado com os filtros atuais.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchFilter('')
                  setStatusFilter('all')
                  setRiskFilter('all')
                }}
                className="text-xs text-[#7B5B3A] border-[#7B5B3A]/30"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-[#3E2723] min-w-[220px]">
                      Paciente
                    </TableHead>
                    <TableHead className="font-bold text-[#3E2723]">Avaliação / Escala</TableHead>
                    <TableHead className="font-bold text-[#3E2723]">Data</TableHead>
                    <TableHead className="font-bold text-[#3E2723]">Status</TableHead>
                    <TableHead className="font-bold text-[#3E2723]">Indicadores / Escore</TableHead>
                    <TableHead className="font-bold text-[#3E2723]">Nível de Risco</TableHead>
                    <TableHead className="font-bold text-[#3E2723] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((s) => {
                    const isUnidentified =
                      s.is_orphan || s.patient_name === UNIDENTIFIED_PATIENT_LABEL || !s.guest_id

                    const handleRowClick = () => {
                      if (!isUnidentified && s.guest_id) {
                        setSelectedPatientForHistory({
                          guestId: s.guest_id,
                          patientName: s.patient_name,
                        })
                      }
                    }

                    return (
                      <TableRow
                        key={s.id}
                        onClick={handleRowClick}
                        className={cn(
                          'transition-colors',
                          isUnidentified
                            ? 'hover:bg-slate-50/40 cursor-default'
                            : 'hover:bg-[#FAF5EB]/60 cursor-pointer group',
                        )}
                        title={
                          isUnidentified
                            ? 'Registro sem vínculo a paciente cadastrado'
                            : `Clique para abrir o histórico completo de ${s.patient_name}`
                        }
                      >
                        {/* 1. Nome do Paciente (Identificado ou Badge não identificado) */}
                        <TableCell>
                          {isUnidentified ? (
                            <Badge
                              variant="outline"
                              className="border-amber-400 bg-amber-50 text-amber-800 text-xs font-normal"
                            >
                              Paciente não identificado
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-[#FAF5EB] group-hover:bg-[#C4A35A]/20 border border-[#C4A35A]/50 text-[#7B5B3A] flex items-center justify-center shrink-0 font-bold text-xs shadow-xs transition-colors">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 group-hover:text-[#7B5B3A] text-sm truncate transition-colors flex items-center gap-1.5">
                                  {s.patient_name}
                                  <span className="text-[10px] font-normal text-[#C4A35A] opacity-0 group-hover:opacity-100 transition-opacity">
                                    &bull; Ver histórico
                                  </span>
                                </p>
                                {s.guest_id && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    ID: {s.guest_id.slice(0, 8)}...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        {/* 2. Tipo de Avaliação */}
                        <TableCell>
                          <span className="font-semibold text-[#7B5B3A] text-sm">{s.type}</span>
                        </TableCell>

                        {/* 3. Data */}
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {new Date(s.started_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </TableCell>

                        {/* 4. Status */}
                        <TableCell>{statusBadge(s.status)}</TableCell>

                        {/* 5. Escores / Indicadores */}
                        <TableCell className="text-sm">
                          {s.mchatScore !== null && (
                            <span className="font-medium text-slate-700">
                              M-CHAT: {s.mchatScore}/20
                            </span>
                          )}
                          {s.snapivInattention !== null && (
                            <span className="font-medium text-slate-700">
                              SNAP-IV: {s.snapivInattention.toFixed(1)} /{' '}
                              {s.snapivHyperactivity?.toFixed(1)}
                            </span>
                          )}
                          {s.totalScore !== null &&
                            s.mchatScore === null &&
                            s.snapivInattention === null && (
                              <span className="font-medium text-slate-700">
                                Escore: {s.totalScore}
                              </span>
                            )}
                          {s.mchatScore === null &&
                            s.snapivInattention === null &&
                            s.totalScore === null && (
                              <span className="text-slate-400 text-xs">
                                {s.responseCount > 0 ? `${s.responseCount} respostas` : '—'}
                              </span>
                            )}
                        </TableCell>

                        {/* 6. Risco */}
                        <TableCell>
                          {riskBadge(s.riskLevel)}
                          {s.riskLevel === 'high' && (
                            <p className="text-[11px] font-bold text-red-700 mt-1">
                              ⚠️ Avaliar contraindicação EMT
                            </p>
                          )}
                        </TableCell>

                        {/* 7. Ações Clínicas */}
                        <TableCell
                          className="text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {!isUnidentified && s.guest_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-[#C4A35A]/50 text-[#7B5B3A] bg-[#FAF5EB]/50 hover:bg-[#FAF5EB]"
                                onClick={() =>
                                  setSelectedPatientForHistory({
                                    guestId: s.guest_id!,
                                    patientName: s.patient_name,
                                  })
                                }
                                title="Abrir Histórico Completo do Paciente"
                              >
                                <Users className="h-3.5 w-3.5 mr-1" />
                                Histórico
                              </Button>
                            )}
                            {!isUnidentified && s.guest_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-[#C4A35A] text-[#7B5B3A] bg-white hover:bg-[#FAF5EB] font-medium"
                                disabled={generatingConsolidatedId === s.guest_id}
                                onClick={async () => {
                                  if (!s.guest_id) return
                                  setGeneratingConsolidatedId(s.guest_id)
                                  try {
                                    await generateConsolidatedPatientPdf(s.guest_id)
                                    toast.success(
                                      `Laudo Consolidado de ${s.patient_name} gerado com sucesso!`,
                                    )
                                  } catch (err: any) {
                                    const msg = err?.message || 'Falha ao emitir Laudo Consolidado.'
                                    toast.error(msg)
                                  } finally {
                                    setGeneratingConsolidatedId(null)
                                  }
                                }}
                                title="Gerar Laudo Único Consolidado de todos os testes deste paciente"
                              >
                                <FileDown
                                  className={cn(
                                    'h-3.5 w-3.5 mr-1 text-[#C4A35A]',
                                    generatingConsolidatedId === s.guest_id && 'animate-spin',
                                  )}
                                />
                                {generatingConsolidatedId === s.guest_id
                                  ? 'Gerando...'
                                  : 'Laudo Consolidado'}
                              </Button>
                            )}
                            {s.source === 'session' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-[#7B5B3A]/30 text-[#7B5B3A] hover:bg-[#FAF5EB]"
                                onClick={() => setFeedbackSessionId(s.session_id)}
                                title="Editar ou visualizar feedback clínico"
                              >
                                <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
                                Feedback
                              </Button>
                            )}
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-slate-600 hover:text-slate-900"
                            >
                              <Link to={`/documentos?session=${s.session_id}`}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Laudo
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>{CLINIC_BRANDING.name} &bull; Diretrizes DSM-5-TR / CID-11</span>
          <span>Suporte à decisão clínica &bull; Validação médica obrigatória</span>
        </div>
      </Card>

      {/* Seção de Biofeedback e Foco */}
      <FocusAnalytics />

      {/* Modal de Feedback Clínico */}
      <ClinicalFeedbackDialog
        sessionId={feedbackSessionId}
        open={!!feedbackSessionId}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackSessionId(null)
            loadDashboard()
          }
        }}
      />

      {/* Modal de Histórico Completo do Paciente */}
      <PatientHistoryDialog
        guestId={selectedPatientForHistory?.guestId || null}
        patientNameFallback={selectedPatientForHistory?.patientName}
        open={!!selectedPatientForHistory}
        onOpenChange={(open) => {
          if (!open) setSelectedPatientForHistory(null)
        }}
      />
    </div>
  )
}
