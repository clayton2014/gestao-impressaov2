"use client";
import React, { useState } from "react";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { MaterialsDAO } from "@/lib/dao";
import { seedSupabase, migrateFromLocalStorage, getCounts } from "@/lib/seed";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { toast } from "sonner";

interface Material {
  id: string;
  name: string;
  unit: 'm' | 'm2';
  cost_per_unit: number;
  created_at: string;
}

interface MaterialFormData {
  name: string;
  unit: 'm' | 'm2';
  cost_per_unit: string;
}

export default function MaterialsPage() {
  const { data, loading, errorMsg, reload } = useSafeLoader(()=>MaterialsDAO.list(), []);
  const rows = Array.isArray(data) ? data : [];
  
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    name: "",
    unit: "m",
    cost_per_unit: ""
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
    setEditingMaterial(null);
    setFormData({ name: "", unit: "m", cost_per_unit: "" });
    setShowModal(true);
  }

  function openEditModal(material: Material) {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      cost_per_unit: material.cost_per_unit.toString()
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingMaterial(null);
    setFormData({ name: "", unit: "m", cost_per_unit: "" });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const costValue = parseFloat(formData.cost_per_unit);
    if (isNaN(costValue) || costValue < 0) {
      toast.error("Custo deve ser um número válido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        unit: formData.unit,
        cost_per_unit: costValue
      };

      if (editingMaterial) {
        await MaterialsDAO.update(editingMaterial.id, payload);
        toast.success("Material atualizado com sucesso");
      } else {
        await MaterialsDAO.create(payload);
        toast.success("Material criado com sucesso");
      }

      closeModal();
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar material");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(material: Material) {
    if (!confirm(`Tem certeza que deseja excluir o material "${material.name}"?`)) {
      return;
    }

    try {
      await MaterialsDAO.remove(material.id);
      toast.success("Material excluído com sucesso");
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir material");
    }
  }

  // Listener para recarregar após criar/editar
  React.useEffect(()=>{
    const h=()=>reload(); 
    window.addEventListener("reload:list",h); 
    return ()=>window.removeEventListener("reload:list",h);
  },[reload]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando materiais...</div>;
  
  if (errorMsg) return (
    <div className="p-6">
      <p className="text-red-600 text-sm mb-3">Erro: {errorMsg}</p>
      <button className="btn btn-primary" onClick={reload}>Tentar novamente</button>
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Materiais</h2>
        <p className="text-sm text-muted-foreground mb-4">Gerencie seus materiais</p>
        <EmptyState
          titulo="Nenhum material encontrado"
          subtitulo="Crie o primeiro material, importe do navegador ou popular com exemplos."
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
          <h2 className="text-lg font-semibold">Materiais</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus materiais</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Novo Material
        </button>
      </div>

      {/* Tabela de materiais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Custo por Unidade
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((material: Material) => (
                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {material.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {material.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    R$ {material.cost_per_unit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(material)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(material)}
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
        title={editingMaterial ? "Editar Material" : "Novo Material"}
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
              placeholder="Nome do material"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidade *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'm' | 'm2' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="m">Metro (m)</option>
              <option value="m2">Metro Quadrado (m²)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custo por Unidade *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
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