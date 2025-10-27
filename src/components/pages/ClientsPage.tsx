"use client";
import React, { useState } from "react";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { ClientsDAO } from "@/lib/dao";
import { seedSupabase, migrateFromLocalStorage, getCounts } from "@/lib/seed";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
}

export default function ClientsPage() {
  const { data, loading, errorMsg, reload } = useSafeLoader(()=>ClientsDAO.list(), []);
  const rows = Array.isArray(data) ? data : [];
  
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: ""
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
    setEditingClient(null);
    setFormData({ name: "", email: "", phone: "" });
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || ""
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingClient(null);
    setFormData({ name: "", email: "", phone: "" });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null
      };

      if (editingClient) {
        await ClientsDAO.update(editingClient.id, payload);
        toast.success("Cliente atualizado com sucesso");
      } else {
        await ClientsDAO.create(payload);
        toast.success("Cliente criado com sucesso");
      }

      closeModal();
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return;
    }

    try {
      await ClientsDAO.remove(client.id);
      toast.success("Cliente excluído com sucesso");
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
    }
  }

  // Listener para recarregar após criar/editar
  React.useEffect(()=>{
    const h=()=>reload(); 
    window.addEventListener("reload:list",h); 
    return ()=>window.removeEventListener("reload:list",h);
  },[reload]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando clientes...</div>;
  
  if (errorMsg) return (
    <div className="p-6">
      <p className="text-red-600 text-sm mb-3">Erro: {errorMsg}</p>
      <button className="btn btn-primary" onClick={reload}>Tentar novamente</button>
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Clientes</h2>
        <p className="text-sm text-muted-foreground mb-4">Gerencie seus clientes</p>
        <EmptyState
          titulo="Nenhum cliente encontrado"
          subtitulo="Crie o primeiro cliente, importe do navegador ou popular com exemplos."
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
          <h2 className="text-lg font-semibold">Clientes</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus clientes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Novo Cliente
        </button>
      </div>

      {/* Tabela de clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((client: Client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {client.email || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {client.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(client)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
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
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
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
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="(11) 99999-9999"
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