import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { storeService, Store } from '@/services/store.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Store as StoreIcon } from 'lucide-react';

const AdminStores: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(['ADMINS', 'admins', 'ADMIN', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const [formData, setFormData] = useState<{ name: string; address: string }>({ name: '', address: '' });

  useEffect(() => {
    loadStores();
  }, [pagination.page, searchTerm]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await storeService.getStores({ page: pagination.page, limit: pagination.limit, search: searchTerm });
      if ((res as any).data && Array.isArray((res as any).data)) {
        setStores((res as any).data);
        setPagination(prev => ({ ...prev, total: (res as any).pagination?.total || (res as any).data.length }));
      } else if ((res as any).data && Array.isArray((res as any).data.data)) {
        setStores((res as any).data.data);
        setPagination(prev => ({ ...prev, total: (res as any).data.pagination?.total || (res as any).data.data.length }));
      } else if (Array.isArray(res)) {
        setStores(res as any);
        setPagination(prev => ({ ...prev, total: (res as any).length }));
      } else {
        setStores((res as any).data || []);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load stores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingStore(null);
    setFormData({ name: '', address: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingStore) {
        await storeService.updateStore(editingStore.id, formData);
        toast({ title: 'Success', description: 'Store updated successfully' });
      } else {
        await storeService.createStore(formData);
        toast({ title: 'Success', description: 'Store created successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
      loadStores();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Operation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({ name: store.name, address: store.address || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;
    try {
      await storeService.deleteStore(id);
      toast({ title: 'Success', description: 'Store deleted successfully' });
      loadStores();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete store', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><StoreIcon className="h-5 w-5" />Stores</CardTitle>
        <CardDescription>Manage physical store locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Input placeholder="Search stores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
            <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Store</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
              ) : !stores || stores.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center">No stores found</TableCell></TableRow>
              ) : (
                stores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.address || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">Showing {stores?.length || 0} of {pagination.total} stores</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
            <DialogDescription>{editingStore ? 'Update store details below.' : 'Fill in the details to create a new store.'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Store Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit">{editingStore ? 'Save' : 'Create'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminStores;
