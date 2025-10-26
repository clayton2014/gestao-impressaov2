'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeSelect } from '@/components/ui/safe-select';
import { Settings, Save, User, Globe, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsDAO } from '@/lib/dao';
import { useAppStore } from '@/lib/store';

interface SettingsData {
  locale: string;
  currency: string;
  taxes_pct: number;
  default_markup_pct: number;
  default_unit: string;
  theme: string;
  company_name: string;
  company_logo_url: string;
}

export default function SettingsPage() {
  const { locale, currency, theme } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    locale: locale || 'pt-BR',
    currency: currency || 'BRL',
    taxes_pct: 0,
    default_markup_pct: 40,
    default_unit: 'm2',
    theme: theme || 'system',
    company_name: '',
    company_logo_url: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await SettingsDAO.get();
      if (data) {
        setSettings({
          locale: data.locale || 'pt-BR',
          currency: data.currency || 'BRL',
          taxes_pct: data.taxes_pct || 0,
          default_markup_pct: data.default_markup_pct || 40,
          default_unit: data.default_unit || 'm2',
          theme: data.theme || 'system',
          company_name: data.company_name || '',
          company_logo_url: data.company_logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await SettingsDAO.upsert(settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize suas preferências do sistema
          </p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => updateSetting('company_name', e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_logo_url">URL do Logo</Label>
              <Input
                id="company_logo_url"
                value={settings.company_logo_url}
                onChange={(e) => updateSetting('company_logo_url', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locale">Idioma</Label>
              <SafeSelect
                value={settings.locale}
                onChange={(value) => updateSetting('locale', value)}
                options={[
                  { value: 'pt-BR', label: 'Português (Brasil)' },
                  { value: 'en', label: 'English' }
                ]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <SafeSelect
                value={settings.currency}
                onChange={(value) => updateSetting('currency', value)}
                options={[
                  { value: 'BRL', label: 'Real (R$)' },
                  { value: 'USD', label: 'Dólar ($)' },
                  { value: 'EUR', label: 'Euro (€)' }
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <SafeSelect
                value={settings.theme}
                onChange={(value) => updateSetting('theme', value)}
                options={[
                  { value: 'system', label: 'Sistema' },
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Escuro' }
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxes_pct">Impostos (%)</Label>
              <Input
                id="taxes_pct"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.taxes_pct}
                onChange={(e) => updateSetting('taxes_pct', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_markup_pct">Margem de Lucro Padrão (%)</Label>
              <Input
                id="default_markup_pct"
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={settings.default_markup_pct}
                onChange={(e) => updateSetting('default_markup_pct', Number(e.target.value))}
                placeholder="40"
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Padrões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_unit">Unidade Padrão</Label>
              <SafeSelect
                value={settings.default_unit}
                onChange={(value) => updateSetting('default_unit', value)}
                options={[
                  { value: 'm', label: 'm (metro linear)' },
                  { value: 'm2', label: 'm² (metro quadrado)' }
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button (Mobile) */}
      <div className="md:hidden">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}