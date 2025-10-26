"use client";
import React, { useState } from "react";
import { actions } from "@/lib/store";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ ident: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.ident.trim()) {
      setError("E-mail ou telefone é obrigatório");
      return;
    }

    if (!form.senha) {
      setError("Senha é obrigatória");
      return;
    }

    setLoading(true);
    try {
      await actions.login(form);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Entrar</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <input
            required
            placeholder="E-mail ou Telefone"
            className="input"
            value={form.ident}
            onChange={e => setForm({ ...form, ident: e.target.value })}
          />
        </div>
        <div>
          <input
            required
            type="password"
            placeholder="Senha"
            className="input"
            value={form.senha}
            onChange={e => setForm({ ...form, senha: e.target.value })}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}