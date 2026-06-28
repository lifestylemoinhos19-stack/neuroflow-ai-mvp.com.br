import { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface AuthState {
  isAuthenticated: boolean
  isMfaVerified: boolean
  user: { name: string; email: string } | null
}

interface AuthContextType extends AuthState {
  login: (token: string) => void
  verifyMfa: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('neuroflow_auth')
    if (saved) return JSON.parse(saved)
    return { isAuthenticated: false, isMfaVerified: false, user: null }
  })

  useEffect(() => {
    localStorage.setItem('neuroflow_auth', JSON.stringify(state))
  }, [state])

  const login = (token: string) => {
    setState({
      isAuthenticated: true,
      isMfaVerified: false,
      user: { name: 'Dr. Usuário', email: 'admin@neuroflow.ai' },
    })
  }

  const verifyMfa = () => {
    setState((prev) => ({ ...prev, isMfaVerified: true }))
  }

  const logout = () => {
    setState({ isAuthenticated: false, isMfaVerified: false, user: null })
    localStorage.removeItem('neuroflow_auth')
  }

  return createElement(
    AuthContext.Provider,
    { value: { ...state, login, verifyMfa, logout } },
    children,
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function AuthGuard({
  children,
  requireMfa = true,
}: {
  children: ReactNode
  requireMfa?: boolean
}) {
  const { isAuthenticated, isMfaVerified } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true })
    } else if (isAuthenticated && !isMfaVerified && requireMfa && location.pathname !== '/mfa') {
      navigate('/mfa', { replace: true })
    } else if (
      isAuthenticated &&
      isMfaVerified &&
      (location.pathname === '/login' || location.pathname === '/mfa')
    ) {
      navigate('/', { replace: true })
    }
    setIsChecking(false)
  }, [isAuthenticated, isMfaVerified, location.pathname, navigate, requireMfa])

  if (isChecking) return null

  return createElement(import('react').Fragment, null, children)
}
