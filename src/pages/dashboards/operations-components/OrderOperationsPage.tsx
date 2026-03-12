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
import StatusBadge from '@/components/StatusBadge';
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

  // status rendering is now handled by a shared component
  // (mapping and label formatting lives in components/StatusBadge.tsx)
  // const getStatusBadge is no longer needed here.
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">Xem và quản lý đơn hàng</p>
      </div>

    

      {/* summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Tổng đơn</p>
          <p className="text-xl font-bold">{totalItems}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Đơn hoàn thành</p>
          <p className="text-xl font-bold">{orders.filter(o => o.status === 'COMPLETED').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Đã xác nhận</p>
          <p className="text-xl font-bold">{orders.filter(o => o.status === 'CONFIRMED').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Bị hủy</p>
          <p className="text-xl font-bold">{orders.filter(o => o.status === 'CANCELLED').length}</p>
        </div>
      </div>

      {/* orders table card */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Danh sách đơn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <Select value={statusFilter || "__all"} onValueChange={(v) => setStatusFilter(v === "__all" ? "" : v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="WAITING_CUSTOMER">Waiting</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setCurrentPage(1); loadOrders(); }} disabled={loading} className="rounded-full px-4">
              Refresh
            </Button>
          </div>
          {/* use white card and soft divider instead of strong border */}
          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-gray-600 uppercase tracking-wide">Mã đơn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right text-gray-600 uppercase tracking-wide">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!Array.isArray(orders) || orders.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Không có đơn hàng nào !
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                      <TableCell className="font-medium text-gray-800 text-sm">{order.id}</TableCell>
                      <TableCell className="text-sm text-gray-700"><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-sm text-gray-700">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell className="text-sm text-gray-700">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-sm text-gray-700">{order.customer.fullName || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-gray-700">{order.staffId || 'Not assigned'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            className="rounded-full px-3"
                            onClick={() => openDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="rounded-full px-3"
                                onClick={() => openConfirm(order)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Xác nhận
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-full px-3"
                                onClick={() => openCancel(order)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Hủy
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 p-2 bg-white rounded-md shadow-inner">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} of {totalPages} (Tổng: {totalItems} đơn hàng)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
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
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Mã đơn hàng</Label>
                <p className="text-sm">{selectedOrder.id}</p>
              </div>
              <div>
                <Label className="font-semibold">Trạng thái</Label>
                <p className="text-sm"><StatusBadge status={selectedOrder.status} /></p>
              </div>
              <div>
                <Label className="font-semibold">Tổng giá</Label>
                <p className="text-sm">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              <div>
                <Label className="font-semibold">Ngày tạo</Label>
                <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <Label className="font-semibold">Khách hàng</Label>
                <p className="text-sm">{selectedOrder.customer?.fullName || 'N/A'}</p>
              </div>
              <div>
                <Label className="font-semibold">Nhân viên</Label>
                <p className="text-sm">{selectedOrder.staffId || 'Not assigned'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt lịch hẹn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="appointmentDate">Ngày & Giờ Hẹn</Label>
              <Input
                id="appointmentDate"
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="appointmentNotes">Ghi chú về cuộc hẹn</Label>
              <Textarea
                id="appointmentNotes"
                placeholder="Enter any notes for the appointment"
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="staffId">Chọn nhân viên</Label>
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
              Hủy
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
            <DialogTitle>Hủy Đơn Hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Lý do Hủy</Label>
              <Textarea
                id="cancelReason"
                placeholder="Vui lòng cung cấp lý do hủy đơn hàng này"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
        
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Đóng
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
