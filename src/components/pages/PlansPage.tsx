"use client";
import React from "react";

export default function PlansPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Planos</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie sua assinatura e planos</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Plano Atual: Gratuito
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você está usando o plano gratuito. Aproveite todas as funcionalidades básicas para gerenciar seus serviços.
          </p>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white mb-6">
            <h4 className="font-semibold mb-2">Funcionalidades Incluídas</h4>
            <ul className="text-sm space-y-1 text-left">
              <li>✓ Cadastro ilimitado de clientes</li>
              <li>✓ Gerenciamento de materiais e tintas</li>
              <li>✓ Criação de serviços e orçamentos</li>
              <li>✓ Cálculo automático de custos</li>
              <li>✓ Armazenamento seguro na nuvem</li>
            </ul>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Mais funcionalidades premium em breve:</p>
            <ul className="mt-2 space-y-1">
              <li>• Relatórios avançados</li>
              <li>• Integração com sistemas de pagamento</li>
              <li>• Backup automático</li>
              <li>• Suporte prioritário</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}