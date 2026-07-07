import { useAuth } from '@/contexts/auth-context'
import { MainDeployment } from '@/components/MainDeployment'
import FocusSession from '@/pages/FocusSession'

export default function FocusSessionRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <MainDeployment />
  }

  return <FocusSession />
}
