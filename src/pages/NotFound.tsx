import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Brain } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <Brain className="h-16 w-16 text-slate-300" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-8">Página não encontrada ou rota inacessível.</p>
        <Button asChild>
          <Link to="/">Voltar ao Painel Seguro</Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
