import { Link } from 'react-router-dom'
import { Brain, ArrowLeft, LogIn, Shield, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ReactNode, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function PublicPageShell({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[#00FFFF]/10 bg-[#0A192F]/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-[#00FFFF]" />
            <span className="font-display font-bold text-lg text-white">NeuroFlow AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white/85 hover:text-[#00FFFF] hover:bg-white/5"
            >
              <Link to="/security">
                <Shield className="h-4 w-4 mr-1.5" />
                Segurança
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white/85 hover:text-[#00FFFF] hover:bg-white/5"
            >
              <Link to="/about">
                <Info className="h-4 w-4 mr-1.5" />
                Institucional
              </Link>
            </Button>
            {isAuthed ? (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/5"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Painel
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 font-semibold"
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Acessar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <footer className="border-t border-[#00FFFF]/10 px-6 py-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-white/70">NeuroFlow AI © 2026 — Conformidade LGPD</span>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/security" className="text-white/75 hover:text-[#00FFFF] transition-colors">
              Segurança
            </Link>
            <Link to="/about" className="text-white/75 hover:text-[#00FFFF] transition-colors">
              Institucional
            </Link>
            <Link to="/terms" className="text-white/75 hover:text-[#00FFFF] transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
