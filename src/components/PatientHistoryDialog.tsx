import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileDown,
  RefreshCw,
  ShieldCheck,
  Brain,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { CLINIC_BRANDING } from '@/lib/clinic-branding'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getPatientFullHistory,
  type PatientFullHistory,
  type PatientEvaluationItem,
  type PatientReportItem,
} from '@/services/patient-full-history'
import { generateLaudoPDF } from '@/lib/laudo-pdf'
import { generateConsolidatedPatientPdf } from '@/lib/laudo-consolidado-pdf'
import { formatCPF } from '@/services/guest-patient'

interface PatientHistoryDialogProps {
  guestId: string | null
  patientNameFallback?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientHistoryDialog({
  guestId,
  patientNameFallback,
  open,
  onOpenChange,
}: PatientHistoryDialogProps) {
  const [data, setData] = useState<PatientFullHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'evaluations' | 'reports' | 'overview'>('evaluations')
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)
  const [generatingConsolidatedPdf, setGeneratingConsolidatedPdf] = useState(false)
  const [filterScale, setFilterScale] = useState('')

  useEffect(() => {
    if (!open || !guestId) {
      if (!open) setData(null)
      return
    }

    let isMounted = true
    setLoading(true)

    getPatientFullHistory(guestId)
      .then((res) => {
        if (isMounted) setData(res)
      })
      .catch((err) => {
        console.error('Erro ao carregar histórico completo do paciente:', err)
        toast.error('Não foi possível carregar o histórico do paciente.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, guestId])

  const handleGenerateConsolidatedPdf = async () => {
    if (!data) return
    setGeneratingConsolidatedPdf(true)
    try {
      await generateConsolidatedPatientPdf({
        identification: data.identification,
        evaluations: data.evaluations,
        fullHistory: data,
      })
      toast.success('Laudo Consolidado do Paciente emitido com sucesso!')
    } catch (err: any) {
      const msg = err?.message || 'Falha ao emitir Laudo Consolidado.'
      toast.error(msg)
    } finally {
      setGeneratingConsolidatedPdf(false)
    }
  }

  const handleGeneratePdf = async (item: PatientEvaluationItem) => {
    if (!guestId) return
    setGeneratingPdfId(item.id)
    try {
      await generateLaudoPDF({
        testId: item.session_id || item.id,
        type: item.scale_type,
        patientName: data?.identification.full_name || patientNameFallback || 'Paciente',
        startedAt: item.started_at,
        status: item.status,
        score: item.score,
        guestId,
      })
      toast.success(`Laudo PDF (${item.scale_type}) emitido com sucesso!`)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      const msg = err?.message || 'Falha ao gerar laudo em PDF.'
      toast.error(msg)
    } finally {
      setGeneratingPdfId(null)
    }
  }

  const filteredEvaluations = (data?.evaluations || []).filter((e) => {
    if (!filterScale.trim()) return true
    const q = filterScale.toLowerCase()
    return (
      e.scale_type.toLowerCase().includes(q) ||
      e.translatedStatus.toLowerCase().includes(q) ||
      e.risk_label.toLowerCase().includes(q)
    )
  })

  const riskBadge = (level: 'low' | 'medium' | 'high' | null) => {
    if (!level) {
      return <span className="text-slate-400 text-xs italic font-normal">Não avaliado</span>
    }
    const styles = {
      high: 'bg-red-100 text-red-800 border-red-300 font-bold',
      medium: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      low: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
    }
    const labels = {
      high: '⚠️ Risco Alto',
      medium: 'Risco Médio',
      low: 'Risco Baixo',
    }
    return (
      <span
        className={cn(
          'text-xs px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1',
          styles[level],
        )}
      >
        {labels[level]}
      </span>
    )
  }

  const statusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'completed') {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium"
        >
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
          Concluída
        </Badge>
      )
    }
    if (s === 'pending') {
      return (
        <Badge
          variant="outline"
          className="bg-[#FAF5EB] text-[#7B5B3A] border-[#C4A35A]/40 text-xs font-medium"
        >
          <Clock className="h-3 w-3 mr-1 text-[#C4A35A]" />
          Pendente
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium"
      >
        <Clock className="h-3 w-3 mr-1 text-amber-600" />
        Em Andamento
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden border-[#C4A35A]/40 bg-white">
        {/* Cabeçalho estilizado Casa Branca Saúde */}
        <DialogHeader className="bg-gradient-to-r from-[#3E2723] via-[#7B5B3A] to-[#6D5D4B] p-6 text-white text-left relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#C4A35A]/25 to-transparent blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5EB]/20 text-[#FAF5EB] border border-[#C4A35A]/40">
                  <Sparkles className="h-3 w-3 text-[#C4A35A]" />
                  Prontuário &bull; Histórico Clínico Longitudinal
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="h-3 w-3" /> LGPD Descriptografado
                </span>
              </div>

              <DialogTitle className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                <User className="h-6 w-6 text-[#C4A35A]" />
                {loading
                  ? 'Carregando paciente...'
                  : data?.identification.full_name || patientNameFallback || 'Paciente'}
              </DialogTitle>

              <DialogDescription className="text-[#FAF5EB]/80 text-xs sm:text-sm">
                Acompanhamento temporal completo de escalas, risco diagnóstico DSM-5-TR / CID-11 e
                laudos emitidos na {CLINIC_BRANDING.name}.
              </DialogDescription>
            </div>

            {data && (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateConsolidatedPdf}
                  disabled={generatingConsolidatedPdf}
                  className="bg-[#C4A35A] hover:bg-[#b39247] text-[#3E2723] font-bold rounded-full h-8 text-xs shadow-md border border-white/20"
                  title="Gerar Laudo Único Consolidado de todos os testes do paciente"
                >
                  <FileDown
                    className={cn(
                      'h-3.5 w-3.5 mr-1.5',
                      generatingConsolidatedPdf && 'animate-spin',
                    )}
                  />
                  {generatingConsolidatedPdf ? 'Gerando Laudo...' : 'Gerar Laudo Consolidado (PDF)'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (guestId) {
                      setLoading(true)
                      getPatientFullHistory(guestId)
                        .then(setData)
                        .finally(() => setLoading(false))
                    }
                  }}
                  disabled={loading}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-full h-8 text-xs"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
                  Atualizar
                </Button>
              </div>
            )}
          </div>

          {/* Cartões Rápidos do Paciente no Cabeçalho */}
          {!loading && data && (
            <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[#FAF5EB]/60 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
                  <Mail className="h-3 w-3" /> E-mail
                </span>
                <p className="text-white font-medium truncate">
                  {data.identification.email || '—'}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#FAF5EB]/60 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telefone
                </span>
                <p className="text-white font-medium">{data.identification.phone || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#FAF5EB]/60 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> CPF / Doc
                </span>
                <p className="text-white font-mono font-medium">
                  {data.identification.document ? formatCPF(data.identification.document) : '—'}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#FAF5EB]/60 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Idade / Nasc.
                </span>
                <p className="text-white font-medium">
                  {data.identification.age !== null
                    ? `${data.identification.age} anos`
                    : data.identification.birth_date
                      ? new Date(data.identification.birth_date).toLocaleDateString('pt-BR')
                      : '—'}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Corpo com Abas e Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-500">
              <p>Nenhum dado encontrado para o paciente selecionado.</p>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'evaluations' | 'reports' | 'overview')}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <TabsList className="bg-[#FAF5EB] p-1 border border-[#C4A35A]/30">
                  <TabsTrigger
                    value="evaluations"
                    className="text-xs font-semibold data-[state=active]:bg-[#7B5B3A] data-[state=active]:text-white"
                  >
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Avaliações ({data.evaluations.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="text-xs font-semibold data-[state=active]:bg-[#7B5B3A] data-[state=active]:text-white"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Laudos &amp; Pareceres ({data.reports.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="text-xs font-semibold data-[state=active]:bg-[#7B5B3A] data-[state=active]:text-white"
                  >
                    <Brain className="h-3.5 w-3.5 mr-1.5" />
                    Resumo Clínico
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'evaluations' && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por escala ou status..."
                      value={filterScale}
                      onChange={(e) => setFilterScale(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7B5B3A]"
                    />
                  </div>
                )}
              </div>

              {/* ABA 1: TODAS AS AVALIAÇÕES E ESCALAS */}
              <TabsContent value="evaluations" className="space-y-4 pt-2">
                {filteredEvaluations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm font-medium">
                      Nenhuma avaliação encontrada para os critérios informados.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold text-[#3E2723] text-xs">
                            Escala / Instrumento
                          </TableHead>
                          <TableHead className="font-bold text-[#3E2723] text-xs">Data</TableHead>
                          <TableHead className="font-bold text-[#3E2723] text-xs">Status</TableHead>
                          <TableHead className="font-bold text-[#3E2723] text-xs">Escore</TableHead>
                          <TableHead className="font-bold text-[#3E2723] text-xs">
                            Risco Clínico
                          </TableHead>
                          <TableHead className="font-bold text-[#3E2723] text-xs text-right">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvaluations.map((item) => {
                          const isComplete = item.status === 'completed'
                          const isPdfLoading = generatingPdfId === item.id

                          return (
                            <TableRow key={item.id} className="hover:bg-slate-50/70">
                              <TableCell className="font-semibold text-slate-900 text-sm">
                                <div className="space-y-0.5">
                                  <span className="text-[#7B5B3A] font-bold">
                                    {item.scale_type}
                                  </span>
                                  {item.interpretation && (
                                    <p className="text-[11px] text-slate-500 font-normal line-clamp-1 max-w-xs">
                                      {item.interpretation}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                                {new Date(item.started_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell>{statusBadge(item.status)}</TableCell>
                              <TableCell className="text-xs font-semibold text-slate-800">
                                {item.score !== null ? (
                                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[#3E2723]">
                                    {item.score} pts
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">—</span>
                                )}
                              </TableCell>
                              <TableCell>{riskBadge(item.risk_level)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isComplete && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGeneratePdf(item)}
                                      disabled={isPdfLoading}
                                      className="h-7 text-xs border-[#C4A35A]/50 text-[#7B5B3A] hover:bg-[#FAF5EB]"
                                      title="Baixar Laudo Médico Completo em PDF"
                                    >
                                      <FileDown
                                        className={cn(
                                          'h-3.5 w-3.5 mr-1',
                                          isPdfLoading && 'animate-spin',
                                        )}
                                      />
                                      {isPdfLoading ? 'Gerando...' : 'Laudo PDF'}
                                    </Button>
                                  )}
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-slate-600 hover:text-slate-900"
                                  >
                                    <Link to={`/documentos?session=${item.session_id}`}>
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Ver
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
              </TabsContent>

              {/* ABA 2: LAUDOS E PARECERES CLÍNICOS */}
              <TabsContent value="reports" className="space-y-4 pt-2">
                {data.reports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm font-medium">
                      Nenhum laudo clínico ou parecer registrado até o momento.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Conforme as avaliações forem finalizadas, os pareceres validados aparecerão
                      aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.reports.map((rep: PatientReportItem) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#C4A35A]/50 transition-colors shadow-2xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#7B5B3A] text-sm">
                              {rep.scale_type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              &bull; {new Date(rep.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {rep.score !== null && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-[#FAF5EB] text-[#7B5B3A]"
                              >
                                Escore: {rep.score}
                              </Badge>
                            )}
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-[#7B5B3A]/30 text-[#7B5B3A]"
                            >
                              <Link to={`/documentos?session=${rep.session_id}`}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Abrir Laudo
                              </Link>
                            </Button>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {rep.admin_edited_interpretation ||
                            rep.system_suggestion ||
                            rep.comments ||
                            'Parecer clínico preliminar emitido pelo sistema.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ABA 3: RESUMO CLÍNICO LONGITUDINAL */}
              <TabsContent value="overview" className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Total de Testes
                    </span>
                    <span className="text-2xl font-bold font-display text-[#3E2723]">
                      {data.metrics.totalEvaluations}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                      Concluídas
                    </span>
                    <span className="text-2xl font-bold font-display text-emerald-700">
                      {data.metrics.completedEvaluations}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 block">
                      Em Andamento
                    </span>
                    <span className="text-2xl font-bold font-display text-amber-700">
                      {data.metrics.inProgressEvaluations}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-red-800 block">
                      Risco Alto
                    </span>
                    <span className="text-2xl font-bold font-display text-red-600">
                      {data.metrics.highRiskEvaluations}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#C4A35A]/30 bg-[#FAF5EB]/50 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B5B3A] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Acompanhamento Longitudinal Casa Branca Saúde
                  </h4>
                  <p className="text-xs text-[#6D5D4B] leading-relaxed">
                    Primeira avaliação registrada em{' '}
                    <strong>
                      {data.metrics.firstEvaluationDate
                        ? new Date(data.metrics.firstEvaluationDate).toLocaleDateString('pt-BR')
                        : '—'}
                    </strong>
                    {data.metrics.latestEvaluationDate && (
                      <>
                        {' '}
                        e mais recente em{' '}
                        <strong>
                          {new Date(data.metrics.latestEvaluationDate).toLocaleDateString('pt-BR')}
                        </strong>
                      </>
                    )}
                    . Para análise de evolução por gráficos de linha temporal e correlações
                    intermodais, acesse a tela de Evolução Temporal.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleGenerateConsolidatedPdf}
                      disabled={generatingConsolidatedPdf}
                      className="bg-[#7B5B3A] hover:bg-[#6D5D4B] text-white text-xs h-8 font-semibold shadow-xs"
                    >
                      <FileDown
                        className={cn(
                          'h-3.5 w-3.5 mr-1.5',
                          generatingConsolidatedPdf && 'animate-spin',
                        )}
                      />
                      {generatingConsolidatedPdf
                        ? 'Gerando Laudo...'
                        : 'Gerar Laudo Consolidado (PDF)'}
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-[#7B5B3A] text-[#7B5B3A] bg-white hover:bg-[#FAF5EB] text-xs h-8"
                    >
                      <Link to="/historico">Ver Evolução Temporal Gráfica &rarr;</Link>
                    </Button>
                  </div>
                </div>

                {data.metrics.highRiskEvaluations > 0 && (
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 leading-relaxed">
                      <strong>Atenção Clínica:</strong> O paciente apresenta{' '}
                      {data.metrics.highRiskEvaluations}{' '}
                      {data.metrics.highRiskEvaluations === 1
                        ? 'escala com risco elevado'
                        : 'escalas com risco elevado'}
                      . Avaliar contraindicações de EMT (Estimulação Magnética Transcraniana) e
                      proceder com revisão presencial imediata.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Rodapé institucional */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{CLINIC_BRANDING.name} &bull; Prontuário Eletrônico Auditado</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs text-slate-700"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
