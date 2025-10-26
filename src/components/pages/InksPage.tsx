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
import { Plus, Search, Edit, Trash2, Palette } from 'lucide-react';
import { useTranslation, formatCurrency } from '@/hooks/useTranslation';
import { InksDAO } from '@/lib/dao';
import type { Ink } from '@/lib/types';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

export default function InksPage() {
  const { t, formatDate } = useTranslation();
  const { currency, locale } = useAppStore();
  const [inks, setInks] = useState<Ink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInk, setEditingInk] = useState<Ink | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cost_per_liter: '',
  });

  const loadInks = async () => {
    setLoading(true);
    try {
      const data = await InksDAO.list();
      setInks(data);
    } catch (error) {
      console.error('Error loading inks:', error);
      toast.error('Erro ao carregar tintas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInks();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cost_per_liter: '',
    });
    setEditingInk(null);
  };

  const handleOpenDialog = (ink?: Ink) => {
    if (ink) {
      setEditingInk(ink);
      setFormData({
        name: ink.name || '',
        cost_per_liter: ink.cost_per_liter?.toString() || '',
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

    if (!formData.cost_per_liter || isNaN(Number(formData.cost_per_liter))) {
      toast.error('Custo por litro deve ser um número válido');
      return;
    }

    try {
      const inkData = {
        name: formData.name.trim(),
        cost_per_liter: Number(formData.cost_per_liter),
      };

      if (editingInk) {
        await InksDAO.update(editingInk.id, inkData);
        toast.success('Tinta atualizada com sucesso!');
      } else {
        await InksDAO.create(inkData);
        toast.success('Tinta criada com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadInks();
    } catch (error: any) {
      console.error('Error saving ink:', error);
      toast.error(error.message || 'Erro ao salvar tinta');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await InksDAO.remove(id);
      toast.success('Tinta excluída com sucesso!');
      loadInks();
    } catch (error: any) {
      console.error('Error deleting ink:', error);
      toast.error(error.message || 'Erro ao excluir tinta');
    }
  };

  // Filter inks
  const filteredInks = inks.filter(ink =>
    ink.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tintas</h1>
          <p className="text-muted-foreground">
            Gerencie suas tintas ({inks.length})
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Tinta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInk ? 'Editar Tinta' : 'Nova Tinta'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da tinta"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_liter">Custo por Litro *</Label>
                <Input
                  id="cost_per_liter"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_liter}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_liter: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingInk ? 'Atualizar' : 'Criar'} Tinta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Tintas</CardTitle>
            
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tintas..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredInks.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tinta encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Tente ajustar sua busca.' : 'Comece adicionando sua primeira tinta.'}
              </p>
              {!search && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Tinta
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Custo/Litro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInks.map((ink) => (
                  <TableRow key={ink.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        {ink.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(ink.cost_per_liter || 0, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(ink)}
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
                                Tem certeza que deseja excluir a tinta "{ink.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(ink.id)}>
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