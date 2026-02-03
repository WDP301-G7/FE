import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { inventoryService, Inventory, CreateInventoryData, UpdateInventoryData } from '@/services/inventory.service';
import { productService, Product } from '@/services/product.service';
import { storeService, Store } from '@/services/store.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export const AdminInventoryManagement: React.FC = () => {
  const { toast } = useToast();

  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // filters
  const [filterProductId, setFilterProductId] = useState<string | undefined>(undefined);
  const [filterStoreId, setFilterStoreId] = useState<string | undefined>(undefined);
  const [filterLowStock, setFilterLowStock] = useState<'ALL' | 'LOW' | 'OK'>('ALL');

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Inventory | null>(null);

  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveInventory, setReserveInventory] = useState<Inventory | null>(null);
  const [reserveQuantity, setReserveQuantity] = useState<number>(1);

  const [formData, setFormData] = useState<CreateInventoryData>({ productId: '', storeId: '', quantity: 0, reservedQuantity: 0 });

  // Form errors for create/edit
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Reserve-specific error
  const [reserveError, setReserveError] = useState<string | null>(null);

  const clearFieldError = (field: string) => setFormErrors(prev => { const c = { ...prev }; delete (c as any)[field]; return c; });

  // Track pending async actions per inventory id to avoid duplicate operations and show optimistic UI
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

  // Small retry helper with exponential backoff for transient errors
  const retryAsync = async <T,>(fn: () => Promise<T>, retries = 2, delay = 300): Promise<T> => {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (err) {
        if (attempt >= retries) throw err;
        attempt++;
        await new Promise(res => setTimeout(res, delay * Math.pow(2, attempt - 1)));
      }
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadInventories();
  }, [pagination.page, search, filterProductId, filterStoreId, filterLowStock]);

  const loadLookups = async () => {
    try {
      const [prodRes, storeRes] = await Promise.all([
        productService.getProducts({ page: 1, limit: 1000 }),
        storeService.getStores({ page: 1, limit: 1000 }),
      ]);

      // productService.getProducts may return variety of shapes, normalize
      const prodList = (prodRes as any).data || (prodRes as any);
      const storeList = (storeRes as any).data || (storeRes as any);

      setProducts(Array.isArray(prodList) ? prodList : (prodList.items || prodList.data || []));
      setStores(Array.isArray(storeList) ? storeList : (storeList.items || storeList.data || []));
    } catch (error: any) {
      toast({ title: 'Lỗi', description: 'Tải sản phẩm hoặc cửa hàng thất bại', variant: 'destructive' });
    }
  };

  const loadInventories = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (filterProductId) params.productId = filterProductId;
      if (filterStoreId) params.storeId = filterStoreId;
      if (filterLowStock === 'LOW') params.lowStock = true;

      const res: any = await inventoryService.getInventories(params);

      // Normalize response
      let items: Inventory[] = [];
      let total = 0;
      if (res && Array.isArray(res.data)) {
        items = res.data;
        total = res.pagination?.total || res.data.length;
      } else if (res && Array.isArray(res)) {
        items = res;
        total = res.length;
      } else if (res && res.items && Array.isArray(res.items)) {
        items = res.items;
        total = res.total || res.items.length;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        items = res.data.data;
        total = res.data.pagination?.total || items.length;
      } else {
        items = res.data || [];
      }

      setInventories(items);
      setPagination(prev => ({ ...prev, total }));
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.message || 'Tải dữ liệu tồn kho thất bại', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ productId: '', storeId: '', quantity: 0, reservedQuantity: 0 });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (inv: Inventory) => {
    setEditing(inv);
    setFormData({ productId: inv.productId, storeId: inv.storeId, quantity: inv.quantity, reservedQuantity: inv.reservedQuantity });
    setIsEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation (set field errors)
    const errs: Record<string, string> = {};
    if (!formData.productId) errs.productId = 'Chưa chọn sản phẩm';
    if (!formData.storeId) errs.storeId = 'Chưa chọn cửa hàng';
    if (formData.quantity < 0) errs.quantity = 'Số lượng phải >= 0';
    if ((formData.reservedQuantity || 0) < 0) errs.reservedQuantity = 'Số lượng đã đặt trước phải >= 0';
    if ((formData.reservedQuantity || 0) > formData.quantity) errs.reservedQuantity = 'Số lượng đã đặt trước không thể lớn hơn tổng số lượng';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    try {
      await inventoryService.createInventory(formData);
      setFormErrors({});
      toast({ title: 'Thành công', description: 'Tạo tồn kho thành công' });
      setIsCreateOpen(false);
      loadInventories();
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const serverErrors = error.response?.data?.errors;
      const newErrs: Record<string, string> = {};

      if (serverErrors) {
        if (Array.isArray(serverErrors)) {
          serverErrors.forEach((it: any) => {
            if (typeof it === 'string') newErrs._form = (newErrs._form ? newErrs._form + '; ' : '') + it;
            else if (it.field) newErrs[it.field] = it.message || JSON.stringify(it);
            else newErrs._form = (newErrs._form ? newErrs._form + '; ' : '') + JSON.stringify(it);
          });
        } else if (typeof serverErrors === 'object') {
          Object.assign(newErrs, serverErrors);
        }
      } else if (serverMessage) {
        newErrs._form = serverMessage;
      }

      setFormErrors(newErrs);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    // Client-side validation (set field errors)
    const errs: Record<string, string> = {};
    if (formData.quantity < 0) errs.quantity = 'Số lượng phải >= 0';
    if ((formData.reservedQuantity || 0) < 0) errs.reservedQuantity = 'Số lượng đã đặt trước phải >= 0';
    if ((formData.reservedQuantity || 0) > formData.quantity) errs.reservedQuantity = 'Số lượng đã đặt trước không thể lớn hơn tổng số lượng';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    try {
      const data: UpdateInventoryData = { quantity: formData.quantity, reservedQuantity: formData.reservedQuantity };
      await inventoryService.updateInventory(editing.id, data);
      setFormErrors({});
      toast({ title: 'Thành công', description: 'Cập nhật tồn kho thành công' });
      setIsEditOpen(false);
      loadInventories();
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const serverErrors = error.response?.data?.errors;
      const newErrs: Record<string, string> = {};

      if (serverErrors) {
        if (Array.isArray(serverErrors)) {
          serverErrors.forEach((it: any) => {
            if (typeof it === 'string') newErrs._form = (newErrs._form ? newErrs._form + '; ' : '') + it;
            else if (it.field) newErrs[it.field] = it.message || JSON.stringify(it);
            else newErrs._form = (newErrs._form ? newErrs._form + '; ' : '') + JSON.stringify(it);
          });
        } else if (typeof serverErrors === 'object') {
          Object.assign(newErrs, serverErrors);
        }
      } else if (serverMessage) {
        newErrs._form = serverMessage;
      }

      setFormErrors(newErrs);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi tồn kho này không?')) return;
    try {
      await inventoryService.deleteInventory(id);
      toast({ title: 'Thành công', description: 'Xóa tồn kho thành công' });
      loadInventories();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.message || 'Xóa thất bại', variant: 'destructive' });
    }
  };

  const openReserve = (inv: Inventory) => {
    setReserveInventory(inv);
    setReserveQuantity(1);
    setReserveError(null);
    setIsReserveOpen(true);
  };

  const doReserve = async () => {
    if (!reserveInventory) return;
    setReserveError(null);
    const available = Math.max(0, reserveInventory.quantity - reserveInventory.reservedQuantity);
    if (reserveQuantity <= 0) { setReserveError('Số lượng đặt trước phải lớn hơn 0'); return; }
    if (reserveQuantity > available) { setReserveError('Số lượng đặt trước vượt quá khả dụng'); return; }

    const id = reserveInventory.id;
    const prev = inventories;
    // optimistic update
    setInventories(list => list.map(it => it.id === id ? ({ ...it, reservedQuantity: Math.min(it.quantity, it.reservedQuantity + reserveQuantity) }) : it));
    setPendingActions(p => ({ ...p, [id]: true }));

    try {
      const updated = await retryAsync(() => inventoryService.adjustReserved(id, reserveQuantity));
      // Merge server-returned item if provided
      setInventories(list => list.map(it => it.id === id ? updated : it));
      setReserveError(null);
      toast({ title: 'Thành công', description: 'Đặt trước thành công' });
      setIsReserveOpen(false);
    } catch (error: any) {
      // revert optimistic update
      setInventories(prev);
      const serverMessage = error.response?.data?.message || error.message;
      setReserveError(serverMessage || 'Đặt trước thất bại');
    } finally {
      setPendingActions(p => { const c = { ...p }; delete c[id]; return c; });
      loadInventories();
    }
  };

  const doRelease = async (inv: Inventory) => {
    const qStr = prompt('Nhập số lượng cần giải phóng', '1');
    if (!qStr) return;
    const q = parseInt(qStr, 10);
    if (isNaN(q) || q <= 0) return toast({ title: 'Lỗi', description: 'Số lượng không hợp lệ', variant: 'destructive' });

    const id = inv.id;
    const prev = inventories;
    // optimistic update
    setInventories(list => list.map(it => it.id === id ? ({ ...it, reservedQuantity: Math.max(0, it.reservedQuantity - q) }) : it));
    setPendingActions(p => ({ ...p, [id]: true }));

    try {
      const updated = await retryAsync(() => inventoryService.adjustReserved(id, -q));
      setInventories(list => list.map(it => it.id === id ? updated : it));
      toast({ title: 'Thành công', description: 'Giải phóng tồn kho thành công' });
    } catch (error: any) {
      // revert optimistic update
      setInventories(prev);
      const msg = error.response?.data?.message || error.message;
      toast({ title: 'Lỗi', description: msg || 'Giải phóng thất bại', variant: 'destructive' });
    } finally {
      setPendingActions(p => { const c = { ...p }; delete c[id]; return c; });
      loadInventories();
    }
  };

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || productId;
  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || storeId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Quản lý tồn kho</CardTitle>
        <CardDescription>Quản lý số lượng tồn và đặt trước</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <Select value={filterProductId ?? '__ALL__'} onValueChange={(v) => setFilterProductId(v === '__ALL__' ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả sản phẩm</SelectItem>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStoreId ?? '__ALL__'} onValueChange={(v) => setFilterStoreId(v === '__ALL__' ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo cửa hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả cửa hàng</SelectItem>
                {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLowStock} onValueChange={(v) => setFilterLowStock(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="LOW">Còn ít</SelectItem>
                <SelectItem value="OK">Bình thường</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2"/>Thêm tồn kho</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Cửa hàng</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Đã đặt trước</TableHead>
                <TableHead>Khả dụng</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Đang tải...</TableCell></TableRow>
              ) : inventories.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">Chưa có bản ghi tồn kho</TableCell></TableRow>
              ) : (
                inventories.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{getProductName(inv.productId)}</TableCell>
                    <TableCell>{getStoreName(inv.storeId)}</TableCell>
                    <TableCell>{inv.quantity}</TableCell>
                    <TableCell>{inv.reservedQuantity}</TableCell>
                    <TableCell>{Math.max(0, inv.quantity - inv.reservedQuantity)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openReserve(inv)} disabled={!!pendingActions[inv.id]}>Đặt trước</Button>
                        <Button variant="ghost" size="sm" onClick={() => doRelease(inv)} disabled={!!pendingActions[inv.id]}>Giải phóng</Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(inv)} aria-label="Chỉnh sửa" disabled={!!pendingActions[inv.id]}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} aria-label="Xóa" disabled={!!pendingActions[inv.id]}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">Hiển thị {inventories.length} trên {pagination.total} bản ghi</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Trước</Button>
            <Button variant="outline" size="sm" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Tiếp</Button>
          </div>
        </div>
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo tồn kho</DialogTitle>
            <DialogDescription>Tạo bản ghi tồn kho cho sản phẩm và cửa hàng.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate}>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Sản phẩm</Label>
                <Select value={formData.productId} onValueChange={(v) => { setFormData(prev => ({ ...prev, productId: v })); clearFieldError('productId'); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.productId && <p className="text-sm text-destructive mt-1">{formErrors.productId}</p>}
              </div>

              <div>
                <Label>Cửa hàng</Label>
                <Select value={formData.storeId} onValueChange={(v) => { setFormData(prev => ({ ...prev, storeId: v })); clearFieldError('storeId'); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn cửa hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.storeId && <p className="text-sm text-destructive mt-1">{formErrors.storeId}</p>}
              </div>

              <div>
                <Label>Số lượng</Label>
                <Input type="number" value={formData.quantity} onChange={(e) => { setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value || '0', 10) })); clearFieldError('quantity'); }} />
                {formErrors.quantity && <p className="text-sm text-destructive mt-1">{formErrors.quantity}</p>}
              </div>

              <div>
                <Label>Số lượng đã đặt trước</Label>
                <Input type="number" value={formData.reservedQuantity} onChange={(e) => { setFormData(prev => ({ ...prev, reservedQuantity: parseInt(e.target.value || '0', 10) })); clearFieldError('reservedQuantity'); }} />
                {formErrors.reservedQuantity && <p className="text-sm text-destructive mt-1">{formErrors.reservedQuantity}</p>}
              </div>

              {formErrors._form && <p className="text-sm text-destructive mb-2">{formErrors._form}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                <Button type="submit">Tạo</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tồn kho</DialogTitle>
            <DialogDescription>Cập nhật số lượng cho bản ghi tồn kho này.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Sản phẩm</Label>
                <Input value={getProductName(formData.productId)} readOnly />
              </div>

              <div>
                <Label>Cửa hàng</Label>
                <Input value={getStoreName(formData.storeId)} readOnly />
              </div>

              <div>
                <Label>Số lượng</Label>
                <Input type="number" value={formData.quantity} onChange={(e) => { setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value || '0', 10) })); clearFieldError('quantity'); }} />
                {formErrors.quantity && <p className="text-sm text-destructive mt-1">{formErrors.quantity}</p>}
              </div>

              <div>
                <Label>Số lượng đã đặt trước</Label>
                <Input type="number" value={formData.reservedQuantity} onChange={(e) => { setFormData(prev => ({ ...prev, reservedQuantity: parseInt(e.target.value || '0', 10) })); clearFieldError('reservedQuantity'); }} />
                {formErrors.reservedQuantity && <p className="text-sm text-destructive mt-1">{formErrors.reservedQuantity}</p>}
              </div>

              {formErrors._form && <p className="text-sm text-destructive mb-2">{formErrors._form}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                <Button type="submit">Lưu</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reserve Dialog */}
      <Dialog open={isReserveOpen} onOpenChange={setIsReserveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đặt trước tồn kho</DialogTitle>
            <DialogDescription>Đặt trước số lượng cho đơn hàng</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Sản phẩm</Label>
              <Input value={reserveInventory ? getProductName(reserveInventory.productId) : ''} readOnly />
            </div>
            <div>
              <Label>Khả dụng</Label>
              <Input value={reserveInventory ? String(Math.max(0, reserveInventory.quantity - reserveInventory.reservedQuantity)) : ''} readOnly />
            </div>
            <div>
              <Label>Số lượng đặt trước</Label>
              <Input type="number" value={reserveQuantity} onChange={(e) => { setReserveQuantity(parseInt(e.target.value || '0', 10)); setReserveError(null); }} />
              {reserveError && <p className="text-sm text-destructive mt-1">{reserveError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsReserveOpen(false)}>Hủy</Button>
              <Button onClick={doReserve}>Đặt trước</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </Card>
  );
};

export default AdminInventoryManagement;
