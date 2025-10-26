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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import { formatDate } from '@/lib/datetime';
import { getClients, createClient, updateClient, deleteClient, checkPlanLimits } from '@/lib/database';
import type { Client } from '@/lib/types';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [planLimits, setPlanLimits] = useState({ canCreate: true, limit: 0, current: 0 });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    doc: '',
    contato: '',
    email: '',
    telefone: '',
    endereco: '',
    notas: ''
  });

  const loadClients = async () => {
    setLoading(true);
    try {
      const result = await getClients(page, 10, search);
      setClients(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanLimits = async () => {
    const limits = await checkPlanLimits('clients');
    setPlanLimits(limits);
  };

  useEffect(() => {
    loadClients();
    loadPlanLimits();
  }, [page, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      doc: '',
      contato: '',
      email: '',
      telefone: '',
      endereco: '',
      notas: ''
    });
    setEditingClient(null);
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nome: client.nome,
        doc: client.doc || '',
        contato: client.contato || '',
        email: client.email || '',
        telefone: client.telefone || '',
        endereco: client.endereco || '',
        notas: client.notas || ''
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

    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadClients();
      loadPlanLimits();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
      loadClients();
      loadPlanLimits();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('clients.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {planLimits.limit === Infinity 
              ? `${planLimits.current} clientes` 
              : `${planLimits.current}/${planLimits.limit} clientes`
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
              {t('clients.newClient')}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? t('clients.editClient') : t('clients.newClient')}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">{t('clients.clientName')} *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="doc">{t('clients.document')}</Label>
                  <Input
                    id="doc"
                    value={formData.doc}
                    onChange={(e) => setFormData({ ...formData, doc: e.target.value })}
                    placeholder="CPF/CNPJ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contato">{t('clients.contact')}</Label>
                  <Input
                    id="contato"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">{t('common.phone')}</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="endereco">{t('common.address')}</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="notas">{t('common.notes')}</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Observações sobre o cliente"
                    rows={3}
                  />
                </div>
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
                Limite de {planLimits.limit} clientes atingido. 
                <Button variant="link" className="p-0 h-auto text-orange-700 dark:text-orange-300">
                  Faça upgrade para Pro
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{t('clients.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{t('common.loading')}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('clients.document')}</TableHead>
                    <TableHead>{t('clients.contact')}</TableHead>
                    <TableHead>{t('common.email')}</TableHead>
                    <TableHead>{t('common.phone')}</TableHead>
                    <TableHead>{t('common.created')}</TableHead>
                    <TableHead className="text-right">{t('actions.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nome}</TableCell>
                      <TableCell>{client.doc || '-'}</TableCell>
                      <TableCell>{client.contato || '-'}</TableCell>
                      <TableCell>
                        {client.email ? (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>{client.email}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {client.telefone ? (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{client.telefone}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{formatDate(client.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(client)}
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
                                  {t('clients.deleteConfirm')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(client.id)}
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
                  ))}
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