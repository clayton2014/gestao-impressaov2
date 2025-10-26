"use client";
import React, { useState } from "react";
import { actions } from "@/lib/store";
import { isValidEmail, isValidPhone, isValidPassword } from "@/lib/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (!form.nome.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("E-mail inválido");
      return;
    }

    if (!isValidPhone(form.telefone)) {
      setError("Telefone deve ter entre 10 e 12 dígitos");
      return;
    }

    if (!isValidPassword(form.senha)) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await actions.registerUser(form);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Criar Conta</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <input
            required
            placeholder="Nome completo"
            className="input"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div>
          <input
            required
            type="email"
            placeholder="E-mail"
            className="input"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <input
            required
            placeholder="Telefone (apenas números)"
            className="input"
            value={form.telefone}
            onChange={e => setForm({ ...form, telefone: e.target.value })}
          />
        </div>
        <div>
          <input
            required
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
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
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}