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
import { Plus, Search, Edit, Trash2, Palette, Droplets, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getInks, createInk, updateInk, deleteInk, checkPlanLimits } from '@/lib/database';
import type { Ink } from '@/lib/types';
import { toast } from 'sonner';

export default function InksPage() {
  const { t, formatCurrency, formatDate } = useTranslation();
  const [inks, setInks] = useState<Ink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInk, setEditingInk] = useState<Ink | null>(null);
  const [planLimits, setPlanLimits] = useState({ canCreate: true, limit: 0, current: 0 });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    custoPorLitro: '',
    fornecedor: '',
    estoqueMl: ''
  });

  const loadInks = async () => {
    setLoading(true);
    try {
      const result = await getInks(page, 10, search);
      setInks(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading inks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanLimits = async () => {
    const limits = await checkPlanLimits('inks');
    setPlanLimits(limits);
  };

  useEffect(() => {
    loadInks();
    loadPlanLimits();
  }, [page, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      custoPorLitro: '',
      fornecedor: '',
      estoqueMl: ''
    });
    setEditingInk(null);
  };

  const handleOpenDialog = (ink?: Ink) => {
    if (ink) {
      setEditingInk(ink);
      setFormData({
        nome: ink.nome,
        custoPorLitro: ink.custoPorLitro.toString(),
        fornecedor: ink.fornecedor || '',
        estoqueMl: ink.estoqueMl?.toString() || ''
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

    if (!formData.custoPorLitro || parseFloat(formData.custoPorLitro) <= 0) {
      toast.error('Custo por litro deve ser maior que zero');
      return;
    }

    try {
      const inkData = {
        nome: formData.nome.trim(),
        custoPorLitro: parseFloat(formData.custoPorLitro),
        fornecedor: formData.fornecedor.trim() || undefined,
        estoqueMl: formData.estoqueMl ? parseInt(formData.estoqueMl) : undefined
      };

      if (editingInk) {
        await updateInk(editingInk.id, inkData);
      } else {
        await createInk(inkData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadInks();
      loadPlanLimits();
    } catch (error) {
      console.error('Error saving ink:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInk(id);
      loadInks();
      loadPlanLimits();
    } catch (error) {
      console.error('Error deleting ink:', error);
    }
  };

  const getStockStatus = (ink: Ink) => {
    if (!ink.estoqueMl) return null;
    
    if (ink.estoqueMl <= 500) {
      return { status: 'low', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    } else if (ink.estoqueMl <= 1000) {
      return { status: 'medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    }
    return { status: 'good', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  };

  const formatVolume = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('inks.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {planLimits.limit === Infinity 
              ? `${planLimits.current} tintas` 
              : `${planLimits.current}/${planLimits.limit} tintas`
            }
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              disabled={!planLimits.canCreate}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('inks.newInk')}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingInk ? t('inks.editInk') : t('inks.newInk')}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">{t('inks.inkName')} *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da tinta"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="custoPorLitro">{t('inks.costPerLiter')} *</Label>
                <Input
                  id="custoPorLitro"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custoPorLitro}
                  onChange={(e) => setFormData({ ...formData, custoPorLitro: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="fornecedor">{t('common.supplier')}</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
              
              <div>
                <Label htmlFor="estoqueMl">{t('inks.stockMl')}</Label>
                <Input
                  id="estoqueMl"
                  type="number"
                  min="0"
                  value={formData.estoqueMl}
                  onChange={(e) => setFormData({ ...formData, estoqueMl: e.target.value })}
                  placeholder="Quantidade em ml"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">
                  {t('actions.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={t('actions.search') + '...'}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Plan Limit Warning */}
      {!planLimits.canCreate && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Plano Gratuito
              </Badge>
              <span className="text-sm text-orange-700 dark:text-orange-300">
                Limite de {planLimits.limit} tintas atingido. 
                <Button variant="link" className="p-0 h-auto text-orange-700 dark:text-orange-300">
                  Faça upgrade para Pro
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>{t('inks.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{t('common.loading')}</p>
            </div>
          ) : inks.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('inks.costPerLiter')}</TableHead>
                    <TableHead>{t('common.supplier')}</TableHead>
                    <TableHead>{t('common.stock')}</TableHead>
                    <TableHead>{t('common.created')}</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inks.map((ink) => {
                    const stockStatus = getStockStatus(ink);
                    return (
                      <TableRow key={ink.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                            <span>{ink.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(ink.custoPorLitro)}/L</TableCell>
                        <TableCell>{ink.fornecedor || '-'}</TableCell>
                        <TableCell>
                          {ink.estoqueMl ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <Droplets className="w-4 h-4 text-slate-400" />
                                <span>{formatVolume(ink.estoqueMl)}</span>
                              </div>
                              {stockStatus && stockStatus.status === 'low' && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              {stockStatus && (
                                <Badge className={stockStatus.color}>
                                  {stockStatus.status === 'low' ? 'Baixo' : 
                                   stockStatus.status === 'medium' ? 'Médio' : 'Bom'}
                                </Badge>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{formatDate(ink.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(ink)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('inks.deleteConfirm')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(ink.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {t('actions.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('actions.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  {t('actions.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}