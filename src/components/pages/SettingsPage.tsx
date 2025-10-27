"use client";
import React, { useState } from "react";
import { SettingsDAO } from "@/lib/dao";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { toast } from "sonner";

interface Settings {
  default_labor_rate?: number;
  default_markup?: number;
  currency?: string;
  theme?: string;
}

export default function SettingsPage() {
  const { data, loading, errorMsg, reload } = useSafeLoader(()=>SettingsDAO.get(), {});
  const settings = data || {};
  
  const [formData, setFormData] = useState<Settings>({
    default_labor_rate: settings.default_labor_rate || 60,
    default_markup: settings.default_markup || 40,
    currency: settings.currency || 'BRL',
    theme: settings.theme || 'system'
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (data) {
      setFormData({
        default_labor_rate: data.default_labor_rate || 60,
        default_markup: data.default_markup || 40,
        currency: data.currency || 'BRL',
        theme: data.theme || 'system'
      });
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await SettingsDAO.upsert(formData);
      toast.success("Configurações salvas com sucesso");
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando configurações...</div>;
  
  if (errorMsg) return (
    <div className="p-6">
      <p className="text-red-600 text-sm mb-3">Erro: {errorMsg}</p>
      <button className="btn btn-primary" onClick={reload}>Tentar novamente</button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400">Personalize as configurações do sistema</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Configurações Gerais</h3>
          
          <div className="space-y-6">
            {/* Valor padrão da hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor Padrão da Hora de Trabalho
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_labor_rate}
                onChange={(e) => setFormData({ ...formData, default_labor_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="60.00"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Valor que será usado por padrão ao criar novos serviços
              </p>
            </div>

            {/* Markup padrão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Markup Padrão (%)
              </label>
              <input
                type="number"
                min="0"
                value={formData.default_markup}
                onChange={(e) => setFormData({ ...formData, default_markup: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="40"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Percentual de markup que será aplicado por padrão nos serviços
              </p>
            </div>

            {/* Moeda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moeda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="BRL">Real Brasileiro (R$)</option>
                <option value="USD">Dólar Americano ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            {/* Tema */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="system">Seguir sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>

            {/* Botão salvar */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}