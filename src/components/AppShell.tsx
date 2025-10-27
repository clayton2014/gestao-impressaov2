"use client";
import React, { Suspense } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Loading from "@/components/Loading";
import { useAuthGate } from "@/hooks/useAuthGate";

export default function AppShell({ children }:{ children: React.ReactNode }) {
  const { checking, logged } = useAuthGate();

  // enquanto verifica auth: mostra loader (não branco)
  if (checking) return <Loading label="Verificando sessão..." />;

  // mesmo se não logado e navegando para /login, o children do /login aparece;
  // se estiver em páginas internas sem login, o guard já redirecionou.

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <Suspense fallback={<Loading />}>
          <main className="flex-1 p-4">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}