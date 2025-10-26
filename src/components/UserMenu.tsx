"use client";
import React, { useState } from "react";
import useAppStore, { actions } from "@/lib/store";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAppStore(s => s.users.find(u => u.id === s.auth.userId) ?? null);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
          {user.nome.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium">{user.nome}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar o menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-lg shadow-lg z-20">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">{user.nome}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  actions.setCurrentPage('/settings');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
              >
                Minha Conta
              </button>
              <button
                onClick={() => {
                  actions.logout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}