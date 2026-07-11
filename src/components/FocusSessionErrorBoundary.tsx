import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FocusSessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.warn('[FocusSessionErrorBoundary] Caught:', error.name, error.message)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const isPermissionError =
      this.state.error?.name === 'NotAllowedError' || this.state.error?.name === 'SecurityError'
    const Icon = isPermissionError ? ShieldAlert : AlertCircle
    const title = isPermissionError ? 'Permissão de Câmera Negada' : 'Erro na Sessão de Foco'
    const hint = isPermissionError
      ? 'O acesso à câmera foi negado. Clique no ícone de câmera na barra de endereço do seu navegador para permitir o acesso e tente novamente.'
      : 'Ocorreu um erro inesperado durante a sessão. Por favor, tente novamente.'

    return (
      <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-medium mb-2 text-[#E6F1FF]">{title}</h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">{hint}</p>
          <Button
            onClick={this.handleRetry}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }
}
