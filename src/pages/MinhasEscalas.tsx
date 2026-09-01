import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  User,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Headphones,
} from 'lucide-react'
import { InformedConsent } from '@/components/InformedConsent'
import { normalizeAssistedScaleType } from '@/lib/assisted-scales-data'
import {
  getGuestAssignments,
  completeAssignment,
  acceptGuestTcle,
  getGuestTcleStatus,
  findGuestByCpf,
  getGuestAssessmentResults,
  formatCPF,
  getScaleDisplayName,
  getScaleRoute,
  type IdentifiedGuest,
  type GuestAssignment,
  type GuestAssessmentResult,
} from '@/services/guest-patient'
import { SCALE_GROUPS, findScaleOption } from '@/lib/scale-groups'

type Step = 'identify' | 'tcle' | 'scales'

const GUEST_ID_KEY = 'guest_id'

function readStoredGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY)
}

function saveGuestId(id: string) {
  localStorage.setItem(GUEST_ID_KEY, id)
}

function clearGuestId() {
  localStorage.removeItem(GUEST_ID_KEY)
}

export default function MinhasEscalas() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ---- formulário de identificação (somente CPF) ----
  const [cpf, setCpf] = useState('')

  // ---- estado de fluxo ----
  const [step, setStep] = useState<Step>('identify')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [guest, setGuest] = useState<IdentifiedGuest | null>(null)
  const [assignments, setAssignments] = useState<GuestAssignment[]>([])
  const [results, setResults] = useState<GuestAssessmentResult[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  const proceedAfterIdentify = useCallback(async (identified: IdentifiedGuest) => {
    setGuest(identified)
    setLoading(true)
    // Busca escalas atribuídas.
    const { data: assignmentData, error: assignError } = await getGuestAssignments(identified.id)
    if (assignError) {
      setError(assignError)
    } else {
      setAssignments(assignmentData)
    }

    // Busca resultados/ respostas das avaliações concluídas.
    const { data: resultData } = await getGuestAssessmentResults(identified.id)
    setResults(resultData || [])

    // Verifica se o TCLE já foi aceito antes.
    const { accepted, error: tcleError } = await getGuestTcleStatus(identified.id)
    setLoading(false)

    if (tcleError) {
      setStep('tcle')
      return
    }

    if (accepted) {
      setStep('scales')
    } else {
      setStep('tcle')
    }
  }, [])

  // Auto-proceed quando guest_id chega via query param (retorno da escala) ou
  // quando já está no localStorage (acesso direto à página).
  useEffect(() => {
    const qGuestId = searchParams.get('guest_id')
    const storedId = readStoredGuestId()
    const targetId = qGuestId || storedId
    if (targetId && step === 'identify' && !guest) {
      // Reidentifica pelo CPF armazenado: busca o guest pelo id via
      // findGuestByCpf não é possível (só temos o id), então reconstruímos
      // um IdentifiedGuest mínimo e seguimos para o fluxo.
      const minimal: IdentifiedGuest = {
        id: targetId,
        first_name: '',
        last_name: '',
        birth_date: null,
        document: null,
        profession: null,
        address: null,
        responsible_name: null,
      }
      proceedAfterIdentify(minimal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, step, guest])

  // ---- identificação por CPF (único campo) ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotFound(false)
    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.')
      return
    }

    setLoading(true)
    // Busca o guest pelo CPF (descriptografado server-side). NUNCA cria novo.
    const { data: found, error: findError } = await findGuestByCpf(cpfDigits)

    if (findError) {
      setError(findError)
      setLoading(false)
      return
    }

    if (!found) {
      // CPF não encontrado — orienta o paciente a procurar o médico.
      setNotFound(true)
      setLoading(false)
      return
    }

    // Salva o guest_id no localStorage para persistir o acesso.
    saveGuestId(found.id)
    await proceedAfterIdentify(found)
  }

  // ---- TCLE ----
  const handleAcceptTcle = async () => {
    if (!guest) return
    setLoading(true)
    const { error: tcleError } = await acceptGuestTcle(guest.id)
    setLoading(false)
    if (tcleError) {
      setError(tcleError)
      return
    }
    setStep('scales')
  }

  // ---- escalas ----
  const handleStartAssignment = async (assignment: GuestAssignment) => {
    setLoading(true)
    await completeAssignment(assignment.id)
    setLoading(false)
    // Garante que o guest_id está no localStorage antes de navegar.
    if (guest) saveGuestId(guest.id)
    const route = getScaleRoute(assignment.scale_type)
    navigate(
      `${route}?guest_id=${guest?.id ?? ''}&assignment_id=${assignment.id}&scale=${encodeURIComponent(assignment.scale_type)}`,
    )
  }

  const handleStartAssisted = (assignment: GuestAssignment) => {
    if (guest) saveGuestId(guest.id)
    navigate(`/aplicacao-assistida/${encodeURIComponent(assignment.scale_type)}/${assignment.id}`)
  }

  const handleBack = () => {
    clearGuestId()
    setGuest(null)
    setAssignments([])
    setResults([])
    setError(null)
    setNotFound(false)
    setCpf('')
    setStep('identify')
  }

  // ---- tela de escalas (paciente identificado + TCLE aceito) ----
  if (step === 'scales' && guest) {
    const pending = assignments.filter((a) => a.status !== 'completed')
    const completed = assignments.filter((a) => a.status === 'completed')

    // Mapa de resultados por scale_type para o botão "Ver respostas".
    const resultsByScale = new Map<string, GuestAssessmentResult>()
    results.forEach((r) => {
      const key = (r.scale_type || '').toLowerCase()
      if (!resultsByScale.has(key)) resultsByScale.set(key, r)
    })

    // Agrupa as escalas pendentes por patologia para exibição.
    const pendingGrouped = pending.reduce<Record<string, GuestAssignment[]>>((acc, a) => {
      const opt = findScaleOption(a.scale_type)
      const group = opt
        ? Object.entries(SCALE_GROUPS).find(([, scales]) =>
            scales.some((s) => s.label === opt.label || s.id === opt.id),
          )?.[0]
        : undefined
      const key = group || 'Outras'
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {})

    return (
      <div className="min-h-screen bg-[#0A192F] text-white p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Minhas Avaliações</h1>
              <p className="text-sm text-white/80 mt-1">
                {guest.first_name
                  ? `Olá, ${guest.first_name}! Estas são as avaliações atribuídas a você.`
                  : 'Estas são as avaliações atribuídas a você.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>

          <Card className="border-[#00FFFF]/20 bg-white/5">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#00FFFF]" /> Escalas Pendentes
              </CardTitle>
              <CardDescription className="text-white/70">
                Responda as avaliações que seu profissional de saúde selecionou para você. As
                escalas estão agrupadas por área de avaliação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.length === 0 ? (
                <p className="text-center text-white/70 py-6">
                  Nenhuma escala pendente no momento. Quando seu profissional atribuir avaliações,
                  elas aparecerão aqui.
                </p>
              ) : (
                Object.entries(pendingGrouped).map(([pathology, items]) => (
                  <div key={pathology} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#00FFFF]/80">
                      {pathology}
                    </p>
                    {items.map((a) => {
                      const opt = findScaleOption(a.scale_type)
                      const assistedKey = normalizeAssistedScaleType(a.scale_type)
                      return (
                        <div
                          key={a.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white text-sm">
                                {opt?.label ?? a.scale_type}
                              </p>
                              {opt?.time && (
                                <span className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                                  {opt.time}
                                </span>
                              )}
                              {assistedKey && (
                                <Badge
                                  variant="secondary"
                                  className="bg-[#C4A35A]/20 text-[#E8DDC8] border border-[#C4A35A]/40 text-[10px] flex items-center gap-1 py-0"
                                >
                                  <Headphones className="h-3 w-3 text-[#C4A35A]" /> Skill de Voz
                                </Badge>
                              )}
                            </div>
                            {opt?.name && (
                              <p className="text-xs text-white/70 mt-0.5">{opt.name}</p>
                            )}
                            <p className="text-xs text-white/60 mt-0.5">
                              Atribuída em {new Date(a.assigned_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {assistedKey && (
                              <Button
                                size="sm"
                                disabled={loading}
                                onClick={() => handleStartAssisted(a)}
                                variant="outline"
                                className="border-[#C4A35A] text-[#E8DDC8] bg-[#C4A35A]/10 hover:bg-[#C4A35A]/20 font-semibold"
                                title="Responder com narração e auxílio por voz"
                              >
                                <Headphones className="h-4 w-4 mr-1 text-[#C4A35A]" />
                                Modo Falado
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={loading}
                              onClick={() => handleStartAssignment(a)}
                              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4 mr-1" />
                              )}
                              Responder Manual
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {completed.length > 0 && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Avaliações Concluídas
                </CardTitle>
                <CardDescription className="text-white/70">
                  Clique em "Ver respostas" para revisar o que você respondeu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {completed.map((a) => {
                  const opt = findScaleOption(a.scale_type)
                  const scaleKey = (a.scale_type || '').toLowerCase()
                  const result = resultsByScale.get(scaleKey)
                  const expandedKey = `assign-${a.id}`
                  const isExpanded = expandedResult === expandedKey
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-white">{opt?.label ?? a.scale_type}</span>
                          {opt?.name && (
                            <span className="block text-xs text-white/60 mt-0.5">{opt.name}</span>
                          )}
                          {a.completed_at && (
                            <span className="block text-xs text-white/50 mt-0.5">
                              Concluída em {new Date(a.completed_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-950 text-emerald-300 hover:bg-emerald-950"
                          >
                            Concluída
                          </Badge>
                          {result && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedResult(isExpanded ? null : expandedKey)}
                              className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
                            >
                              {isExpanded ? (
                                <EyeOff className="h-4 w-4 mr-1" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              {isExpanded ? 'Ocultar' : 'Ver respostas'}
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 ml-1" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      {isExpanded && result && <AssessmentResponseSummary result={result} />}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Resultados órfãos (sessões sem scale_assignment) — ex.: escalas
              respondidas antes da atribuição ou criadas diretamente pelos
              componentes. Mostra-as como avaliações concluídas extras. */}
          {results.filter(
            (r) => !r.assignment_id && !assignments.some((a) => a.status === 'completed'),
          ).length > 0 && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">
                  Outras Avaliações Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results
                  .filter((r) => !r.assignment_id)
                  .map((r, idx) => {
                    const expandedKey = `orphan-${r.session_id ?? idx}`
                    const isExpanded = expandedResult === expandedKey
                    return (
                      <div
                        key={r.session_id ?? idx}
                        className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm text-white">
                              {getScaleDisplayName(r.scale_type)}
                            </span>
                            {r.completed_at && (
                              <span className="block text-xs text-white/50 mt-0.5">
                                Concluída em {new Date(r.completed_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="secondary"
                              className="bg-emerald-950 text-emerald-300 hover:bg-emerald-950"
                            >
                              Concluída
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedResult(isExpanded ? null : expandedKey)}
                              className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
                            >
                              {isExpanded ? (
                                <EyeOff className="h-4 w-4 mr-1" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              {isExpanded ? 'Ocultar' : 'Ver respostas'}
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 ml-1" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {isExpanded && <AssessmentResponseSummary result={r} />}
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
          )}

          <div className="text-center pt-2">
            <Link to="/focus-session" className="text-sm text-[#00FFFF]/80 hover:text-[#00FFFF]">
              Ou relaxar com uma sessão de foco →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---- tela de TCLE ----
  if (step === 'tcle' && guest) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/80">
            <Loader2 className="h-8 w-8 animate-spin text-[#00FFFF]" />
          </div>
        )}
        {error && (
          <div className="max-w-2xl mx-auto pt-6 px-4">
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}
        <InformedConsent embedded onAccept={handleAcceptTcle} />
      </div>
    )
  }

  // ---- formulário de identificação (somente CPF) ----
  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-6 animate-fade-in-up">
          <Link
            to="/welcome"
            className="text-xs text-white/60 hover:text-[#00FFFF] mb-4 inline-block"
          >
            ← Voltar
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-4">
            <User className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Identificação do Paciente</h1>
          <p className="text-sm text-white/80 mt-2">Digite seu CPF para acessar suas escalas.</p>
        </div>

        <Card className="border-[#00FFFF]/20 bg-white/5 animate-fade-in-up">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-white text-sm flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#00FFFF]" /> CPF
                </Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="___.___.___-__"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 font-mono"
                  inputMode="numeric"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10">
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {notFound && (
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    CPF não encontrado. Solicite ao seu médico que cadastre seu CPF no sistema.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Acessar minhas escalas
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Resumo expansível com as respostas e pontuação de uma avaliação concluída.
 */
function AssessmentResponseSummary({ result }: { result: GuestAssessmentResult }) {
  const hasResponses = result.responses && result.responses.length > 0
  return (
    <div className="px-3 pb-3 space-y-3 animate-fade-in-up">
      {/* Pontuação total + interpretação */}
      {(result.total_score !== null || result.severity) && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-[#00FFFF]/5 border border-[#00FFFF]/20">
          {result.total_score !== null && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/60">Pontuação</p>
              <p className="text-xl font-bold text-[#00FFFF]">{result.total_score}</p>
            </div>
          )}
          {result.severity && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/60">Interpretação</p>
              <p className="text-sm font-semibold text-white">{result.severity}</p>
            </div>
          )}
        </div>
      )}

      {/* Respostas individuais */}
      {hasResponses ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#00FFFF]" /> Respostas
          </p>
          {result.responses.map((r, i) => (
            <div
              key={`${r.question_key}-${i}`}
              className="flex items-start justify-between gap-3 p-2 rounded-md bg-white/5 border border-white/10"
            >
              <span className="text-xs text-white/85 flex-1">
                {r.question_label || r.question_key}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {r.response_value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/60 italic">
          Não foi possível recuperar as respostas individuais desta avaliação.
        </p>
      )}

      <p className="text-[10px] text-white/50 italic pt-1">
        Estas informações são educativas e não substituem a interpretação clínica do seu
        profissional de saúde.
      </p>
    </div>
  )
}
