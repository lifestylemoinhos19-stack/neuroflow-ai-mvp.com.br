import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { MainDeployment } from '@/components/MainDeployment'
import { FocusSessionErrorBoundary } from '@/components/FocusSessionErrorBoundary'

export default function FocusSessionRoute() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.info('Faça login para acessar sessões de foco e ganhar cristais.')
      navigate('/login', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <FocusSessionErrorBoundary>
      <MainDeployment />
    </FocusSessionErrorBoundary>
  )
}
