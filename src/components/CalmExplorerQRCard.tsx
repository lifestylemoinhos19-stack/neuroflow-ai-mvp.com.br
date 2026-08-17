import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, Copy, QrCode } from 'lucide-react'
import { toast } from 'sonner'

/**
 * URL pública do Explorador da Calma (Focus Session).
 * Aponta para a rota /focus-session (FocusSessionRoute) no app NeuroFlow AI.
 */
export const CALM_EXPLORER_URL = 'https://neuroflow-ai-mvp-61ac1.goskip.app/focus-session'

const CALM_EXPLORER_TAGLINE =
  'Escaneie para acessar o Explorador da Calma — uma pausa guiada para sua mente.'

type CalmExplorerQRCardProps = {
  /**
   * Tamanho em pixels do QR code renderizado.
   * Use 280 para a versão grande (Painel Admin) e 180 para a versão menor
   * (Atribuir Escalas / tablet do consultório).
   */
  size?: number
  /** Compacta o card (sem descrição longa) — ideal para a tela de staff. */
  compact?: boolean
  /** Título exibido no cabeçalho do card. */
  title?: string
  /** Descrição exibida abaixo do título. */
  description?: string
}

/**
 * Card reutilizável com o QR Code do Explorador da Calma.
 *
 * Usado tanto no Painel Admin (/admin/painel) quanto na tela de
 * Atribuir Escalas (/atribuir-escalas) para que admin e equipe técnica
 * possam exibir / imprimir o QR code no consultório.
 *
 * O QR code usa fundo branco com foreground escuro (#0A192F) — a
 * combinação de maior contraste e mais escaneável — enquadrado pelo
 * visual escuro do NeuroFlow.
 */
export default function CalmExplorerQRCard({
  size = 280,
  compact = false,
  title = 'QR Code do Explorador da Calma',
  description = 'Mostre este QR code ao paciente no tablet do consultório para que ele acesse a pausa guiada.',
}: CalmExplorerQRCardProps) {
  const qrWrapperRef = useRef<HTMLDivElement>(null)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(CALM_EXPLORER_URL)
      toast.success('Link copiado para a área de transferência.')
    } catch {
      toast.error('Não foi possível copiar o link. Selecione e copie manualmente.')
    }
  }

  const handlePrint = () => {
    const svgEl = qrWrapperRef.current?.querySelector('svg')
    const svgString = svgEl ? new XMLSerializer().serializeToString(svgEl) : ''

    const printWindow = window.open('', '_blank', 'width=820,height=1000')
    if (!printWindow) {
      toast.error(
        'Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.',
      )
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>QR Code — Explorador da Calma · NeuroFlow AI</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #ffffff;
    color: #0A192F;
  }
  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 48px 24px;
    text-align: center;
  }
  .logo {
    width: 120px;
    height: 120px;
    margin-bottom: 20px;
  }
  .brand {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0 0 4px;
    color: #0A192F;
  }
  .brand span { color: #00B8D4; }
  .heading {
    font-size: 22px;
    font-weight: 700;
    margin: 18px 0 6px;
    color: #0A192F;
  }
  .qr {
    margin: 22px auto 18px;
    padding: 18px;
    border: 2px solid #0A192F;
    border-radius: 16px;
    background: #ffffff;
  }
  .qr svg { display: block; width: ${size}px; height: ${size}px; }
  .link {
    font-size: 15px;
    color: #1f3a5f;
    word-break: break-all;
    max-width: 520px;
    margin: 0 auto 18px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .tagline {
    font-size: 16px;
    font-style: italic;
    color: #334155;
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.5;
  }
  .footer {
    margin-top: 32px;
    font-size: 12px;
    color: #94a3b8;
  }
  @media print {
    .page { min-height: auto; }
  }
</style>
</head>
<body>
  <div class="page">
    <img class="logo" src="${window.location.origin}/logo.svg" alt="NeuroFlow AI" />
    <p class="brand">Neuro<span>Flow</span> AI</p>
    <h1 class="heading">Explorador da Calma</h1>
    <div class="qr">${svgString}</div>
    <p class="link">${CALM_EXPLORER_URL}</p>
    <p class="tagline">${CALM_EXPLORER_TAGLINE}</p>
    <p class="footer">NeuroFlow AI · Apresente este QR code ao paciente no consultório.</p>
  </div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    // Aguarda o logo/SVG carregarem antes de imprimir.
    printWindow.onload = () => {
      printWindow.print()
    }
    // Fallback caso onload não dispare a tempo.
    setTimeout(() => {
      try {
        printWindow.print()
      } catch {
        /* noop */
      }
    }, 600)
  }

  return (
    <Card className="border-slate-800">
      <CardHeader>
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <QrCode className="h-5 w-5 text-[#00FFFF]" /> {title}
        </CardTitle>
        {!compact && <CardDescription className="text-white/80">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5">
        {/* QR code: fundo branco + foreground escuro (#0A192F) = máximo contraste/scaneabilidade */}
        <div
          ref={qrWrapperRef}
          className="rounded-xl bg-white p-4 shadow-lg shadow-[#00FFFF]/10"
          aria-label="QR Code do Explorador da Calma"
        >
          <QRCodeSVG
            value={CALM_EXPLORER_URL}
            size={size}
            level="H"
            marginSize={2}
            bgColor="#FFFFFF"
            fgColor="#0A192F"
            title="Explorador da Calma — NeuroFlow AI"
          />
        </div>

        <p className="text-sm text-white/80 font-mono break-all text-center max-w-md">
          {CALM_EXPLORER_URL}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Button
            onClick={handlePrint}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" /> Copiar Link
          </Button>
        </div>

        {!compact && (
          <p className="text-xs text-white/60 text-center max-w-md italic">
            {CALM_EXPLORER_TAGLINE}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
