import { useState } from 'react'
import { FileText, ArrowRight, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MiniPatientInfo } from '@/services/mini-interview'

interface MiniPatientFormProps {
  onSubmit: (info: MiniPatientInfo) => void
  initialInfo?: MiniPatientInfo
}

export function MiniPatientForm({ onSubmit, initialInfo }: MiniPatientFormProps) {
  const [name, setName] = useState(initialInfo?.name || '')
  const [protocol, setProtocol] = useState(initialInfo?.protocol || '')
  const [interviewDate, setInterviewDate] = useState(
    initialInfo?.interviewDate || new Date().toISOString().split('T')[0],
  )
  const [birthDate, setBirthDate] = useState(initialInfo?.birthDate || '')
  const [interviewerName, setInterviewerName] = useState(initialInfo?.interviewerName || '')
  const [startTime, setStartTime] = useState(
    initialInfo?.startTime || new Date().toTimeString().slice(0, 5),
  )

  const dateInputClass =
    'w-full bg-[#0A192F] text-[#E6F1FF] border border-[#233554] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00FFFF]/50 [color-scheme:dark]'
  const timeInputClass = dateInputClass

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      protocol: protocol.trim(),
      interviewDate,
      birthDate,
      interviewerName: interviewerName.trim(),
      startTime,
      endTime: '',
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-[#00FFFF]" />
        <h1 className="text-2xl font-bold text-[#E6F1FF]">MINI 5.0.0</h1>
      </div>
      <p className="text-sm text-[#E6F1FF]/85 mb-6">
        Mini International Neuropsychiatric Interview — Versão Brasileira DSM-IV. Entrevista
        estruturada para triagem de transtornos psiquiátricos.
      </p>

      <div
        className="p-6 rounded-2xl space-y-4"
        style={{ backgroundColor: '#112240', border: '1px solid #233554' }}
      >
        <h2 className="text-lg font-semibold text-[#E6F1FF] mb-2">
          Identificação do(a) Entrevistado(a)
        </h2>

        <div className="space-y-2">
          <label className="text-sm text-[#E6F1FF]/70">Nome do(a) Entrevistado(a)</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            className="bg-[#0A192F] text-[#E6F1FF] border-[#233554] focus:border-[#00FFFF]/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#E6F1FF]/70 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Nome do Entrevistador
          </label>
          <Input
            value={interviewerName}
            onChange={(e) => setInterviewerName(e.target.value)}
            placeholder="Nome do profissional"
            className="bg-[#0A192F] text-[#E6F1FF] border-[#233554] focus:border-[#00FFFF]/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#E6F1FF]/70">Protocolo Nº</label>
          <Input
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            placeholder="Número do protocolo"
            className="bg-[#0A192F] text-[#E6F1FF] border-[#233554] focus:border-[#00FFFF]/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[#E6F1FF]/70">Data da Entrevista</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className={dateInputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#E6F1FF]/70">Data de Nascimento</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={dateInputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[#E6F1FF]/70 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Hora do Início
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={timeInputClass}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          Iniciar Entrevista
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-yellow-400/70 italic mt-4">
        AVISO: Este instrumento é uma ferramenta de triagem e não substitui a avaliação clínica
        profissional.
      </p>
    </div>
  )
}
