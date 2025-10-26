"use client";
import React, { useState } from "react";
import { signUp } from "@/lib/auth-client";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!form.email.includes("@")) {
      setError("E-mail inválido");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
      setError("Telefone deve ter entre 10 e 12 dígitos");
      return;
    }

    if (form.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: phoneDigits,
        password: form.password
      });
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
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
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
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <input
            required
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            className="input"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
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