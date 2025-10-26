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
import { MaterialsDAO } from '@/lib/dao';
import type { Material } from '@/lib/types';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

export default function MaterialsPage() {
  const { t, formatDate } = useTranslation();
  const { currency, locale } = useAppStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unit: 'm2' as 'm' | 'm2',
    cost_per_unit: '',
  });

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await MaterialsDAO.list();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'm2',
      cost_per_unit: '',
    });
    setEditingMaterial(null);
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name || '',
        unit: material.unit,
        cost_per_unit: material.cost_per_unit?.toString() || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.cost_per_unit || isNaN(Number(formData.cost_per_unit))) {
      toast.error('Custo por unidade deve ser um número válido');
      return;
    }

    try {
      const materialData = {
        name: formData.name.trim(),
        unit: formData.unit,
        cost_per_unit: Number(formData.cost_per_unit),
      };

      if (editingMaterial) {
        await MaterialsDAO.update(editingMaterial.id, materialData);
        toast.success('Material atualizado com sucesso!');
      } else {
        await MaterialsDAO.create(materialData);
        toast.success('Material criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadMaterials();
    } catch (error: any) {
      console.error('Error saving material:', error);
      toast.error(error.message || 'Erro ao salvar material');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await MaterialsDAO.remove(id);
      toast.success('Material excluído com sucesso!');
      loadMaterials();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast.error(error.message || 'Erro ao excluir material');
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name?.toLowerCase().includes(search.toLowerCase());
    const matchesUnit = !unitFilter || material.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">
            Gerencie seus materiais ({materials.length})
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
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
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do material"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade *</Label>
                  <SafeSelect
                    value={formData.unit}
                    onChange={(value) => setFormData(prev => ({ ...prev, unit: value as 'm' | 'm2' }))}
                    options={[
                      { value: 'm', label: 'm (metro linear)' },
                      { value: 'm2', label: 'm² (metro quadrado)' }
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_unit">Custo por Unidade *</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                  placeholder="0.00"
                  required
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
              {!search && !unitFilter && (
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {material.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Ruler className="h-3 w-3" />
                        {material.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(material.cost_per_unit || 0, currency, locale)}
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
                                Tem certeza que deseja excluir o material "{material.name}"? Esta ação não pode ser desfeita.
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