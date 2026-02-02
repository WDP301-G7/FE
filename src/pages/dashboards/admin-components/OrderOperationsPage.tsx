import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminService, OrderStats, UserSummary } from '@/services/admin.service';
import { Eye, CheckCircle, XCircle, Calendar } from 'lucide-react';

// Local typing that matches API response shape
interface ApiProduct {
  id: string;
  name: string;
  sku?: string;
  brand?: string;
}

interface ApiOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string; // API returns string amounts
  itemStatus: string;
  note?: string | null;
  product: ApiProduct;
}

interface ApiPayment {
  id: string;
  orderId: string;
  method: string;
  amount: string;
  status: string;
  paidAt?: string | null;
}

interface ApiCustomer {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface ApiOrder {
  id: string;
  customerId: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  depositAmount?: string | null;
  totalAmount: string; // as string
  expectedReadyDate?: string | null;
  appointmentDate?: string | null;
  appointmentNote?: string | null;
  handledBy?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: ApiCustomer;
  handler?: any | null;
  orderItems: ApiOrderItem[];
  payments: ApiPayment[];
  prescription?: any | null;
}

const OrderOperationsPage: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Confirm
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNote, setAppointmentNote] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');

  // Staffs
  const [staffs, setStaffs] = useState<UserSummary[]>([]);
  

  // Cancel
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Force Status
  const [isForceOpen, setIsForceOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadStats();
    loadOrders();
    loadStaffs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  const loadStaffs = async () => {
    try {
      const res = await adminService.getUsers({ page: 1, limit: 100, role: 'STAFF' });
      setStaffs(res.users || []);
      console.log('Loaded staffs:', res.users);
    } catch (err: any) {
      console.error('Failed to load staffs', err);
    }
  }; 

  const loadStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats', err);
    }
  };

  const parseOrdersResponse = (res: any): { items: ApiOrder[]; total: number } => {
    // Supports both shapes: { items, total } and { data: [...], meta: { total } }
    if (!res) return { items: [], total: 0 };
    if (Array.isArray(res.data)) {
      return { items: res.data as ApiOrder[], total: res.meta?.total ?? 0 };
    }
    if (Array.isArray(res.items)) {
      return { items: res.items as ApiOrder[], total: res.total ?? 0 };
    }
    return { items: [], total: 0 };
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await adminService.getOrders(params);
      const { items, total: tot } = parseOrdersResponse(data as any);
      setOrders(items);
      setTotal(tot);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (order: ApiOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const openConfirm = (order: ApiOrder) => {
    setSelectedOrder(order);
    setAppointmentDate(order.appointmentDate ? new Date(order.appointmentDate).toISOString().slice(0, 16) : '');
    setAppointmentNote(order.appointmentNote || '');
    // handledBy may come as string id or an object; normalize to string id
    const handledById = typeof (order as any).handledBy === 'string' ? (order as any).handledBy : (order as any).handledBy?.id ?? '';
    // use special token for 'no selection' to avoid empty-string issues with Radix
    setAssignedStaffId(handledById ? String(handledById) : '__none');
    setIsConfirmOpen(true);
  };

  const submitConfirm = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const isoDate = appointmentDate ? new Date(appointmentDate).toISOString() : new Date().toISOString();
      await adminService.confirmOrder(selectedOrder.id, {
        appointmentDate: isoDate,
        appointmentNote: appointmentNote || undefined,
        // Send undefined when user selected the '__none' token
        assignedStaffId: assignedStaffId && assignedStaffId !== '__none' ? assignedStaffId : undefined,
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

  const openCancel = (order: ApiOrder) => {
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

  const openForce = (order: ApiOrder) => {
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

  const toNumber = (val?: string | number) => Number(val ?? 0);
  const formatCurrency = (amount?: string | number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(toNumber(amount));

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; class: string }> = {
      NEW: { variant: 'outline', class: 'bg-gray-100 text-gray-800' },
      PENDING: { variant: 'outline', class: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { variant: 'default', class: 'bg-blue-100 text-blue-800' },
      PROCESSING: { variant: 'secondary', class: 'bg-purple-100 text-purple-800' },
      SHIPPING: { variant: 'default', class: 'bg-indigo-100 text-indigo-800' },
      DELIVERED: { variant: 'default', class: 'bg-green-100 text-green-800' },
      CANCELLED: { variant: 'destructive', class: 'bg-red-100 text-red-800' },
    };
    const config = variants[status] || { variant: 'outline', class: '' };
    return <Badge variant={config.variant} className={config.class}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin - Order Operations</h1>
        <p className="text-muted-foreground">Approve, cancel and manage orders</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders ?? '—'}</div>
            <p className="text-xs text-muted-foreground">All orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Waiting for approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.shipping ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Currently shipping</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.delivered ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Search, filter and operate on orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input placeholder="Search orders... (customer, id)" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
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
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : !orders || orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No orders found</TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer?.fullName}</div>
                          <div className="text-sm text-muted-foreground">{order.customer?.email || order.customer?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'outline'}>{order.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{selectedOrder.customer.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer.phone}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  <div className="mt-2"><Label>Payment</Label><div className="mt-1"><Badge variant={selectedOrder.paymentStatus === 'PAID' ? 'default' : 'outline'}>{selectedOrder.paymentStatus}</Badge></div></div>
                </div>
              </div>

              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || item.productId}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(Number(item.unitPrice) * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <Label>Payments</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground">No payments</TableCell>
                      </TableRow>
                    ) : (
                      selectedOrder.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{formatCurrency(p.amount)}</TableCell>
                          <TableCell>{p.status}</TableCell>
                          <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
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
              <Label>Assign Staff (optional)</Label>
              <Select value={assignedStaffId} onValueChange={(v) => setAssignedStaffId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use explicit non-empty token for 'no one' to avoid Radix validation issues */}
                  <SelectItem value="__none">No one</SelectItem>

                  {staffs.length === 0 ? (
                    <SelectItem value="__no_staff" disabled>No staff available</SelectItem>
                  ) : (
                    staffs.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.fullName}{s.email ? ` • ${s.email}` : ''}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
    </div>
  );
};

export default OrderOperationsPage;
