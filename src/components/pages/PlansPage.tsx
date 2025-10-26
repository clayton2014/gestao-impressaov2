'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Check, X, Crown, Zap, Shield, Star, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { setUserPlan } from '@/lib/database'

export default function PlansPage() {
  const { user, setUser } = useAppStore()
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const currentPlan = user?.plano || 'free'

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      period: 'Sempre grátis',
      description: 'Perfeito para começar',
      icon: Shield,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
      features: [
        { name: 'Até 50 clientes', included: true },
        { name: 'Até 10 materiais', included: true },
        { name: 'Até 10 tintas', included: true },
        { name: 'Até 50 serviços/ordens', included: true },
        { name: '1 usuário', included: true },
        { name: 'Dashboard básico', included: true },
        { name: 'Relatórios simples', included: true },
        { name: 'Backup local (JSON)', included: true },
        { name: 'Exportação CSV', included: false },
        { name: 'PDFs personalizados', included: false },
        { name: 'Controle de estoque', included: false },
        { name: 'Anexos ilimitados', included: false },
        { name: 'Relatórios avançados', included: false },
        { name: 'Múltiplos usuários', included: false },
        { name: 'Auditoria completa', included: false },
        { name: 'Tabelas de preço por cliente', included: false },
        { name: 'Suporte prioritário', included: false },
      ],
      limits: {
        clients: 50,
        materials: 10,
        inks: 10,
        services: 50,
        users: 1,
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.90,
      period: 'por mês',
      description: 'Para empresas em crescimento',
      icon: Crown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      popular: true,
      features: [
        { name: 'Clientes ilimitados', included: true },
        { name: 'Materiais ilimitados', included: true },
        { name: 'Tintas ilimitadas', included: true },
        { name: 'Serviços ilimitados', included: true },
        { name: 'Até 5 usuários', included: true },
        { name: 'Dashboard avançado', included: true },
        { name: 'Relatórios completos', included: true },
        { name: 'Backup em nuvem', included: true },
        { name: 'Exportação CSV', included: true },
        { name: 'PDFs personalizados', included: true },
        { name: 'Controle de estoque', included: true },
        { name: 'Anexos ilimitados', included: true },
        { name: 'Relatórios avançados', included: true },
        { name: 'Múltiplos usuários', included: true },
        { name: 'Auditoria completa', included: true },
        { name: 'Tabelas de preço por cliente', included: true },
        { name: 'Suporte prioritário', included: true },
      ],
      limits: {
        clients: Infinity,
        materials: Infinity,
        inks: Infinity,
        services: Infinity,
        users: 5,
      }
    }
  ]

  const handleUpgrade = async () => {
    setUpgrading(true)
    
    // Simulate payment process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update user plan
    if (user) {
      const updatedUser = { ...user, plano: 'pro' as const }
      setUser(updatedUser)
      setUserPlan('pro')
      toast.success('Plano atualizado com sucesso! Bem-vindo ao Pro!')
    }
    
    setUpgrading(false)
    setIsUpgradeDialogOpen(false)
  }

  const handleDowngrade = async () => {
    if (user) {
      const updatedUser = { ...user, plano: 'free' as const }
      setUser(updatedUser)
      setUserPlan('free')
      toast.success('Plano alterado para gratuito.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Planos e Preços</h1>
        <p className="text-muted-foreground">
          Escolha o plano ideal para o seu negócio
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            {currentPlan === 'pro' ? (
              <Crown className="h-8 w-8 text-purple-500" />
            ) : (
              <Shield className="h-8 w-8 text-gray-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                Plano Atual: {currentPlan === 'pro' ? 'Pro' : 'Gratuito'}
              </h3>
              <p className="text-muted-foreground">
                {currentPlan === 'pro' 
                  ? 'Você tem acesso a todos os recursos premium'
                  : 'Faça upgrade para desbloquear recursos avançados'
                }
              </p>
            </div>
          </div>
          
          {currentPlan === 'pro' && (
            <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
              <Sparkles className="mr-1 h-3 w-3" />
              Ativo
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = currentPlan === plan.id
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' : ''} ${plan.borderColor}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                    <Star className="mr-1 h-3 w-3" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${plan.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${plan.color}`} />
                </div>
                
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                  </div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Limites:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Clientes: {plan.limits.clients === Infinity ? '∞' : plan.limits.clients}</div>
                    <div>Usuários: {plan.limits.users}</div>
                    <div>Materiais: {plan.limits.materials === Infinity ? '∞' : plan.limits.materials}</div>
                    <div>Serviços: {plan.limits.services === Infinity ? '∞' : plan.limits.services}</div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recursos:</h4>
                  <div className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Plano Atual
                    </Button>
                  ) : plan.id === 'pro' ? (
                    <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                          <Crown className="mr-2 h-4 w-4" />
                          Assinar Pro
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upgrade para o Plano Pro</DialogTitle>
                          <DialogDescription>
                            Desbloqueie todos os recursos premium e leve seu negócio para o próximo nível.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">O que você ganha:</h4>
                            <ul className="space-y-1 text-sm">
                              <li>• Clientes, materiais e serviços ilimitados</li>
                              <li>• Exportação CSV e PDFs personalizados</li>
                              <li>• Controle de estoque com alertas</li>
                              <li>• Relatórios avançados</li>
                              <li>• Até 5 usuários</li>
                              <li>• Suporte prioritário</li>
                            </ul>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold">R$ 29,90/mês</div>
                            <div className="text-sm text-muted-foreground">Cancele a qualquer momento</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setIsUpgradeDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500"
                              onClick={handleUpgrade}
                              disabled={upgrading}
                            >
                              {upgrading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-4 w-4" />
                                  Confirmar Upgrade
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleDowngrade}
                    >
                      Alterar para Gratuito
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Posso cancelar a qualquer momento?</h4>
            <p className="text-sm text-muted-foreground">
              Sim, você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">O que acontece se eu exceder os limites do plano gratuito?</h4>
            <p className="text-sm text-muted-foreground">
              Você será notificado quando se aproximar dos limites e poderá fazer upgrade para continuar adicionando dados.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Os dados são seguros?</h4>
            <p className="text-sm text-muted-foreground">
              Sim, todos os dados são armazenados localmente no seu navegador com opção de backup. Você tem controle total.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Posso adicionar mais usuários?</h4>
            <p className="text-sm text-muted-foreground">
              O plano Pro permite até 5 usuários locais. Para mais usuários, entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}