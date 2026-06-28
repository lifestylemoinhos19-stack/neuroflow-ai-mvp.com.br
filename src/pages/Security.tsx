import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Shield, Key, Smartphone, Laptop, Download } from 'lucide-react'

export default function Security() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
          Segurança & Privacidade
        </h1>
        <p className="text-slate-500">Gerencie a proteção da sua conta e dados de saúde.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-subtle border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-900">
              <Shield className="h-5 w-5 mr-2 text-emerald-600" /> Autenticação 2F (MFA)
            </CardTitle>
            <CardDescription>Exigir código extra no login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-emerald-900 font-bold">MFA via App</Label>
                <p className="text-sm text-emerald-700/80">Atualmente ativo e obrigatório.</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="pt-4 border-t border-emerald-100">
              <Button
                variant="outline"
                className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              >
                <Key className="h-4 w-4 mr-2" /> Gerenciar Chaves
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-slate-100">
          <CardHeader>
            <CardTitle>Códigos de Recuperação</CardTitle>
            <CardDescription>Use caso perca acesso ao seu app MFA.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Você tem 8 códigos não utilizados. Guarde-os em um local seguro.
            </p>
            <Button variant="secondary" className="w-full">
              <Download className="h-4 w-4 mr-2" /> Baixar Códigos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
          <CardDescription>Dispositivos atualmente conectados à sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center">
              <Laptop className="h-8 w-8 text-slate-400 mr-4" />
              <div>
                <p className="font-medium text-slate-900">MacBook Pro - Safari</p>
                <p className="text-xs text-slate-500">São Paulo, BR • Sessão atual</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
              Ativo
            </Badge>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-slate-400 mr-4" />
              <div>
                <p className="font-medium text-slate-900">iPhone 14 - App Nativo</p>
                <p className="text-xs text-slate-500">São Paulo, BR • Há 2 dias</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Revogar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children, className, variant }: any) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}
    >
      {children}
    </span>
  )
}
