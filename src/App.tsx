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
import ValidateDocument from '@/pages/ValidateDocument'
import NotFound from '@/pages/NotFound'
import Welcome from '@/pages/Welcome'
import NeuroFlowLanding from '@/pages/NeuroFlowLanding'
import CaptureChoice from '@/pages/CaptureChoice'
import FocusSessionRoute from '@/pages/FocusSessionRoute'
import { MainDeployment } from '@/components/MainDeployment'
import { CalmExplorerModal } from '@/components/CalmExplorerModal'
import { AdminToolbar } from '@/components/AdminToolbar'
import SessionSummary from '@/pages/SessionSummary'
import OpticalOnboarding from '@/pages/OpticalOnboarding'
import PublicAssessment from '@/pages/PublicAssessment'
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
        <Route path="/validar/:id" element={<ValidateDocument />} />
        <Route path="/security" element={<Security />} />
        <Route path="/ethics" element={<Ethics />} />
        <Route path="/about" element={<Ethics />} />
        <Route path="/avaliacao" element={<PublicAssessment />} />
        <Route path="/avaliacao/:scale" element={<PublicAssessment />} />
        <Route path="/welcome" element={<Welcome />} />
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
          <Route path="/anamnesis" element={<Anamnesis />} />
          <Route path="/mini-interview" element={<MiniInterview />} />
          <Route path="/mini" element={<Mini500 />} />
          <Route path="/scales" element={<Scales />} />
          <Route path="/modulos-clinicos" element={<ClinicalModulesHub />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
          <Route path="/historico" element={<History />} />
          <Route path="/documentos" element={<Documents />} />
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
