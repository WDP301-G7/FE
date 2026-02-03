import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Truck, Package, MapPin, Eye, CheckCircle, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { adminService, OrderStats } from '@/services/admin.service';
import type { Order } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const OperationsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Confirm dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNote, setAppointmentNote] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');

  // Cancel dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Force status dialog
  const [isForceOpen, setIsForceOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadStats();
    loadOrders();
  }, [page, search, statusFilter]);

  const loadStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats', err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await adminService.getOrders(params);
      setOrders(data.items);
      setTotal(data.total);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const openConfirm = (order: Order) => {
    setSelectedOrder(order);
    setAppointmentDate('');
    setAppointmentNote('');
    setAssignedStaffId('');
    setIsConfirmOpen(true);
  };

  const submitConfirm = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      // convert datetime-local to ISO
      const isoDate = appointmentDate ? new Date(appointmentDate).toISOString() : new Date().toISOString();
      await adminService.confirmOrder(selectedOrder.id, {
        appointmentDate: isoDate,
        appointmentNote: appointmentNote || undefined,
        assignedStaffId: assignedStaffId || undefined,
      });
      toast({ title: 'Success', description: 'Order confirmed and appointment set' });
      setIsConfirmOpen(false);
      loadOrders();
      loadStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to confirm order', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCancel = (order: Order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setIsCancelOpen(true);
  };

  const submitCancel = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await adminService.cancelOrder(selectedOrder.id, { reason: cancelReason });
      toast({ title: 'Success', description: 'Order cancelled' });
      setIsCancelOpen(false);
      loadOrders();
      loadStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to cancel order', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openForce = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsForceOpen(true);
  };

  const submitForce = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await adminService.forceUpdateStatus(selectedOrder.id, { status: newStatus });
      toast({ title: 'Success', description: 'Order status updated' });
      setIsForceOpen(false);
      loadOrders();
      loadStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update status', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-muted-foreground">Manage logistics, shipping, and warehouse operations</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="h-4 w-4 mr-2" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="warehouse">
            <Package className="h-4 w-4 mr-2" />
            Warehouse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders ?? '—'}</div>
                <p className="text-xs text-muted-foreground">All orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pending ?? '—'}</div>
                <p className="text-xs text-muted-foreground">Waiting for confirmation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipping</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.shipping ?? '—'}</div>
                <p className="text-xs text-muted-foreground">Currently shipping</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.delivered ?? '—'}</div>
                <p className="text-xs text-muted-foreground">Delivered successfully</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Logistics Overview</CardTitle>
              <CardDescription>Daily operations summary</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Real-time stats are shown above. Use the Shipping tab to manage orders.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Order Operations
              </CardTitle>
              <CardDescription>Confirm, cancel, and force-update order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPING">Shipping</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setPage(1); loadOrders(); }}>
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : !orders || orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No orders found</TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customerName}</div>
                              <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openDetails(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openConfirm(order)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openCancel(order)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openForce(order)}>
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">Showing {orders?.length || 0} of {total} orders</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Dialog */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer</Label>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">{selectedOrder.status}</div>
                    </div>
                  </div>
                  <div>
                    <Label>Shipping Address</Label>
                    <p className="text-sm">{selectedOrder.shippingAddress}</p>
                  </div>
                  <div>
                    <Label>Items</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">Total: {formatCurrency(selectedOrder.totalAmount)}</div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Confirm Dialog */}
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Order & Set Appointment</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Appointment Date</Label>
                  <Input type="datetime-local" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                </div>
                <div>
                  <Label>Note</Label>
                  <Textarea value={appointmentNote} onChange={(e) => setAppointmentNote(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Assign Staff ID (optional)</Label>
                  <Input placeholder="staff id" value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button onClick={submitConfirm} disabled={loading}>{loading ? 'Confirming...' : 'Confirm'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Dialog */}
          <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Reason</Label>
                  <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Back</Button>
                <Button onClick={submitCancel} disabled={loading}>{loading ? 'Cancelling...' : 'Confirm Cancel'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Force Status Dialog */}
          <Dialog open={isForceOpen} onOpenChange={setIsForceOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Force Update Status (Admin)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">NEW</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                      <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                      <SelectItem value="SHIPPING">SHIPPING</SelectItem>
                      <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsForceOpen(false)}>Cancel</Button>
                <Button onClick={submitForce} disabled={loading}>{loading ? 'Updating...' : 'Update'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="warehouse">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Management</CardTitle>
              <CardDescription>Manage inventory and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Warehouse management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsDashboard;
