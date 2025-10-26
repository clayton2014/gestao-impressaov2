"use client";
import React, { useState } from "react";
import { signIn } from "@/lib/auth-client";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.identifier.trim()) {
      setError("E-mail ou telefone é obrigatório");
      return;
    }

    if (!form.password) {
      setError("Senha é obrigatória");
      return;
    }

    setLoading(true);
    try {
      await signIn({
        identifier: form.identifier.trim(),
        password: form.password
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail ou Telefone
          </label>
          <input
            id="identifier"
            required
            placeholder="Digite seu e-mail ou telefone"
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            value={form.identifier}
            onChange={e => setForm({ ...form, identifier: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            required
            type="password"
            placeholder="Digite sua senha"
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </div>
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          aria-label={loading ? "Entrando na conta" : "Entrar na conta"}
          className="mt-4 h-10 w-full rounded-md bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <div className="text-center mt-4">
          <a href="#" className="text-xs text-violet-600 hover:text-violet-700 transition-colors">
            Esqueceu sua senha?
          </a>
        </div>
      </form>
    </div>
  );
}