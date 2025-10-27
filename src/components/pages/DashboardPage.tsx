"use client";
import React from "react";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { ServicesDAO, ClientsDAO } from "@/lib/dao";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: services, loading: servicesLoading, errorMsg: servicesError } = useSafeLoader(() => ServicesDAO.list(), []);
  const { data: clients, loading: clientsLoading, errorMsg: clientsError } = useSafeLoader(() => ClientsDAO.list(), []);
  
  React.useEffect(() => { 
    if (servicesError) toast.error(`Erro ao carregar serviços: ${servicesError}`); 
    if (clientsError) toast.error(`Erro ao carregar clientes: ${clientsError}`); 
  }, [servicesError, clientsError]);

  const loading = servicesLoading || clientsLoading;
  const hasError = servicesError || clientsError;

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando dashboard...</div>;
  
  if (hasError) return (
    <div className="p-6">
      <p className="text-red-600 text-sm mb-3">Erro ao carregar dados do dashboard</p>
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" 
        onClick={() => window.location.reload()}
      >
        Tentar novamente
      </button>
    </div>
  );

  const servicesList = Array.isArray(services) ? services : [];
  const clientsList = Array.isArray(clients) ? clients : [];
  
  // Estatísticas básicas
  const totalServices = servicesList.length;
  const totalClients = clientsList.length;
  const completedServices = servicesList.filter(s => s.status === 'completed' || s.status === 'concluido').length;
  const pendingServices = servicesList.filter(s => s.status === 'pending' || s.status === 'pendente').length;
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
              <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Serviços Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{completedServices}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Serviços Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingServices}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Serviços recentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Serviços Recentes</h2>
        </div>
        <div className="p-6">
          {servicesList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum serviço encontrado</p>
          ) : (
            <div className="space-y-4">
              {servicesList.slice(0, 5).map((service: any) => (
                <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{service.name || service.nome || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{service.client_name || service.nome_cliente || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.status === 'completed' || service.status === 'concluido' 
                        ? 'bg-green-100 text-green-800'
                        : service.status === 'in_progress' || service.status === 'em_andamento'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.status || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}