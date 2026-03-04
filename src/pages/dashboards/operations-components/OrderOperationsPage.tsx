import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
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
import { operationsService, OrderDetails, GetOrdersParams } from '@/services/operations.service';
import { adminService } from '@/services/admin.service';
import { Eye, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Staff type for dropdown
interface StaffMember {
  id: string;
  fullName: string;
  email: string;
}

const OrderOperationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(['operations'])) {
    return <Navigate to="/dashboard" replace />;
  }
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Increased to show more orders per page
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  // removed processing/ready dialogs

  // Confirm form
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');

  // fetch staff users via API
  useEffect(() => {
    const loadStaffs = async () => {
      try {
        // Try with role filter first
        console.log('Attempting to load staff with role=STAFF filter...');
        let res = await adminService.getUsers({ page: 1, limit: 100, role: 'STAFF' });
        console.log('Staff API response with role filter:', res);
        
        // API returns data.users array
        let users = (res as any).users || (res as any).items || (res as any).data || (Array.isArray(res) ? res : []);
        console.log('Extracted users with role filter:', users);
        
        // If no users with role filter, try without filter
        if ((!users || users.length === 0)) {
          console.log('No staff found with role filter, trying without filter...');
          res = await adminService.getUsers({ page: 1, limit: 100 });
          console.log('Staff API response without filter:', res);
          users = (res as any).users || (res as any).items || (res as any).data || (Array.isArray(res) ? res : []);
          console.log('Extracted users without filter:', users);
        }
        
        const staffArray = users.map((u: any) => {
          console.log('Processing user:', u);
          return { id: u.id, fullName: u.fullName, email: u.email };
        });
        console.log('Final staff list:', staffArray);
        setStaffList(staffArray);
      } catch (err: any) {
        console.error('Failed to load staff list:', err);
        console.error('Error details:', err.response?.data);
        // Set empty staff list on error instead of crashing
        setStaffList([]);
      }
    };

    loadStaffs();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, pageSize]);
  
  // Reset pagination when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: GetOrdersParams = {
        page: currentPage,
        size: pageSize,
      };
      if (statusFilter && statusFilter !== "__all") params.status = statusFilter;
      const response = await operationsService.getAllOrders(params);
      console.log('loadOrders params:', params);
      console.log('loadOrders response:', response);
      console.log('pageInfo:', response.pageInfo);
      console.log('orders count:', response.orders.length);
      
      // Response now includes orders array and pageInfo
      setOrders(response.orders || []);
      
      // Calculate total from pageInfo if available, otherwise use length
      const total = response.pageInfo?.totalElements || response.orders.length;
      console.log('Calculated total:', total);
      setTotalItems(total);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load orders',
        variant: 'destructive',
      });
      setOrders([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (order: OrderDetails) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const openConfirm = (order: OrderDetails) => {
    setSelectedOrder(order);
    setAppointmentDate(order.createdDate ? new Date(order.createdDate).toISOString().slice(0, 16) : '');
    setAppointmentNotes('');
    setAssignedStaffId('');
    setIsConfirmOpen(true);
  };

  const submitConfirm = async () => {
    if (!selectedOrder || !appointmentDate || !assignedStaffId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      // Convert datetime-local format to ISO 8601 with Z
      const dateObj = new Date(appointmentDate + ':00.000Z');
      const isoDate = dateObj.toISOString();
      
      console.log('Sending confirm request with:');
      console.log('- appointmentDate:', isoDate);
      console.log('- appointmentNotes:', appointmentNotes);
      console.log('- assignedStaffId:', assignedStaffId);
      
      await operationsService.confirmOrder(selectedOrder.id, {
        appointmentDate: isoDate,
        appointmentNotes,
        assignedStaffId,
      });
      toast({
        title: 'Success',
        description: 'Order accepted and appointment scheduled',
      });
      setIsConfirmOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to confirm order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCancel = (order: OrderDetails) => {
    setSelectedOrder(order);
    setCancelReason('');
    setIsCancelOpen(true);
  };

  const submitCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for cancellation',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await operationsService.cancelOrder(selectedOrder.id, {
        reason: cancelReason,
      });
      toast({
        title: 'Success',
        description: 'Order cancelled successfully',
      });
      setIsCancelOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (amount?: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'outline',
      CONFIRMED: 'default',
      PROCESSING: 'secondary',
      READY: 'default',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Operations</h1>
        <p className="text-muted-foreground">Manage order confirmations, scheduling, and staff assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <CardDescription>View and manage orders - confirm, schedule, assign staff, and track status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 gap-4">
            <Select
              value={statusFilter || "__all"}
              onValueChange={(v) => setStatusFilter(v === "__all" ? "" : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setCurrentPage(1); loadOrders(); }} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!Array.isArray(orders) || orders.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                      <TableCell>{formatDate(order.createdDate)}</TableCell>
                      <TableCell>{order.customerId || 'N/A'}</TableCell>
                      <TableCell>{order.staffId || 'Not assigned'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openConfirm(order)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openCancel(order)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} (Total: {totalItems} orders)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && (
                    <PaginationItem>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Order ID</Label>
                <p className="text-sm">{selectedOrder.id}</p>
              </div>
              <div>
                <Label className="font-semibold">Status</Label>
                <p className="text-sm">{getStatusBadge(selectedOrder.status)}</p>
              </div>
              <div>
                <Label className="font-semibold">Total Price</Label>
                <p className="text-sm">{formatCurrency(selectedOrder.totalPrice)}</p>
              </div>
              <div>
                <Label className="font-semibold">Created Date</Label>
                <p className="text-sm">{formatDate(selectedOrder.createdDate)}</p>
              </div>
              <div>
                <Label className="font-semibold">Customer ID</Label>
                <p className="text-sm">{selectedOrder.customerId || 'N/A'}</p>
              </div>
              <div>
                <Label className="font-semibold">Staff ID</Label>
                <p className="text-sm">{selectedOrder.staffId || 'Not assigned'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Order & Schedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="appointmentDate">Appointment Date & Time</Label>
              <Input
                id="appointmentDate"
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="appointmentNotes">Appointment Notes</Label>
              <Textarea
                id="appointmentNotes"
                placeholder="Enter any notes for the appointment"
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="staffId">Assign Staff</Label>
              <Select value={assignedStaffId} onValueChange={setAssignedStaffId}>
                <SelectTrigger id="staffId">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitConfirm} disabled={loading}>
              {loading ? 'Confirming...' : 'Accept Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please provide a reason for cancelling this order"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Close
            </Button>
            <Button variant="destructive" onClick={submitCancel} disabled={loading}>
              {loading ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default OrderOperationsPage;
