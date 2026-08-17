import { useState } from 'react'
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
} from 'lucide-react'
import {
  identifyGuest,
  getGuestAssignments,
  completeAssignment,
  formatCPF,
  calculateAge,
  isUnderage,
  getScaleDisplayName,
  getScaleRoute,
  type IdentifiedGuest,
  type GuestAssignment,
} from '@/services/guest-patient'

export default function MinhasEscalas() {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [cpf, setCpf] = useState('')
  const [profession, setProfession] = useState('')
  const [address, setAddress] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [guest, setGuest] = useState<IdentifiedGuest | null>(null)
  const [assignments, setAssignments] = useState<GuestAssignment[]>([])

  const underage = birthDate ? isUnderage(birthDate) : false

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

    setGuest(data)
    const { data: assignmentData, error: assignError } = await getGuestAssignments(data.id)

    if (assignError) {
      setError(assignError)
    } else {
      setAssignments(assignmentData)
    }
    setLoading(false)
  }

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
  }

  if (guest) {
    const pending = assignments.filter((a) => a.status !== 'completed')
    const completed = assignments.filter((a) => a.status === 'completed')
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
                Responda as avaliações que seu profissional de saúde selecionou para você.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-center text-white/70 py-6">
                  Nenhuma escala pendente no momento. Quando seu profissional atribuir avaliações,
                  elas aparecerão aqui.
                </p>
              ) : (
                pending.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">
                        {getScaleDisplayName(a.scale_type)}
                      </p>
                      <p className="text-xs text-white/70 mt-0.5">
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
                {completed.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-white/5"
                  >
                    <span className="text-sm text-white">{getScaleDisplayName(a.scale_type)}</span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-950 text-emerald-300 hover:bg-emerald-950"
                    >
                      Concluída
                    </Badge>
                  </div>
                ))}
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
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Acessar minhas avaliações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
