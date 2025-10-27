"use client";
import React, { useState } from "react";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { InksDAO } from "@/lib/dao";
import { seedSupabase, migrateFromLocalStorage, getCounts } from "@/lib/seed";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { toast } from "sonner";

interface Ink {
  id: string;
  name: string;
  cost_per_liter: number;
  created_at: string;
}

interface InkFormData {
  name: string;
  cost_per_liter: string;
}

export default function InksPage() {
  const { data, loading, errorMsg, reload } = useSafeLoader(()=>InksDAO.list(), []);
  const rows = Array.isArray(data) ? data : [];
  
  const [showModal, setShowModal] = useState(false);
  const [editingInk, setEditingInk] = useState<Ink | null>(null);
  const [formData, setFormData] = useState<InkFormData>({
    name: "",
    cost_per_liter: ""
  });
  const [saving, setSaving] = useState(false);

  async function doSeed(){
    await seedSupabase();
    toast.success("Exemplos criados."); 
    reload();
  }
  
  async function doMigrate(){
    const r = await migrateFromLocalStorage();
    toast.success(r.moved ? "Dados locais importados." : "Nada para importar.");
    reload();
  }
  
  async function doDiag(){
    const c = await getCounts();
    toast.info(`Clientes: ${c.clients} · Materiais: ${c.materials} · Tintas: ${c.inks} · Serviços: ${c.service_orders}`);
  }

  function openCreateModal() {
    setEditingInk(null);
    setFormData({ name: "", cost_per_liter: "" });
    setShowModal(true);
  }

  function openEditModal(ink: Ink) {
    setEditingInk(ink);
    setFormData({
      name: ink.name,
      cost_per_liter: ink.cost_per_liter.toString()
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingInk(null);
    setFormData({ name: "", cost_per_liter: "" });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const costValue = parseFloat(formData.cost_per_liter);
    if (isNaN(costValue) || costValue < 0) {
      toast.error("Custo deve ser um número válido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        cost_per_liter: costValue
      };

      if (editingInk) {
        await InksDAO.update(editingInk.id, payload);
        toast.success("Tinta atualizada com sucesso");
      } else {
        await InksDAO.create(payload);
        toast.success("Tinta criada com sucesso");
      }

      closeModal();
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar tinta");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ink: Ink) {
    if (!confirm(`Tem certeza que deseja excluir a tinta "${ink.name}"?`)) {
      return;
    }

    try {
      await InksDAO.remove(ink.id);
      toast.success("Tinta excluída com sucesso");
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir tinta");
    }
  }

  // Listener para recarregar após criar/editar
  React.useEffect(()=>{
    const h=()=>reload(); 
    window.addEventListener("reload:list",h); 
    return ()=>window.removeEventListener("reload:list",h);
  },[reload]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando tintas...</div>;
  
  if (errorMsg) return (
    <div className="p-6">
      <p className="text-red-600 text-sm mb-3">Erro: {errorMsg}</p>
      <button className="btn btn-primary" onClick={reload}>Tentar novamente</button>
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Tintas</h2>
        <p className="text-sm text-muted-foreground mb-4">Gerencie suas tintas</p>
        <EmptyState
          titulo="Nenhuma tinta encontrada"
          subtitulo="Crie a primeira tinta, importe do navegador ou popular com exemplos."
          onCreate={openCreateModal}
          onSeed={doSeed}
          onMigrate={doMigrate}
          onDiagnose={doDiag}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Tintas</h2>
          <p className="text-sm text-muted-foreground">Gerencie suas tintas</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Nova Tinta
        </button>
      </div>

      {/* Tabela de tintas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Custo por Litro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((ink: Ink) => (
                <tr key={ink.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {ink.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    R$ {ink.cost_per_liter.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(ink)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ink)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criar/editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingInk ? "Editar Tinta" : "Nova Tinta"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Nome da tinta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custo por Litro *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_per_liter}
              onChange={(e) => setFormData({ ...formData, cost_per_liter: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={closeModal}
              disabled={saving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}