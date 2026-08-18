import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Loader2, AlertCircle, RefreshCw, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOnboardingState, markOnboardingComplete } from '@/services/user-onboarding'

interface AuthUser {
  id: string
  email: string
  name: string
}

export type UserRole = string

interface AuthContextType {
  isAuthenticated: boolean
  isMfaVerified: boolean
  user: AuthUser | null
  session: Session | null
  loading: boolean
  authTimeout: boolean
  needsOnboarding: boolean
  profileChecked: boolean
  isAdmin: boolean
  isDoctor: boolean
  isStaff: boolean
  isPatient: boolean
  role: UserRole | null
  bleOnboardingCompleted: boolean
  pairedSensorId: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  resendConfirmation: (email: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    privacyConsent: boolean,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  verifyMfa: (code: string) => Promise<void>
  logout: () => Promise<void>
  completeOnboarding: () => Promise<void>
  completeBleOnboarding: (sensorId?: string) => Promise<void>
  retryAuth: () => void
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
  const [authTimeout, setAuthTimeout] = useState(false)
  const [isMfaVerified, setIsMfaVerified] = useState(
    () => localStorage.getItem('neuroflow_mfa_verified') === 'true',
  )
  const [profile, setProfile] = useState<any>(null)
  const [profileChecked, setProfileChecked] = useState(false)
  const [onboarding, setOnboarding] = useState<{
    is_first_access: boolean
    paired_sensor_id: string | null
  } | null>(null)

  const isAuthenticated = !!session && !!user

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setOnboarding(null)
      setProfileChecked(true)
      return
    }
    setProfileChecked(false)
    void (async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        setProfile(data)
      } catch {
        setProfile(null)
      } finally {
        setProfileChecked(true)
      }
    })()
    getOnboardingState(user.id).then((data) => {
      setOnboarding(
        data
          ? { is_first_access: data.is_first_access, paired_sensor_id: data.paired_sensor_id }
          : null,
      )
    })
  }, [user])

  const needsOnboarding = isAuthenticated && isMfaVerified && (!profile || !profile.privacy_consent)
  const role: UserRole | null = profile?.role ?? null
  const isAdmin = !!profile && profile.role === 'admin'
  const isDoctor = !!profile && profile.role === 'doctor'
  const isStaff = !!profile && profile.role === 'staff'
  const isPatient = !!profile && profile.role === 'hospede'
  const bleOnboardingCompleted = onboarding
    ? !onboarding.is_first_access
    : !!profile?.has_completed_onboarding

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

  useEffect(() => {
    if (!loading) {
      setAuthTimeout(false)
      return
    }
    const timer = setTimeout(() => setAuthTimeout(true), 10000)
    return () => clearTimeout(timer)
  }, [loading])

  const retryAuth = () => {
    setAuthTimeout(false)
    setLoading(true)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(mapUser(s))
      if (!s) {
        setIsMfaVerified(false)
        localStorage.removeItem('neuroflow_mfa_verified')
      }
      setLoading(false)
    })
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials')) {
        return { error: 'E-mail ou senha incorretos.' }
      }
      if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
        return { error: 'E-mail não confirmado. Verifique sua caixa de entrada.' }
      }
      if (msg.includes('rate') || msg.includes('too many')) {
        return { error: 'Muitas tentativas. Aguarde alguns minutos.' }
      }
      return { error: error.message }
    }
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
    if (error) {
      const msg = error.message.toLowerCase()
      if (
        msg.includes('rate') ||
        msg.includes('too many') ||
        msg.includes('429') ||
        msg.includes('security purposes') ||
        msg.includes('seconds')
      ) {
        return {
          error:
            'Muitas tentativas em pouco tempo. O plano gratuito do Supabase limita o envio de e-mails (4/hora). Aguarde alguns minutos e tente novamente.',
          needsEmailConfirmation: false,
        }
      }
      if (msg.includes('already') || msg.includes('registered')) {
        return { error: 'Este e-mail já está cadastrado.', needsEmailConfirmation: false }
      }
      if (msg.includes('weak') || msg.includes('password')) {
        return {
          error: 'A senha é muito fraca. Use pelo menos 8 caracteres.',
          needsEmailConfirmation: false,
        }
      }
      return { error: error.message, needsEmailConfirmation: false }
    }

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
      return { error: null, needsEmailConfirmation: false }
    }

    return { error: null, needsEmailConfirmation: true }
  }

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ email, type: 'signup' })
    if (error) {
      const msg = error.message.toLowerCase()
      if (
        msg.includes('rate') ||
        msg.includes('too many') ||
        msg.includes('429') ||
        msg.includes('security purposes') ||
        msg.includes('seconds')
      ) {
        return { error: 'Aguarde alguns minutos antes de solicitar um novo e-mail.' }
      }
      return { error: error.message }
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

  const completeOnboarding = async () => {
    if (!user) return
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        privacy_consent: true,
        privacy_consent_accepted_at: new Date().toISOString(),
        role: 'hospede',
        full_name: user.name,
      },
      { onConflict: 'id' },
    )
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    setProfile(data)
  }

  const completeBleOnboarding = async (sensorId?: string) => {
    if (!user) return
    await supabase
      .from('profiles')
      .upsert({ id: user.id, has_completed_onboarding: true }, { onConflict: 'id' })
    if (sensorId) {
      await markOnboardingComplete(user.id, sensorId)
    }
    const onboardingData = await getOnboardingState(user.id)
    setOnboarding(
      onboardingData
        ? {
            is_first_access: onboardingData.is_first_access,
            paired_sensor_id: onboardingData.paired_sensor_id,
          }
        : null,
    )
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    setProfile(data)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isMfaVerified,
        user,
        session,
        loading,
        authTimeout,
        needsOnboarding,
        profileChecked,
        isAdmin,
        isDoctor,
        isStaff,
        isPatient,
        role,
        bleOnboardingCompleted,
        pairedSensorId: onboarding?.paired_sensor_id ?? null,
        signIn,
        resendConfirmation,
        signUp,
        verifyMfa,
        logout,
        completeOnboarding,
        completeBleOnboarding,
        retryAuth,
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
  requireAdmin = false,
  requireStaff = false,
  requireClinical = false,
}: {
  children: ReactNode
  requireMfa?: boolean
  requireAdmin?: boolean
  requireStaff?: boolean
  requireClinical?: boolean
}) {
  const {
    isAuthenticated,
    isMfaVerified,
    loading,
    authTimeout,
    needsOnboarding,
    profileChecked,
    isAdmin,
    isDoctor,
    isStaff,
    retryAuth,
  } = useAuth()
  const location = useLocation()

  if (authTimeout && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tempo excedido</h2>
        <p className="text-sm text-white/85 mb-6 text-center max-w-sm">
          A verificacao de autenticacao esta demorando mais do que o esperado. Verifique sua conexao
          e tente novamente.
        </p>
        <Button
          onClick={retryAuth}
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-400/90 font-semibold rounded-full px-6"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (loading || (isAuthenticated && isMfaVerified && !profileChecked)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-white p-6"
        style={{ backgroundColor: '#0A192F' }}
      >
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl" />
            <Brain className="relative h-12 w-12 text-cyan-400" />
          </div>
          <h1 className="text-xl font-semibold mb-4 tracking-tight">NeuroFlow AI</h1>
          <div className="flex items-center gap-2 text-sm text-white/75">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span>NeuroFlow AI — Carregando...</span>
          </div>
        </div>
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

  if (needsOnboarding) {
    if (location.pathname === '/onboarding') return <>{children}</>
    return <Navigate to="/onboarding" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // requireStaff: staff OR admin (admin can do everything staff can)
  if (requireStaff && !isStaff && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireClinical && !isAdmin && !isDoctor) {
    return <Navigate to="/dashboard" replace />
  }

  if (
    location.pathname === '/login' ||
    location.pathname === '/mfa' ||
    location.pathname === '/onboarding'
  ) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
