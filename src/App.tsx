import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider, AuthGuard } from '@/contexts/auth-context'
import NeuroValidationPage from '@/pages/NeuroValidationPage'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import MFA from '@/pages/MFA'
import Index from '@/pages/Index'
import Insights from '@/pages/Insights'
import HealthLogs from '@/pages/HealthLogs'
import Security from '@/pages/Security'
import Anamnesis from '@/pages/Anamnesis'
import Onboarding from '@/pages/Onboarding'
import Scales from '@/pages/Scales'
import Dashboard from '@/pages/Dashboard'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          {/* Public / Semi-public Routes */}
          <Route
            path="/login"
            element={
              <AuthGuard requireMfa={false}>
                <Login />
              </AuthGuard>
            }
          />
          <Route
            path="/mfa"
            element={
              <AuthGuard requireMfa={false}>
                <MFA />
              </AuthGuard>
            }
          />

          {/* Onboarding Route (requires Auth + MFA, but not onboarding) */}
          <Route
            path="/onboarding"
            element={
              <AuthGuard>
                <Onboarding />
              </AuthGuard>
            }
          />

          {/* Protected Routes (require Auth + MFA + Onboarding) */}
          <Route
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/anamnesis" element={<Anamnesis />} />
            <Route path="/scales" element={<Scales />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/logs" element={<HealthLogs />} />
            <Route path="/security" element={<Security />} />
            <Route path="/neuro-validation" element={<NeuroValidationPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
