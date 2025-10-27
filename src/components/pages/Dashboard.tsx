"use client";
import React from "react";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { ServicesDAO, ClientsDAO, MaterialsDAO, InksDAO } from "@/lib/dao";

export default function Dashboard() {
  const { data: services, loading: loadingServices } = useSafeLoader(()=>ServicesDAO.list(), []);
  const { data: clients, loading: loadingClients } = useSafeLoader(()=>ClientsDAO.list(), []);
  const { data: materials, loading: loadingMaterials } = useSafeLoader(()=>MaterialsDAO.list(), []);
  const { data: inks, loading: loadingInks } = useSafeLoader(()=>InksDAO.list(), []);

  const servicesList = Array.isArray(services) ? services : [];
  const clientsList = Array.isArray(clients) ? clients : [];
  const materialsList = Array.isArray(materials) ? materials : [];
  const inksList = Array.isArray(inks) ? inks : [];

  const loading = loadingServices || loadingClients || loadingMaterials || loadingInks;

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando dashboard...</div>;
  }

  // Estatísticas básicas
  const stats = [
    {
      title: "Serviços",
      value: servicesList.length,
      description: "Total de serviços",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Clientes",
      value: clientsList.length,
      description: "Clientes cadastrados",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Materiais",
      value: materialsList.length,
      description: "Materiais disponíveis",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Tintas",
      value: inksList.length,
      description: "Tintas cadastradas",
      color: "from-orange-500 to-red-500"
    }
  ];

  // Serviços por status
  const servicesByStatus = servicesList.reduce((acc: any, service: any) => {
    const status = service.status || 'Orçamento';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral do seu negócio</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} mb-4`}>
              <span className="text-white font-bold text-lg">{stat.value}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stat.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços por status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Serviços por Status</h3>
          {Object.keys(servicesByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(servicesByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{status}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum serviço cadastrado</p>
          )}
        </div>

        {/* Serviços recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Serviços Recentes</h3>
          {servicesList.length > 0 ? (
            <div className="space-y-3">
              {servicesList.slice(0, 5).map((service: any) => (
                <div key={service.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {service.client?.name || 'Sem cliente'} • {service.status}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(service.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum serviço cadastrado</p>
          )}
        </div>
      </div>
    </div>
  );
}