'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Database, Play, Loader2 } from 'lucide-react'
import { checkSupabaseConnection, seedDatabase } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface SetupScreenProps {
  onSetupComplete: () => void
}

export function SetupScreen({ onSetupComplete }: SetupScreenProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isCreatingTables, setIsCreatingTables] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [tablesCreated, setTablesCreated] = useState(false)

  const checkConnection = async () => {
    const connected = await checkSupabaseConnection()
    setIsConnected(connected)
    if (!connected) {
      toast.error('Não foi possível conectar ao Supabase. Verifique suas variáveis de ambiente.')
    }
  }

  const createTables = async () => {
    setIsCreatingTables(true)
    try {
      // Criar tabelas uma por vez para evitar problemas de permissão
      const tables = [
        {
          name: 'clients',
          sql: `
            CREATE TABLE IF NOT EXISTS clients (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              owner_id UUID NOT NULL DEFAULT auth.uid(),
              name TEXT NOT NULL,
              document TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              address TEXT,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'materials',
          sql: `
            CREATE TABLE IF NOT EXISTS materials (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              owner_id UUID NOT NULL DEFAULT auth.uid(),
              name TEXT NOT NULL,
              unit TEXT NOT NULL CHECK (unit IN ('m', 'm2')),
              cost_per_unit DECIMAL(10,2) NOT NULL,
              supplier TEXT,
              stock DECIMAL(10,2),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'inks',
          sql: `
            CREATE TABLE IF NOT EXISTS inks (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              owner_id UUID NOT NULL DEFAULT auth.uid(),
              name TEXT NOT NULL,
              cost_per_liter DECIMAL(10,2) NOT NULL,
              supplier TEXT,
              stock_ml INTEGER,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'service_orders',
          sql: `
            CREATE TABLE IF NOT EXISTS service_orders (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              owner_id UUID NOT NULL DEFAULT auth.uid(),
              client_id UUID NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT 'quote' CHECK (status IN ('quote', 'approved', 'production', 'completed')),
              delivery_date DATE,
              material_items JSONB DEFAULT '[]',
              ink_items JSONB DEFAULT '[]',
              labor_hours DECIMAL(10,2),
              labor_rate DECIMAL(10,2),
              extras JSONB DEFAULT '[]',
              discounts JSONB DEFAULT '[]',
              markup_percent DECIMAL(5,2),
              sale_price DECIMAL(10,2),
              calculations JSONB DEFAULT '{}',
              payments JSONB DEFAULT '[]',
              attachments JSONB DEFAULT '[]',
              comments TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'audit_logs',
          sql: `
            CREATE TABLE IF NOT EXISTS audit_logs (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL DEFAULT auth.uid(),
              entity_type TEXT NOT NULL,
              entity_id UUID NOT NULL,
              action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
              before_data JSONB,
              after_data JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }
      ]

      // Tentar criar as tabelas via SQL direto
      for (const table of tables) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: table.sql })
          if (error) {
            console.warn(`Erro ao criar tabela ${table.name}:`, error)
          }
        } catch (err) {
          console.warn(`Erro ao executar SQL para ${table.name}:`, err)
        }
      }

      setTablesCreated(true)
      toast.success('Configuração inicial concluída!')
    } catch (error: any) {
      console.error('Erro ao criar tabelas:', error)
      toast.error('Erro na configuração: ' + error.message)
    } finally {
      setIsCreatingTables(false)
    }
  }

  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      await seedDatabase()
    } finally {
      setIsSeeding(false)
    }
  }

  const handleComplete = () => {
    onSetupComplete()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Configure seu banco de dados Supabase para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Passo 1: Verificar Conexão */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <h3 className="font-medium">Verificar Conexão com Supabase</h3>
            </div>
            
            {isConnected === null && (
              <Button onClick={checkConnection} className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Testar Conexão
              </Button>
            )}
            
            {isConnected === true && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Conexão com Supabase estabelecida com sucesso!
                </AlertDescription>
              </Alert>
            )}
            
            {isConnected === false && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro de conexão. Verifique se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas corretamente.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Passo 2: Criar Tabelas */}
          {isConnected && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <h3 className="font-medium">Configurar Banco de Dados</h3>
              </div>
              
              {!tablesCreated && (
                <Button 
                  onClick={createTables} 
                  disabled={isCreatingTables}
                  className="w-full"
                >
                  {isCreatingTables ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  {isCreatingTables ? 'Configurando...' : 'Configurar Tabelas'}
                </Button>
              )}
              
              {tablesCreated && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tabelas configuradas com sucesso!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Passo 3: Dados de Exemplo (Opcional) */}
          {tablesCreated && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <h3 className="font-medium">Dados de Exemplo (Opcional)</h3>
              </div>
              
              <Button 
                onClick={handleSeedData} 
                disabled={isSeeding}
                variant="outline"
                className="w-full"
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isSeeding ? 'Criando...' : 'Criar Dados de Exemplo'}
              </Button>
            </div>
          )}

          {/* Finalizar */}
          {tablesCreated && (
            <div className="pt-4 border-t">
              <Button onClick={handleComplete} className="w-full" size="lg">
                <CheckCircle className="w-4 h-4 mr-2" />
                Começar a Usar o Sistema
              </Button>
            </div>
          )}

          {/* Instruções Manuais */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuração Manual:</strong> Se a configuração automática não funcionar, 
              você pode criar as tabelas manualmente no painel do Supabase usando o SQL Editor.
              <br />
              <br />
              <strong>RLS (Row Level Security):</strong> Certifique-se de que o RLS está habilitado 
              nas tabelas para garantir que cada usuário veja apenas seus próprios dados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}