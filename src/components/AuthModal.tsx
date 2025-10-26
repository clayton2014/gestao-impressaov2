"use client";
import React, { useState } from "react";
import LoginForm from "./auth/LoginForm";
import RegisterForm from "./auth/RegisterForm";

export default function AuthModal() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSuccess = () => {
    // Após login/registro bem-sucedido, o usuário será automaticamente logado
    // e a página principal será renderizada
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-lg shadow-lg p-6">
          {mode === 'login' ? (
            <>
              <LoginForm onSuccess={handleSuccess} />
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <RegisterForm onSuccess={handleSuccess} />
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}