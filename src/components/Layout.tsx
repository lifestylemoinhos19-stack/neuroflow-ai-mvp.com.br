import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Activity,
  Brain,
  Shield,
  FileText,
  Bell,
  Search,
  LogOut,
  Menu,
  CheckCircle2,
  ClipboardList,
  ClipboardCheck,
  ListChecks,
  LayoutDashboard,
  FlaskConical,
  ScrollText,
  FileSearch,
  Stethoscope,
  LineChart,
  Layers,
  FileCheck,
  UserCog,
  ClipboardPlus,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

// Admin: full clinical + admin/audit + calm explorer
const adminNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard Clínico', icon: LayoutDashboard },
  { path: '/anamnesis', label: 'Anamnese', icon: ClipboardList },
  { path: '/scales', label: 'Escalas', icon: ClipboardCheck },
  { path: '/mini', label: 'MINI 5.0.0', icon: FileCheck },
  { path: '/modulos-clinicos', label: 'Módulos Clínicos', icon: Layers },
  { path: '/historico', label: 'Histórico', icon: LineChart },
  { path: '/documentos', label: 'Documentos', icon: FileText },
  { path: '/admin/painel', label: 'Painel Admin', icon: UserCog },
  { path: '/admin/ethical-audit', label: 'Auditoria', icon: FileSearch },
  { path: '/atribuir-escalas', label: 'Atribuir Escalas', icon: ClipboardPlus },
  { path: '/focus-session', label: 'Explorador da Calma', icon: Brain },
]

// Doctor/Profissional: clinical tools (no admin/audit)
const doctorNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard Clínico', icon: LayoutDashboard },
  { path: '/anamnesis', label: 'Anamnese', icon: ClipboardList },
  { path: '/scales', label: 'Escalas', icon: ClipboardCheck },
  { path: '/mini', label: 'MINI 5.0.0', icon: FileCheck },
  { path: '/modulos-clinicos', label: 'Módulos Clínicos', icon: Layers },
  { path: '/historico', label: 'Histórico', icon: LineChart },
  { path: '/documentos', label: 'Documentos', icon: FileText },
  { path: '/focus-session', label: 'Explorador da Calma', icon: Brain },
]

// Staff (equipe técnica): only assign scales + start interview + calm explorer.
// NO dashboard, histórico, documentos, resultados, laudos.
const staffNavItems: NavItem[] = [
  { path: '/atribuir-escalas', label: 'Atribuir Escalas', icon: ClipboardPlus },
  { path: '/anamnesis', label: 'Iniciar Entrevista', icon: PlayCircle },
  { path: '/scales', label: 'Selecionar Escalas', icon: ClipboardCheck },
  { path: '/mini', label: 'Iniciar MINI', icon: FileCheck },
  { path: '/focus-session', label: 'Explorador da Calma', icon: Brain },
]

// Patient (paciente): simplified dashboard + own interviews + calm explorer.
// NO diagnostic tools (MINI, Módulos Clínicos, Anamnese, Escalas).
const patientNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
  { path: '/historico', label: 'Minhas Entrevistas', icon: LineChart },
  { path: '/documentos', label: 'Meus Documentos', icon: FileText },
  { path: '/focus-session', label: 'Explorador da Calma', icon: Brain },
]

export default function Layout() {
  const { logout, user, isAdmin, isDoctor, isStaff, isPatient } = useAuth()

  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = isAdmin
    ? adminNavItems
    : isDoctor
      ? doctorNavItems
      : isStaff
        ? staffNavItems
        : isPatient
          ? patientNavItems
          : doctorNavItems

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center">
            <img
              src="/logo.svg"
              alt="NeuroFlow AI"
              className="h-8 w-8 mr-2.5 rounded-md object-contain"
            />
            <div>
              <span className="font-display font-bold text-base text-slate-900 block leading-tight">
                NeuroFlow AI
              </span>
              <span className="text-[10px] text-[#7B5B3A] font-semibold block leading-tight">
                Casa Branca Saúde
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const isDashboard = item.path === '/dashboard'

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isDashboard
                    ? isActive
                      ? 'bg-gradient-to-r from-[#7B5B3A] to-[#6D5D4B] text-white shadow-md font-semibold'
                      : 'bg-[#FAF5EB] text-[#7B5B3A] border border-[#C4A35A]/35 hover:bg-[#FAF5EB]/80 hover:border-[#C4A35A] font-semibold shadow-xs'
                    : isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <div className="flex items-center min-w-0">
                  <item.icon
                    className={cn(
                      'h-5 w-5 mr-3 shrink-0',
                      isDashboard
                        ? isActive
                          ? 'text-[#C4A35A]'
                          : 'text-[#7B5B3A]'
                        : isActive
                          ? 'text-primary'
                          : 'text-slate-400',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {isDashboard && (
                  <span
                    className={cn(
                      'text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ml-1.5 shrink-0',
                      isActive ? 'bg-[#C4A35A] text-slate-950' : 'bg-[#7B5B3A]/15 text-[#7B5B3A]',
                    )}
                  >
                    Clínico
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar registros..."
                className="w-full pl-9 bg-slate-50 border-transparent focus-visible:bg-white rounded-full h-9"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Atalho de destaque para o Dashboard Clínico */}
            {location.pathname !== '/dashboard' && (isAdmin || isDoctor) && (
              <Button
                asChild
                size="sm"
                className="hidden lg:flex bg-[#FAF5EB] hover:bg-[#FAF5EB]/90 text-[#7B5B3A] border border-[#C4A35A]/50 rounded-full h-8 px-3 font-semibold text-xs shadow-xs"
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1.5 text-[#C4A35A]" />
                  Dashboard Clínico
                </Link>
              </Button>
            )}
            <div className="hidden sm:flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              MFA Ativo
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-500">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-[#FAF5EB] border border-[#C4A35A]/40 text-[#7B5B3A] flex items-center justify-center font-bold text-sm">
              {user?.name.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-white">
          <div className="animate-fade-in-up max-w-6xl mx-auto pb-20 md:pb-0">
            <Outlet />
            <footer className="mt-12 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap justify-center gap-4 mb-2">
                <Link
                  to="/security"
                  className="text-sm text-slate-400 hover:text-primary transition-colors"
                >
                  Segurança
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/about"
                  className="text-sm text-slate-400 hover:text-primary transition-colors"
                >
                  Institucional
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/terms"
                  className="text-sm text-slate-400 hover:text-primary transition-colors"
                >
                  Termos de Uso
                </Link>
              </div>
              <p className="text-xs text-slate-400 text-center">
                NeuroFlow AI — Em conformidade com a LGPD (Lei nº 13.709/2018)
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around pb-safe z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const isDashboard = item.path === '/dashboard'

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center py-2.5 px-1.5 w-full transition-colors',
                isDashboard
                  ? isActive
                    ? 'text-[#7B5B3A] font-bold'
                    : 'text-[#7B5B3A]/80 font-semibold'
                  : isActive
                    ? 'text-primary font-medium'
                    : 'text-slate-500',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 mb-1',
                  isDashboard
                    ? isActive
                      ? 'text-[#C4A35A] stroke-[2.5]'
                      : 'text-[#7B5B3A]'
                    : isActive
                      ? 'text-primary'
                      : 'text-slate-400',
                )}
              />
              <span className="text-[10px] truncate max-w-[64px] text-center">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
