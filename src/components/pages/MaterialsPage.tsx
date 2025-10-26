'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { SafeSelect } from '@/components/ui/safe-select';
import { Plus, Search, Edit, Trash2, Package, Ruler, AlertTriangle } from 'lucide-react';
import { useTranslation, formatCurrency } from '@/hooks/useTranslation';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, checkPlanLimits } from '@/lib/database';
import type { Material } from '@/lib/types';
import { toast } from 'sonner';
import { toArr, str, num } from '@/lib/safe';
import { ensureId, uuid } from '@/lib/ids';
import { useAppStore } from '@/lib/store';

export default function MaterialsPage() {
  const { t, formatDate } = useTranslation();
  const { currency, locale } = useAppStore();
  const [rawMaterials, setRawMaterials] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [planLimits, setPlanLimits] = useState({ canCreate: true, limit: 0, current: 0 });

  // Normalização defensiva dos dados com IDs garantidos
  const materials = toArr<Material>(rawMaterials).map(ensureId);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    unidade: 'm2' as 'm' | 'm2',
    custoPorUnidade: '',
    fornecedor: '',
    estoque: ''
  });

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const result = await getMaterials(page, 10, search);
      setRawMaterials(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Error loading materials:', error);
      setRawMaterials([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanLimits = async () => {
    try {
      const limits = await checkPlanLimits('materials');
      setPlanLimits(limits);
    } catch (error) {
      console.error('Error loading plan limits:', error);
      setPlanLimits({ canCreate: true, limit: 0, current: 0 });
    }
  };

  useEffect(() => {
    loadMaterials();
    loadPlanLimits();
  }, [page, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      unidade: 'm2',
      custoPorUnidade: '',
      fornecedor: '',
      estoque: ''
    });
    setEditingMaterial(null);
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        nome: str(material.nome),
        unidade: material.unidade,
        custoPorUnidade: num(material.custoPorUnidade, 0).toString(),
        fornecedor: str(material.fornecedor),
        estoque: num(material.estoque, 0).toString()
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.custoPorUnidade || isNaN(Number(formData.custoPorUnidade))) {
      toast.error('Custo por unidade deve ser um número válido');
      return;
    }

    try {
      const materialData = {
        id: editingMaterial?.id || uuid(),
        nome: formData.nome.trim(),
        unidade: formData.unidade,
        custoPorUnidade: Number(formData.custoPorUnidade),
        fornecedor: formData.fornecedor.trim(),
        estoque: formData.estoque ? Number(formData.estoque) : 0,
        createdAt: editingMaterial?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (editingMaterial) {
        await updateMaterial(materialData);
        toast.success('Material atualizado com sucesso!');
      } else {
        if (!planLimits.canCreate) {
          toast.error(`Limite de ${planLimits.limit} materiais atingido. Faça upgrade para o plano Pro.`);
          return;
        }
        await createMaterial(materialData);
        toast.success('Material criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadMaterials();
      loadPlanLimits();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Erro ao salvar material');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterial(id);
      toast.success('Material excluído com sucesso!');
      loadMaterials();
      loadPlanLimits();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Erro ao excluir material');
    }
  };

  // Filtros seguros
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = str(material.nome).toLowerCase().includes(search.toLowerCase()) ||
                         str(material.fornecedor).toLowerCase().includes(search.toLowerCase());
    const matchesUnit = !unitFilter || material.unidade === unitFilter;
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">
            Gerencie seus materiais ({materials.length}/{planLimits.limit === 0 ? '∞' : planLimits.limit})
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              disabled={!planLimits.canCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome do material"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unidade">Unidade *</Label>
                  <SafeSelect
                    value={formData.unidade}
                    onChange={(value) => setFormData(prev => ({ ...prev, unidade: value as 'm' | 'm2' }))}
                    options={[
                      { value: 'm', label: 'm (metro linear)' },
                      { value: 'm2', label: 'm² (metro quadrado)' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custoPorUnidade">Custo por Unidade *</Label>
                  <Input
                    id="custoPorUnidade"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoPorUnidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, custoPorUnidade: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estoque">Estoque</Label>
                  <Input
                    id="estoque"
                    type="number"
                    min="0"
                    value={formData.estoque}
                    onChange={(e) => setFormData(prev => ({ ...prev, estoque: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMaterial ? 'Atualizar' : 'Criar'} Material
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan Limit Warning */}
      {!planLimits.canCreate && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-amber-500">Limite de materiais atingido</p>
              <p className="text-sm text-muted-foreground">
                Você atingiu o limite de {planLimits.limit} materiais do plano gratuito.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
              Upgrade Pro
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Materiais</CardTitle>
            
            <div className="flex items-center space-x-2">
              <SafeSelect
                value={unitFilter}
                onChange={setUnitFilter}
                placeholder="Unidade"
                options={[
                  { value: "", label: "Todas" },
                  { value: "m", label: "m" },
                  { value: "m2", label: "m²" }
                ]}
                className="w-32"
              />
              
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar materiais..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum material encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search || unitFilter ? 'Tente ajustar seus filtros.' : 'Comece adicionando seu primeiro material.'}
              </p>
              {!search && !unitFilter && planLimits.canCreate && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Material
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Custo/Unidade</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {str(material.nome)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Ruler className="h-3 w-3" />
                        {material.unidade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(num(material.custoPorUnidade, 0), currency, locale)}
                    </TableCell>
                    <TableCell>
                      <span className={num(material.estoque, 0) <= 10 ? 'text-amber-600' : ''}>
                        {num(material.estoque, 0)} {material.unidade}
                      </span>
                    </TableCell>
                    <TableCell>
                      {str(material.fornecedor) || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o material "{str(material.nome)}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(material.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}