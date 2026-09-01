import { useLocation, useSearchParams } from 'react-router-dom'
import { Brain, Lock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { PublicPageShell } from '@/components/PublicPageShell'
import { InformedConsent } from '@/components/InformedConsent'
import { GuestScaleProvider } from '@/contexts/guest-scale-context'
import { Phq9Assessment } from '@/components/Phq9Assessment'
import { Gad7Assessment } from '@/components/Gad7Assessment'
import { YbocsAssessment } from '@/components/YbocsAssessment'
import { SdsAssessment } from '@/components/SdsAssessment'
import { MocaAssessment } from '@/components/MocaAssessment'
import { FasAssessment } from '@/components/FasAssessment'
import { TmtAssessment } from '@/components/TmtAssessment'
import { SemanticFluencyAssessment } from '@/components/SemanticFluencyAssessment'
import { FtdrsAssessment } from '@/components/FtdrsAssessment'
import { GenericScaleAssessment } from '@/components/GenericScaleAssessment'
import { MarcosDesenvolvimentoAssessment } from '@/components/MarcosDesenvolvimentoAssessment'
import { EXTRA_SCALES } from '@/lib/extra-scales-data'

/**
 * Mapa de rotas de escala (parâmetro da URL) -> metadados para renderização.
 */
const SCALE_META: Record<string, { title: string; subtitle: string; time: string }> = {
  bdi: {
    title: 'Inventário de Depressão de Beck (BDI-II)',
    subtitle: 'Triagem e gravidade de depressão (21 itens)',
    time: '5-10 min',
  },
  bai: {
    title: 'Inventário de Ansiedade de Beck (BAI)',
    subtitle: 'Triagem e gravidade de ansiedade (21 itens)',
    time: '5-10 min',
  },
  phq9: { title: 'Avaliação PHQ-9', subtitle: 'Triagem de Depressão', time: '3-5 min' },
  gad7: { title: 'Avaliação GAD-7', subtitle: 'Triagem de Ansiedade', time: '3-5 min' },
  hama: {
    title: 'Escala de Ansiedade de Hamilton (HAM-A)',
    subtitle: 'Triagem de Ansiedade',
    time: '10-15 min',
  },
  hamd: {
    title: 'Escala de Depressão de Hamilton (HAM-D)',
    subtitle: 'Triagem de Depressão',
    time: '15-20 min',
  },
  asrs18: { title: 'ASRS-18 (TDAH Adulto)', subtitle: 'Auto-Relato de TDAH', time: '5-10 min' },
  moca: {
    title: 'Montreal Cognitive Assessment (MoCA)',
    subtitle: 'Triagem cognitiva',
    time: '10-15 min',
  },
  meem: {
    title: 'Mini Exame do Estado Mental (MEEM)',
    subtitle: 'Triagem cognitiva',
    time: '7-10 min',
  },
  ybocs: {
    title: 'Yale-Brown Obsessive-Compulsive Scale (Y-BOCS)',
    subtitle: 'Avaliação de TOC',
    time: '15-20 min',
  },
  fas: {
    title: 'Teste de Fluência Verbal FAS',
    subtitle: 'Função executiva frontal',
    time: '3-5 min',
  },
  ftdrs: {
    title: 'Frontotemporal Dementia Rating Scale (FTDRS)',
    subtitle: 'Demência Frontotemporal',
    time: '15-20 min',
  },
  sds: { title: 'Sheehan Disability Scale (SDS)', subtitle: 'Impacto funcional', time: '3-5 min' },
  'marcos-desenvolvimento': {
    title: 'Marcos do Desenvolvimento Infantil (0-6 anos)',
    subtitle: 'Triagem do neurodesenvolvimento',
    time: '10-15 min',
  },
  'cognitive-triage': {
    title: 'Triagem Cognitiva NeuroFlow',
    subtitle: 'Triagem cognitiva complementar (MoCA/MEEM)',
    time: '15-20 min',
  },
  tmt: {
    title: 'Trail Making Test (TMT A/B)',
    subtitle: 'Atenção visual, velocidade psicomotora e flexibilidade executiva',
    time: '5-10 min',
  },
  'fluencia-semantica': {
    title: 'Fluência Verbal Semântica',
    subtitle: 'Categorias: Animais e Frutas (60s cada)',
    time: '3-5 min',
  },
}

/**
 * Normaliza o parâmetro `scale` da URL para a chave usada em SCALE_META.
 *
 * Resolve o problema de escalas com hífen/espaço que não batiam com as chaves
 * do mapa (ex.: "gad-7" → "gad7", "mini 5.0.0" → "mini").
 */
function normalizeScaleType(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const lower = raw.toLowerCase().trim()
  // Caso especial: MINI 5.0.0 (pode chegar como "mini-5.0.0", "mini 5.0.0", etc.)
  if (/^mini[\s._-]*5/.test(lower)) return 'mini500'
  // Casos especiais: siglas que não colapsam diretamente para a chave do SCALE_META.
  if (lower === 'marcos') return 'marcos-desenvolvimento'
  if (lower === 'cog-triage' || lower === 'cogtriage') return 'cognitive-triage'
  if (
    lower === 'tmt' ||
    lower === 'tmt a/b' ||
    lower === 'tmta' ||
    lower === 'tmtb' ||
    lower === 'tmt a' ||
    lower === 'tmt b' ||
    lower === 'tmt-a/b'
  )
    return 'tmt'
  if (
    lower.includes('fluencia-semantica') ||
    lower.includes('fluência semântica') ||
    lower.includes('fluenciasemantica') ||
    lower.includes('semantica')
  )
    return 'fluencia-semantica'
  // Demais escalas: remove hifens, espaços e underscores (gad-7 → gad7, y-bocs → ybocs)
  return lower.replace(/[\s_-]/g, '')
}

export default function PublicScaleAssessment() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const urlScaleParam = searchParams.get('scale') ?? undefined
  const pathScale = location.pathname.replace(/^\/avaliacao\//, '').replace(/\/$/, '')
  const scaleType = normalizeScaleType(urlScaleParam || pathScale)
  const guestId = searchParams.get('guest_id') || localStorage.getItem('guest_id')
  const [consented, setConsented] = useState(false)

  // Identificação ausente.
  if (!guestId) {
    return (
      <PublicPageShell>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Identificação ausente</h1>
          <p className="text-white/80">
            Não foi possível identificar o paciente. Acesse suas avaliações através do link enviado
            pelo seu profissional de saúde.
          </p>
        </div>
      </PublicPageShell>
    )
  }

  // Escala não suportada nesta rota.
  if (!scaleType || !SCALE_META[scaleType]) {
    return (
      <PublicPageShell>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Escala não encontrada</h1>
          <p className="text-white/80">
            A escala solicitada não está disponível. Verifique o link enviado pelo seu profissional
            de saúde.
          </p>
        </div>
      </PublicPageShell>
    )
  }

  const meta = SCALE_META[scaleType]

  // TCLE obrigatório antes de iniciar.
  if (!consented) {
    return <InformedConsent onAccept={() => setConsented(true)} />
  }

  return (
    <PublicPageShell>
      <GuestScaleProvider guestId={guestId}>
        <div
          className="min-h-[calc(100vh-8rem)] rounded-2xl p-4 sm:p-6 space-y-5 max-w-[820px] mx-auto"
          style={{ background: 'radial-gradient(ellipse at top, #112240 0%, #0A192F 70%)' }}
        >
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Brain className="h-6 w-6 text-[#00FFFF]" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">{meta.title}</h1>
            </div>
            <p className="text-[#00FFFF]/80 text-sm font-medium">{meta.subtitle}</p>
          </div>
          <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2">
            <Lock className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <p className="text-xs text-white/70">
              Avaliação <strong className="text-[#00FFFF]">sem login</strong>. Seus dados são
              protegidos pela LGPD e as respostas são enviadas diretamente ao seu profissional de
              saúde.
            </p>
          </div>

          <ScaleContent scaleType={scaleType} />
        </div>
      </GuestScaleProvider>
    </PublicPageShell>
  )
}

function ScaleContent({ scaleType }: { scaleType: string }) {
  switch (scaleType) {
    case 'phq9':
      return <Phq9Assessment />
    case 'gad7':
      return <Gad7Assessment />
    case 'ybocs':
      return <YbocsAssessment />
    case 'sds':
      return <SdsAssessment />
    case 'moca':
      return <MocaAssessment />
    case 'fas':
      return <FasAssessment />
    case 'tmt':
      return <TmtAssessment />
    case 'fluencia-semantica':
      return <SemanticFluencyAssessment />
    case 'ftdrs':
      return <FtdrsAssessment />
    case 'marcos-desenvolvimento':
      return <MarcosDesenvolvimentoAssessment />
    case 'bdi':
    case 'bai':
    case 'hamd':
    case 'hama':
    case 'asrs18':
    case 'meem':
    case 'cognitive-triage':
      return <GenericScaleAssessment scale={EXTRA_SCALES[scaleType]} />
    default:
      return null
  }
}
