"use client";
import React from "react";

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
        <p className="text-gray-600 dark:text-gray-400">Análises e relatórios do seu negócio</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Relatórios em Desenvolvimento
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Esta funcionalidade estará disponível em breve. Aqui você poderá visualizar relatórios detalhados sobre seus serviços, clientes e faturamento.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Funcionalidades planejadas:
            <ul className="mt-2 space-y-1 text-left">
              <li>• Relatório de faturamento</li>
              <li>• Análise de custos e lucros</li>
              <li>• Relatório de clientes</li>
              <li>• Estatísticas de materiais</li>
              <li>• Gráficos de desempenho</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}