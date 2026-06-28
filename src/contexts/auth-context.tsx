import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isMfaVerified: boolean
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    privacyConsent: boolean,
  ) => Promise<{ error: string | null }>
  verifyMfa: (code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null
  const u = session.user
  return {
    id: u.id,
    email: u.email || '',
    name: (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Usuário',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMfaVerified, setIsMfaVerified] = useState(
    () => localStorage.getItem('neuroflow_mfa_verified') === 'true',
  )

  const isAuthenticated = !!session && !!user

  useEffect(() => {
    const applySession = (s: Session | null) => {
      setSession(s)
      setUser(mapUser(s))
      if (!s) {
        setIsMfaVerified(false)
        localStorage.removeItem('neuroflow_mfa_verified')
      }
      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s)
    })

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    setIsMfaVerified(false)
    localStorage.removeItem('neuroflow_mfa_verified')
    return { error: null }
  }

  const signUp = async (email: string, password: string, privacyConsent: boolean) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: email.split('@')[0], privacy_consent: privacyConsent },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) return { error: error.message }

    if (data.user && data.session) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: email.split('@')[0],
          role: 'hospede',
          privacy_consent: privacyConsent,
          privacy_consent_accepted_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
    }

    return { error: null }
  }

  const verifyMfa = async (code: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (code !== '123456') {
      throw new Error('Código inválido. Dica: use 123456')
    }
    setIsMfaVerified(true)
    localStorage.setItem('neuroflow_mfa_verified', 'true')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsMfaVerified(false)
    localStorage.removeItem('neuroflow_mfa_verified')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isMfaVerified,
        user,
        session,
        loading,
        signIn,
        signUp,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export function AuthGuard({
  children,
  requireMfa = true,
}: {
  children: ReactNode
  requireMfa?: boolean
}) {
  const { isAuthenticated, isMfaVerified, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (location.pathname === '/login' || location.pathname === '/mfa') {
      return <>{children}</>
    }
    return <Navigate to="/login" replace />
  }

  if (!isMfaVerified) {
    if (location.pathname === '/mfa') return <>{children}</>
    return <Navigate to="/mfa" replace />
  }

  if (location.pathname === '/login' || location.pathname === '/mfa') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
