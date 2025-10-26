'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabase'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { User, Mail, Calendar, Crown, Shield, LogOut, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils-app'
import { toast } from 'sonner'

export function ProfilePage() {
  const { user, signOut } = useSupabaseAuth()
  const { user: storeUser, logout } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(storeUser?.name || '')

  const handleSaveName = async () => {
    // In a real app, you would update the user name in the database
    toast.success('Nome atualizado com sucesso!')
    setIsEditing(false)
  }

  const handleLogout = async () => {
    const success = await signOut()
    if (success) {
      logout()
    }
  }

  const handleDeleteAccount = async () => {
    // In a real app, you would delete the user account and all associated data
    toast.success('Conta excluída com sucesso!')
    logout()
  }

  if (!storeUser) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Usuário não encontrado</h3>
          <p className="text-muted-foreground">Faça login para acessar seu perfil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações da conta
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{storeUser.name}</h2>
                <Badge className={storeUser.plan === 'pro' ? 'bg-purple-500/20 text-purple-500 border-purple-500/30' : 'bg-gray-500/20 text-gray-500 border-gray-500/30'}>
                  {storeUser.plan === 'pro' ? (
                    <>
                      <Crown className="mr-1 h-3 w-3" />
                      Pro
                    </>
                  ) : (
                    <>
                      <Shield className="mr-1 h-3 w-3" />
                      Gratuito
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {storeUser.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Membro desde {formatDate(user?.created_at || new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{storeUser.name}</span>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">{storeUser.email}</span>
                <Badge variant="outline">Verificado</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plano Atual</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm capitalize">{storeUser.plan === 'pro' ? 'Pro' : 'Gratuito'}</span>
                {storeUser.plan === 'free' && (
                  <Button size="sm" variant="outline">
                    Fazer Upgrade
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Idioma</Label>
              <span className="text-sm">{storeUser.locale === 'pt-BR' ? 'Português (Brasil)' : 'English'}</span>
            </div>

            <div className="space-y-2">
              <Label>Moeda</Label>
              <span className="text-sm">{storeUser.currency === 'BRL' ? 'Real (R$)' : 'Dólar ($)'}</span>
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <span className="text-sm">{storeUser.company_name || 'Não informado'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Plano</CardTitle>
          <CardDescription>
            Informações sobre seu plano atual e uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storeUser.plan === 'pro' ? (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-purple-500">Plano Pro Ativo</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Você tem acesso a todos os recursos premium do Print Manager.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Clientes:</span> Ilimitados
                  </div>
                  <div>
                    <span className="font-medium">Materiais:</span> Ilimitados
                  </div>
                  <div>
                    <span className="font-medium">Serviços:</span> Ilimitados
                  </div>
                  <div>
                    <span className="font-medium">Usuários:</span> Até 5
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-500">Plano Gratuito</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Você está usando o plano gratuito com recursos limitados.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium">Clientes:</span> Até 50
                  </div>
                  <div>
                    <span className="font-medium">Materiais:</span> Até 10
                  </div>
                  <div>
                    <span className="font-medium">Serviços:</span> Até 50
                  </div>
                  <div>
                    <span className="font-medium">Usuários:</span> 1
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-cyan-500">
                  <Crown className="mr-2 h-4 w-4" />
                  Fazer Upgrade para Pro
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações da Conta</CardTitle>
          <CardDescription>
            Gerencie sua conta e dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Sair da Conta</h4>
              <p className="text-sm text-muted-foreground">
                Desconecte-se do sistema
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
            <div>
              <h4 className="font-medium text-red-500">Excluir Conta</h4>
              <p className="text-sm text-muted-foreground">
                Exclua permanentemente sua conta e todos os dados
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão da conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os seus dados, incluindo clientes, 
                    materiais, tintas e serviços serão permanentemente excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Sim, excluir conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}