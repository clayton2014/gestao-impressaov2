"use client";
import React, { useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { ServicesDAO, ClientsDAO, MaterialsDAO, InksDAO } from "@/lib/dao";
import { seedSupabase, migrateFromLocalStorage, getCounts } from "@/lib/seed";
import { useSafeLoader } from "@/hooks/useSafeLoader";
import { serviceTotals, materialQty } from "@/lib/pricing";
import { toast } from "sonner";

interface ServiceItem {
  id?: string;
  material_id: string;
  unit: 'm' | 'm2';
  quantity: number;
  meters?: number;
  width?: number;
  height?: number;
  unit_cost_snapshot: number;
}

interface ServiceInk {
  id?: string;
  ink_id: string;
  ml: number;
  cost_per_liter_snapshot: number;
}

interface ServiceFormData {
  name: string;
  status: string;
  client_id: string;
  due_date: string;
  labor_hours: number;
  labor_rate: number;
  markup: number;
  manual_price?: number;
  items: ServiceItem[];
  inks: ServiceInk[];
}

export default function ServicesPage() {
  const { data, loading, errorMsg, reload } = useSafeLoader(()=>ServicesDAO.list(), []);
  const rows = Array.isArray(data) ? data : [];
  
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  // Dados auxiliares
  const [clients, setClients] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [inks, setInks] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    status: "Orçamento",
    client_id: "",
    due_date: "",
    labor_hours: 0,
    labor_rate: 60,
    markup: 40,
    manual_price: undefined,
    items: [],
    inks: []
  });

  // Carregar dados auxiliares
  useEffect(() => {
    loadAuxData();
  }, []);

  async function loadAuxData() {
    try {
      const [clientsData, materialsData, inksData] = await Promise.all([
        ClientsDAO.list(),
        MaterialsDAO.list(),
        InksDAO.list()
      ]);
      setClients(clientsData);
      setMaterials(materialsData);
      setInks(inksData);
    } catch (error) {
      console.error("Erro ao carregar dados auxiliares:", error);
    }
  }

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
    setEditingService(null);
    setFormData({
      name: "",
      status: "Orçamento",
      client_id: "",
      due_date: "",
      labor_hours: 0,
      labor_rate: 60,
      markup: 40,
      manual_price: undefined,
      items: [],
      inks: []
    });
    setShowModal(true);
  }

  function openEditModal(service: any) {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      status: service.status || "Orçamento",
      client_id: service.client_id || "",
      due_date: service.due_date ? service.due_date.split('T')[0] : "",
      labor_hours: service.labor_hours || 0,
      labor_rate: service.labor_rate || 60,
      markup: service.markup || 40,
      manual_price: service.manual_price || undefined,
      items: service.items || [],
      inks: service.inks || []
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingService(null);
  }

  // Gerenciar itens de material
  function addItem() {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: "",
        unit: "m",
        quantity: 1,
        meters: 0,
        width: 0,
        height: 0,
        unit_cost_snapshot: 0
      }]
    }));
  }

  function removeItem(index: number) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }

  function updateItem(index: number, field: string, value: any) {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Se mudou o material, atualizar unit e unit_cost_snapshot
      if (field === 'material_id') {
        const material = materials.find(m => m.id === value);
        if (material) {
          newItems[index].unit = material.unit;
          newItems[index].unit_cost_snapshot = material.cost_per_unit;
        }
      }
      
      return { ...prev, items: newItems };
    });
  }

  // Gerenciar consumos de tinta
  function addInk() {
    setFormData(prev => ({
      ...prev,
      inks: [...prev.inks, {
        ink_id: "",
        ml: 0,
        cost_per_liter_snapshot: 0
      }]
    }));
  }

  function removeInk(index: number) {
    setFormData(prev => ({
      ...prev,
      inks: prev.inks.filter((_, i) => i !== index)
    }));
  }

  function updateInk(index: number, field: string, value: any) {
    setFormData(prev => {
      const newInks = [...prev.inks];
      newInks[index] = { ...newInks[index], [field]: value };
      
      // Se mudou a tinta, atualizar cost_per_liter_snapshot
      if (field === 'ink_id') {
        const ink = inks.find(i => i.id === value);
        if (ink) {
          newInks[index].cost_per_liter_snapshot = ink.cost_per_liter;
        }
      }
      
      return { ...prev, inks: newInks };
    });
  }

  // Calcular totais
  const totals = serviceTotals({
    items: formData.items,
    inks: formData.inks,
    labor_hours: formData.labor_hours,
    labor_rate: formData.labor_rate,
    markup: formData.markup,
    manual_price: formData.manual_price
  });

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        status: formData.status,
        client_id: formData.client_id || null,
        due_date: formData.due_date || null,
        labor_hours: formData.labor_hours,
        labor_rate: formData.labor_rate,
        markup: formData.markup,
        manual_price: formData.manual_price || null
      };

      let serviceId;
      if (editingService) {
        await ServicesDAO.update(editingService.id, payload);
        serviceId = editingService.id;
        toast.success("Serviço atualizado com sucesso");
      } else {
        const newService = await ServicesDAO.create(payload);
        serviceId = newService.id;
        toast.success("Serviço criado com sucesso");
      }

      // TODO: Salvar itens e tintas (requer DAOs específicos)
      // Por enquanto, apenas salvamos o cabeçalho do serviço

      closeModal();
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar serviço");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: any) {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?`)) {
      return;
    }

    try {
      await ServicesDAO.remove(service.id);
      toast.success("Serviço excluído com sucesso");
      reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir serviço");
    }
  }

  // Listener para recarregar após criar/editar
  React.useEffect(()=>{
    const h=()=>reload(); 
    window.addEventListener("reload:list",h); 
    return ()=>window.removeEventListener("reload:list",h);
  },[reload]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando serviços...</div>;
  
  if (errorMsg) return (
    <div className="p-6 text-red-600">
      Erro: {errorMsg} 
      <button className="btn ml-2" onClick={reload}>Tentar novamente</button>
    </div>
  );
  
  if (rows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Serviços</h2>
        <p className="text-sm text-muted-foreground mb-4">Gerencie seus serviços</p>
        <EmptyState
          titulo="Nenhum serviço encontrado"
          subtitulo="Crie o primeiro serviço, importe do navegador ou popular com exemplos."
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
          <h2 className="text-lg font-semibold">Serviços</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus serviços</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Novo Serviço
        </button>
      </div>

      {/* Lista de serviços */}
      <div className="grid gap-4">
        {rows.map((service: any) => (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {service.name}
                </h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.status === 'Concluído' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      service.status === 'Em produção' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      service.status === 'Aprovado' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {service.status}
                    </span>
                    {service.client && (
                      <span>Cliente: {service.client.name}</span>
                    )}
                  </div>
                  {service.labor_hours > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mão de obra: {service.labor_hours}h × R$ {service.labor_rate}/h
                    </p>
                  )}
                  {service.due_date && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vencimento: {new Date(service.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Markup: {service.markup || 40}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(service.created_at).toLocaleDateString()}
                </p>
                <div className="mt-3 space-x-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de criar/editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingService ? "Editar Serviço" : "Novo Serviço"}
        size="xl"
      >
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Nome do serviço"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Orçamento">Orçamento</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Em produção">Em produção</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vencimento
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Mão de obra */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horas de Trabalho
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.labor_hours}
                onChange={(e) => setFormData({ ...formData, labor_hours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor por Hora
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.labor_rate}
                onChange={(e) => setFormData({ ...formData, labor_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Markup (%)
              </label>
              <input
                type="number"
                min="0"
                value={formData.markup}
                onChange={(e) => setFormData({ ...formData, markup: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Materiais */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Materiais</h4>
              <button
                type="button"
                onClick={addItem}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Adicionar Material
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg">
                  <div>
                    <select
                      value={item.material_id}
                      onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Material</option>
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>{material.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qtd"
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {item.unit === 'm' ? (
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.meters || 0}
                        onChange={(e) => updateItem(index, 'meters', parseFloat(e.target.value) || 0)}
                        placeholder="Metros"
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.width || 0}
                          onChange={(e) => updateItem(index, 'width', parseFloat(e.target.value) || 0)}
                          placeholder="Largura"
                          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.height || 0}
                          onChange={(e) => updateItem(index, 'height', parseFloat(e.target.value) || 0)}
                          placeholder="Altura"
                          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    R$ {item.unit_cost_snapshot.toFixed(2)}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tintas */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Tintas</h4>
              <button
                type="button"
                onClick={addInk}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Adicionar Tinta
              </button>
            </div>
            <div className="space-y-3">
              {formData.inks.map((ink, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                  <div>
                    <select
                      value={ink.ink_id}
                      onChange={(e) => updateInk(index, 'ink_id', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Tinta</option>
                      {inks.map(inkOption => (
                        <option key={inkOption.id} value={inkOption.id}>{inkOption.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={ink.ml}
                      onChange={(e) => updateInk(index, 'ml', parseInt(e.target.value) || 0)}
                      placeholder="ML"
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    R$ {ink.cost_per_liter_snapshot.toFixed(2)}/L
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeInk(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Totais</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Custo Total:</span>
                <p className="font-medium">R$ {totals.custo_total.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Preço:</span>
                <p className="font-medium">R$ {totals.preco.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Lucro:</span>
                <p className="font-medium">R$ {totals.lucro.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Margem:</span>
                <p className="font-medium">{(totals.margem * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço Manual (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.manual_price || ""}
                onChange={(e) => setFormData({ ...formData, manual_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Deixe vazio para usar markup"
              />
            </div>
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