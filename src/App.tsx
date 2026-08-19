import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider, AuthGuard } from '@/contexts/auth-context'
import { BrandingProvider } from '@/hooks/use-branding'
import { useGuestConversion } from '@/hooks/use-guest-conversion'
import BetaLanding from '@/pages/BetaLanding'
import BetaFeedback from '@/pages/BetaFeedback'
import NeuroValidationPage from '@/pages/NeuroValidationPage'
import StressTestDashboard from '@/pages/StressTestDashboard'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import MFA from '@/pages/MFA'
import Index from '@/pages/Index'
import Insights from '@/pages/Insights'
import HealthLogs from '@/pages/HealthLogs'
import Security from '@/pages/Security'
import Anamnesis from '@/pages/Anamnesis'
import MiniInterview from '@/pages/MiniInterview'
import MiniEvolutionDashboard from '@/pages/MiniEvolutionDashboard'
import Onboarding from '@/pages/Onboarding'
import Scales from '@/pages/Scales'
import Dashboard from '@/pages/Dashboard'
import Ethics from '@/pages/Ethics'
import EthicalAuditDashboard from '@/pages/EthicalAuditDashboard'
import IndicatorsDashboard from '@/pages/IndicatorsDashboard'
import TermsOfUse from '@/pages/TermsOfUse'
import ValidationPage from '@/pages/ValidationPage'
import NotFound from '@/pages/NotFound'
import Welcome from '@/pages/Welcome'
import MinhasEscalas from '@/pages/MinhasEscalas'
import NeuroFlowLanding from '@/pages/NeuroFlowLanding'
import CaptureChoice from '@/pages/CaptureChoice'
import FocusSessionRoute from '@/pages/FocusSessionRoute'
import { MainDeployment } from '@/components/MainDeployment'
import { CalmExplorerModal } from '@/components/CalmExplorerModal'
import { AdminToolbar } from '@/components/AdminToolbar'
import SessionSummary from '@/pages/SessionSummary'
import OpticalOnboarding from '@/pages/OpticalOnboarding'
import PublicAssessment from '@/pages/PublicAssessment'
import PublicAnamnesis from '@/pages/PublicAnamnesis'
import PublicScaleAssessment from '@/pages/PublicScaleAssessment'
import History from '@/pages/History'
import Documents from '@/pages/Documents'
import Phq9Page from '@/pages/Phq9Page'
import SdsPage from '@/pages/SdsPage'
import YbocsPage from '@/pages/YbocsPage'
import ClinicalModulesHub from '@/pages/ClinicalModulesHub'
import MocaPage from '@/pages/MocaPage'
import FtdrsPage from '@/pages/FtdrsPage'
import FasPage from '@/pages/FasPage'
import Gad7Page from '@/pages/Gad7Page'
import Mini500 from '@/pages/Mini500'
import AdminPainel from '@/pages/AdminPainel'
import AssignScales from '@/pages/AssignScales'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'

/**
 * RoleGate restricts a route to the given roles. `role` comes from the Supabase
 * profiles table via AuthContext (never localStorage). When `denyStaff` is set,
 * staff is explicitly blocked even if present in `allow` (convenience flag).
 */
function RoleGate({
  allow,
  denyStaff = false,
  children,
}: {
  allow: string[]
  denyStaff?: boolean
  children: ReactNode
}) {
  const { role, isStaff } = useAuth()
  if (!role) return <Navigate to="/dashboard" replace />
  if (denyStaff && isStaff) return <Navigate to="/dashboard" replace />
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppInner() {
  useGuestConversion()
  return (
    <>
      <CalmExplorerModal />
      <AdminToolbar />
      <Routes>
        <Route
          path="/login"
          element={
            <AuthGuard requireMfa={false}>
              <Login />
            </AuthGuard>
          }
        />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/validar/:sessionId" element={<ValidationPage />} />
        <Route path="/security" element={<Security />} />
        <Route path="/ethics" element={<Ethics />} />
        <Route path="/about" element={<Ethics />} />
        <Route path="/avaliacao" element={<PublicAssessment />} />
        {/*
          Rotas públicas dedicadas para cada escala (sem AuthGuard).
          O paciente chega aqui a partir de /minhas-escalas com guest_id via
          query param. Cada rota renderiza o componente da escala dentro do
          GuestScaleProvider, permitindo salvar respostas sem login.
          Estão registradas ANTES de /avaliacao/:scale para terem prioridade
          de correspondência (rotas estáticas antes de dinâmicas no React Router).
          /avaliacao/snapiv, /avaliacao/assq e /avaliacao/cbcl continuam
          funcionando via PublicAssessment (abaixo) com a rota dinâmica.
        */}
        <Route path="/avaliacao/anamnese" element={<PublicAnamnesis />} />
        <Route path="/avaliacao/phq9" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/gad7" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/hama" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/hamd" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/asrs18" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/moca" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/meem" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/ybocs" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/fas" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/ftdrs" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/sds" element={<PublicScaleAssessment />} />
        <Route path="/avaliacao/:scale" element={<PublicAssessment />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/minhas-escalas" element={<MinhasEscalas />} />
        <Route path="/neuroflow-ia" element={<NeuroFlowLanding />} />
        <Route path="/capture-choice" element={<CaptureChoice />} />
        <Route
          path="/mfa"
          element={
            <AuthGuard requireMfa={false}>
              <MFA />
            </AuthGuard>
          }
        />
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <Onboarding />
            </AuthGuard>
          }
        />
        <Route
          path="/optical-onboarding"
          element={
            <AuthGuard>
              <OpticalOnboarding />
            </AuthGuard>
          }
        />
        <Route path="/focus-session" element={<FocusSessionRoute />} />
        <Route
          path="/deployment"
          element={
            <AuthGuard>
              <MainDeployment />
            </AuthGuard>
          }
        />
        <Route
          path="/session-summary"
          element={
            <AuthGuard>
              <SessionSummary />
            </AuthGuard>
          }
        />
        <Route
          path="/beta"
          element={
            <AuthGuard>
              <BetaLanding />
            </AuthGuard>
          }
        />
        <Route
          path="/beta-feedback"
          element={
            <AuthGuard>
              <BetaFeedback />
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          {/* /anamnesis: admin, doctor, staff (start only). Patient forbidden. */}
          <Route
            path="/anamnesis"
            element={
              <RoleGate allow={['admin', 'doctor', 'staff']}>
                <Anamnesis />
              </RoleGate>
            }
          />
          {/* /mini-interview must be preserved intact — admin + doctor only. */}
          <Route
            path="/mini-interview"
            element={
              <RoleGate allow={['admin', 'doctor']}>
                <MiniInterview />
              </RoleGate>
            }
          />
          {/* /mini: admin, doctor, staff (start). Patient forbidden. */}
          <Route
            path="/mini"
            element={
              <RoleGate allow={['admin', 'doctor', 'staff']}>
                <Mini500 />
              </RoleGate>
            }
          />
          {/* /scales: admin, doctor, staff (select). Patient forbidden. */}
          <Route
            path="/scales"
            element={
              <RoleGate allow={['admin', 'doctor', 'staff']}>
                <Scales />
              </RoleGate>
            }
          />
          {/* /modulos-clinicos: admin + doctor only. */}
          <Route
            path="/modulos-clinicos"
            element={
              <RoleGate allow={['admin', 'doctor']}>
                <ClinicalModulesHub />
              </RoleGate>
            }
          />
          {/* /dashboard: admin, doctor, patient (simplified). Staff forbidden. */}
          <Route
            path="/dashboard"
            element={
              <RoleGate allow={['admin', 'doctor', 'hospede']} denyStaff>
                <Dashboard />
              </RoleGate>
            }
          />
          <Route path="/dashboard/evolution" element={<MiniEvolutionDashboard />} />
          <Route
            path="/dashboard/evolution/:patientId"
            element={
              <AuthGuard requireClinical>
                <MiniEvolutionDashboard />
              </AuthGuard>
            }
          />
          <Route path="/insights" element={<Insights />} />
          <Route path="/logs" element={<HealthLogs />} />
          {/* /historico: admin, doctor (all), patient (own only). Staff forbidden. */}
          <Route
            path="/historico"
            element={
              <RoleGate allow={['admin', 'doctor', 'hospede']} denyStaff>
                <History />
              </RoleGate>
            }
          />
          {/* /documentos: admin, doctor (all), patient (own only). Staff forbidden. */}
          <Route
            path="/documentos"
            element={
              <RoleGate allow={['admin', 'doctor', 'hospede']} denyStaff>
                <Documents />
              </RoleGate>
            }
          />
          {/* Staff-only: assign scales to a patient */}
          <Route
            path="/atribuir-escalas"
            element={
              <AuthGuard requireStaff>
                <AssignScales />
              </AuthGuard>
            }
          />
          <Route path="/evaluations/phq9" element={<Phq9Page />} />
          <Route path="/evaluations/gad7" element={<Gad7Page />} />
          <Route path="/evaluations/sds" element={<SdsPage />} />
          <Route path="/evaluations/moca" element={<MocaPage />} />
          <Route path="/evaluations/ftdrs" element={<FtdrsPage />} />
          <Route path="/evaluations/fas" element={<FasPage />} />
          <Route path="/ybocs-assessment" element={<YbocsPage />} />
          <Route path="/neuro-validation" element={<NeuroValidationPage />} />
          <Route path="/stress-test" element={<StressTestDashboard />} />
          <Route
            path="/admin/stress-tests"
            element={
              <AuthGuard requireAdmin>
                <StressTestDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/painel"
            element={
              <AuthGuard requireAdmin>
                <AdminPainel />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/ethical-audit"
            element={
              <AuthGuard requireAdmin>
                <EthicalAuditDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/indicators"
            element={
              <AuthGuard requireClinical>
                <IndicatorsDashboard />
              </AuthGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </>
  )
}

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrandingProvider>
          <AppInner />
        </BrandingProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
