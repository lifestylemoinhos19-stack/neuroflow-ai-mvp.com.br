import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
  Calendar,
  FileText,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { InformedConsent } from '@/components/InformedConsent'
import {
  identifyGuest,
  getGuestAssignments,
  completeAssignment,
  acceptGuestTcle,
  getGuestTcleStatus,
  findGuestByCpf,
  formatCPF,
  calculateAge,
  isUnderage,
  getScaleRoute,
  type IdentifiedGuest,
  type GuestAssignment,
} from '@/services/guest-patient'
import { SCALE_GROUPS, findScaleOption } from '@/lib/scale-groups'

type Step = 'identify' | 'tcle' | 'scales'

interface StoredGuest {
  guest_id: string
  guest_cpf: string
  guest_name: string
}

const LS_KEYS = ['guest_cpf', 'guest_name', 'guest_id'] as const

function readStoredGuest(): StoredGuest | null {
  const id = localStorage.getItem('guest_id')
  const cpf = localStorage.getItem('guest_cpf')
  const name = localStorage.getItem('guest_name')
  if (id && cpf && name) return { guest_id: id, guest_cpf: cpf, guest_name: name }
  return null
}

function saveStoredGuest(id: string, cpf: string, name: string) {
  localStorage.setItem('guest_id', id)
  localStorage.setItem('guest_cpf', cpf)
  localStorage.setItem('guest_name', name)
}

function clearStoredGuest() {
  LS_KEYS.forEach((k) => localStorage.removeItem(k))
}

export default function MinhasEscalas() {
  // ---- formulário de identificação completo ----
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [cpf, setCpf] = useState('')
  const [profession, setProfession] = useState('')
  const [address, setAddress] = useState('')
  const [responsibleName, setResponsibleName] = useState('')

  // ---- estado de fluxo ----
  const [step, setStep] = useState<Step>('identify')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [guest, setGuest] = useState<IdentifiedGuest | null>(null)
  const [assignments, setAssignments] = useState<GuestAssignment[]>([])

  // ---- acesso simplificado (localStorage) ----
  const [storedGuest, setStoredGuest] = useState<StoredGuest | null>(null)
  const [welcomeCpf, setWelcomeCpf] = useState('')

  const underage = birthDate ? isUnderage(birthDate) : false

  // Carrega dados do localStorage no mount.
  useEffect(() => {
    const stored = readStoredGuest()
    if (stored) {
      setStoredGuest(stored)
      setWelcomeCpf(stored.guest_cpf)
    }
  }, [])

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Informe seu nome completo.'
    if (!birthDate) return 'Informe sua data de nascimento.'
    const age = calculateAge(birthDate)
    if (age === null || age < 0 || age > 120) return 'Data de nascimento inválida.'
    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) return 'Informe um CPF válido com 11 dígitos.'
    if (!profession.trim()) return 'Informe sua profissão.'
    if (!address.trim()) return 'Informe seu endereço.'
    if (underage && !responsibleName.trim())
      return 'Como você é menor de idade, informe o nome do responsável.'
    return null
  }

  /**
   * Após identificar um guest (seja via formulário completo ou acesso
   * simplificado), decide o próximo passo: TCLE ou escalas.
   */
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

    // Verifica se o TCLE já foi aceito antes.
    const { accepted, error: tcleError } = await getGuestTcleStatus(identified.id)
    setLoading(false)

    if (tcleError) {
      // Não bloqueia o fluxo por erro de status; segue para TCLE.
      setStep('tcle')
      return
    }

    if (accepted) {
      setStep('scales')
    } else {
      setStep('tcle')
    }
  }, [])

  // ---- formulário completo (novo cadastro) ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const { data, error: idError } = await identifyGuest(
      fullName,
      birthDate,
      cpf,
      profession,
      address,
      underage ? responsibleName : '',
    )

    if (idError || !data) {
      setError(idError || 'Não foi possível identificar seu cadastro. Tente novamente.')
      setLoading(false)
      return
    }

    // Salva no localStorage para acesso simplificado na próxima vez.
    saveStoredGuest(data.id, cpf, `${data.first_name} ${data.last_name}`.trim() || fullName)
    setStoredGuest({
      guest_id: data.id,
      guest_cpf: cpf,
      guest_name: `${data.first_name} ${data.last_name}`.trim() || fullName,
    })

    await proceedAfterIdentify(data)
  }

  // ---- acesso simplificado (tela de boas-vindas) ----
  const handleQuickAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cpfDigits = welcomeCpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.')
      return
    }

    setLoading(true)
    // Busca o guest pelo CPF (descriptografado server-side).
    const { data: found, error: findError } = await findGuestByCpf(cpfDigits)

    if (findError) {
      setError(findError)
      setLoading(false)
      return
    }

    if (!found) {
      // CPF não encontrado no banco — dados podem ter expirado.
      // Limpa o localStorage e mostra o formulário completo.
      clearStoredGuest()
      setStoredGuest(null)
      setError(
        'Não encontramos seu cadastro com este CPF. Preencha o formulário completo para continuar.',
      )
      // Pré-preenche o CPF no formulário completo para conveniência.
      setCpf(welcomeCpf)
      setLoading(false)
      setStep('identify')
      return
    }

    // Atualiza o localStorage com os dados atualizados do banco.
    const displayName = `${found.first_name} ${found.last_name}`.trim()
    saveStoredGuest(found.id, cpfDigits, displayName)
    setStoredGuest({
      guest_id: found.id,
      guest_cpf: cpfDigits,
      guest_name: displayName,
    })

    await proceedAfterIdentify(found)
  }

  const handleNotMe = () => {
    clearStoredGuest()
    setStoredGuest(null)
    setWelcomeCpf('')
    setError(null)
    // Mantém o CPF vazio para um novo cadastro limpo.
    setCpf('')
    setStep('identify')
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
    const route = getScaleRoute(assignment.scale_type)
    window.location.href = `${route}?guest_id=${guest?.id ?? ''}&assignment_id=${assignment.id}&scale=${encodeURIComponent(assignment.scale_type)}`
  }

  const handleBack = () => {
    setGuest(null)
    setAssignments([])
    setError(null)
    setStep('identify')
  }

  // ---- tela de escalas (paciente identificado + TCLE aceito) ----
  if (step === 'scales' && guest) {
    const pending = assignments.filter((a) => a.status !== 'completed')
    const completed = assignments.filter((a) => a.status === 'completed')

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
                Olá, {guest.first_name}! Estas são as avaliações atribuídas a você.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Trocar paciente
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
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5"
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
                            </div>
                            {opt?.name && (
                              <p className="text-xs text-white/70 mt-0.5">{opt.name}</p>
                            )}
                            <p className="text-xs text-white/60 mt-0.5">
                              Atribuída em {new Date(a.assigned_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
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
                            Responder
                          </Button>
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
                <CardTitle className="text-base font-bold text-white">
                  Avaliações Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completed.map((a) => {
                  const opt = findScaleOption(a.scale_type)
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-white/5"
                    >
                      <div className="min-w-0">
                        <span className="text-sm text-white">{opt?.label ?? a.scale_type}</span>
                        {opt?.name && (
                          <span className="block text-xs text-white/60 mt-0.5">{opt.name}</span>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-950 text-emerald-300 hover:bg-emerald-950"
                      >
                        Concluída
                      </Badge>
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

  // ---- tela de boas-vindas (acesso simplificado, localStorage) ----
  if (storedGuest && step === 'identify') {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-lg">
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-4">
              <User className="h-8 w-8 text-[#00FFFF]" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Bem-vindo de volta, {storedGuest.guest_name.split(' ')[0]}!
            </h1>
            <p className="text-sm text-white/80 mt-2">
              Confirme seu CPF para acessar suas avaliações.
            </p>
          </div>

          <Card className="border-[#00FFFF]/20 bg-white/5 animate-fade-in-up">
            <CardContent className="pt-6">
              <form onSubmit={handleQuickAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="welcomeCpf"
                    className="text-white text-sm flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#00FFFF]" /> CPF
                  </Label>
                  <Input
                    id="welcomeCpf"
                    value={welcomeCpf}
                    onChange={(e) => setWelcomeCpf(formatCPF(e.target.value))}
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Acessar
                </Button>

                <button
                  type="button"
                  onClick={handleNotMe}
                  className="w-full text-center text-sm text-[#00FFFF]/80 hover:text-[#00FFFF] underline-offset-2 hover:underline"
                >
                  Não sou {storedGuest.guest_name.split(' ')[0]}? Clique aqui para novo cadastro
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-4">
            <Link to="/welcome" className="text-xs text-white/60 hover:text-[#00FFFF]">
              ← Voltar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---- formulário completo de identificação (novo cadastro) ----
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
          <h1 className="text-2xl font-bold text-white">Identificação do Paciente</h1>
          <p className="text-sm text-white/80 mt-2">
            Informe seus dados para acessar as avaliações que seu médico selecionou.
          </p>
        </div>

        <Card className="border-[#00FFFF]/20 bg-white/5 animate-fade-in-up">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white text-sm flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#00FFFF]" /> Nome completo *
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-white text-sm flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#00FFFF]" /> Data de nascimento *
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-white text-sm flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#00FFFF]" /> CPF *
                </Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="___.___.___-__"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 font-mono"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession" className="text-white text-sm">
                  Profissão *
                </Label>
                <Input
                  id="profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Professor, Engenheiro, Estudante..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-white text-sm">
                  Endereço *
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>

              {underage && (
                <div className="space-y-2 animate-fade-in-up">
                  <Label
                    htmlFor="responsibleName"
                    className="text-white text-sm flex items-center gap-1.5"
                  >
                    <User className="h-3.5 w-3.5 text-[#00FFFF]" /> Nome do responsável *
                  </Label>
                  <Input
                    id="responsibleName"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Nome completo do responsável legal"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    required
                  />
                  <p className="text-xs text-[#00FFFF]/70">
                    Paciente menor de idade — o nome do responsável é obrigatório.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10">
                  <p className="text-xs text-red-300">{error}</p>
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
                Continuar para o TCLE
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
