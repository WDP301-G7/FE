import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { orderService, Order } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ClipboardList, Eye, CheckCircle, Package, Play, UserCheck, Glasses } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PrescriptionDetails } from './PrescriptionDetails';
import { motion } from 'framer-motion';

export const MyAssignedOrders: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'start' | 'ready' | 'complete' | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Prescription state
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);

  // Verify customer state
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Complete with notes
  const [completionNote, setCompletionNote] = useState('');

  useEffect(() => {
    loadOrders();
  }, [pagination.page, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAssignedOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      
      console.log('📊 Raw orders from API:', data.items.length, 'orders');
      console.log('👤 Current user ID:', user?.id);
      
      // DEBUG: Check first order structure
      if (data.items.length > 0) {
        console.log('🔍 First order structure:', {
          orderNumber: data.items[0].orderNumber,
          customerName: data.items[0].customerName,
          customer: (data.items[0] as any).customer,
          items: data.items[0].items,
          orderItems: (data.items[0] as any).orderItems,
          allKeys: Object.keys(data.items[0])
        });
      }
      
      // ⚠️ FILTER: Only show orders assigned to THIS staff
      // Backend should do this, but we filter here as backup
      const myOrders = data.items.filter((order: any) => {
        const assignedStaffId = order.handledBy || order.handler?.id || order.assignedStaffId || order.staffId;
        const isMyOrder = assignedStaffId === user?.id;
        console.log(`Order ${order.orderNumber}: handledBy=${assignedStaffId}, isMyOrder=${isMyOrder}`);
        return isMyOrder;
      });
      
      console.log('✅ Filtered to MY orders:', myOrders.length, 'orders');
      
      setOrders(myOrders);
      setPagination(prev => ({ ...prev, total: myOrders.length }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load assigned orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order: Order) => {
    console.log('🔍 handleViewDetails called with order:', order.id, order.orderNumber);
    console.log('📦 Order structure:', {
      hasItems: !!(order.items),
      hasOrderItems: !!((order as any).orderItems),
      items: order.items,
      orderItems: (order as any).orderItems,
      allKeys: Object.keys(order)
    });
    setSelectedOrder(order);
    setPrescriptionData(null);
    setIsDetailDialogOpen(true);
    console.log('✅ Dialog state set:', { isDetailDialogOpen: true, selectedOrder: order });
    
    // Load prescription if it's a prescription order
    if (order.status !== 'NEW') {
      console.log('📋 Loading prescription for order:', order.id);
      await loadPrescription(order.id);
    }
  };

  const handleAction = (order: Order, action: 'start' | 'ready' | 'complete') => {
    console.log('⚡ handleAction called:', { orderId: order.id, action });
    setSelectedOrder(order);
    setActionType(action);
    
    if (action === 'complete') {
      // For complete action, open verify dialog first
      console.log('🔐 Opening verify dialog for completion');
      setVerifyPhone('');
      setVerifyResult(null);
      setCompletionNote('');
      setIsVerifyDialogOpen(true);
    } else {
      console.log('✅ Opening confirm dialog for action:', action);
      setIsConfirmDialogOpen(true);
    }
  };

  const handleVerifyCustomer = async () => {
    if (!selectedOrder || !verifyPhone) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập số điện thoại',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    try {
      const result = await orderService.verifyCustomer(selectedOrder.id, verifyPhone);
      setVerifyResult(result);
      
      if (result.verified) {
        toast({
          title: 'Xác thực thành công',
          description: `Khách hàng: ${result.customer.fullName}`,
        });
      } else {
        toast({
          title: 'Xác thực thất bại',
          description: 'Số điện thoại không khớp',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xác thực',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const loadPrescription = async (orderId: string) => {
    setLoadingPrescription(true);
    try {
      const data = await orderService.getOrderPrescription(orderId);
      setPrescriptionData(data.prescription);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải thông tin đơn thuốc',
        variant: 'destructive',
      });
    } finally {
      setLoadingPrescription(false);
    }
  };

  const executeAction = async () => {
    if (!selectedOrder || !actionType) return;

    setLoading(true);
    try {
      let result;
      let message = '';
      
      switch (actionType) {
        case 'start':
          result = await orderService.startProcessing(selectedOrder.id);
          message = 'Đã bắt đầu xử lý đơn hàng';
          break;
        case 'ready':
          result = await orderService.markReady(selectedOrder.id);
          message = 'Đã đánh dấu hoàn thành';
          break;
        case 'complete':
          if (completionNote) {
            result = await orderService.completeOrderWithNotes(selectedOrder.id, { completionNote });
          } else {
            result = await orderService.completeOrder(selectedOrder.id);
          }
          message = 'Đơn hàng đã hoàn tất';
          break;
      }
      
      toast({ title: 'Thành công', description: message });
      setIsConfirmDialogOpen(false);
      setIsVerifyDialogOpen(false);
      setSelectedOrder(null);
      setActionType(null);
      setVerifyResult(null);
      loadOrders();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xử lý đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get customer info from different backend response structures
  const getCustomerInfo = (order: any) => {
    return {
      name: order.customerName || order.customer?.fullName || order.customer?.name || 'N/A',
      email: order.customerEmail || order.customer?.email || 'N/A',
      phone: order.customerPhone || order.customer?.phone || 'N/A',
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; class: string; label: string }> = {
      NEW: { variant: 'outline', class: 'bg-gray-100 text-gray-800', label: 'Mới' },
      CONFIRMED: { variant: 'default', class: 'bg-blue-100 text-blue-800', label: 'Đã xác nhận' },
      WAITING_CUSTOMER: { variant: 'outline', class: 'bg-cyan-100 text-cyan-800 border-cyan-300', label: 'Chờ làm' },
      PROCESSING: { variant: 'secondary', class: 'bg-purple-100 text-purple-800', label: 'Đang làm' },
      READY: { variant: 'default', class: 'bg-orange-100 text-orange-800', label: 'Sẵn sàng' },
      COMPLETED: { variant: 'default', class: 'bg-green-100 text-green-800', label: 'Hoàn thành' },
      CANCELLED: { variant: 'destructive', class: 'bg-red-100 text-red-800', label: 'Đã hủy' },
    };
    const config = variants[status] || { variant: 'outline', class: '', label: status };
    return <Badge variant={config.variant} className={config.class}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            My Assigned Orders
          </CardTitle>
          <CardDescription>Orders assigned to you by operations team</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="flex justify-between items-center mb-4 gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">📋 Tất cả</SelectItem>
                <SelectItem value="CONFIRMED">✅ Đã xác nhận</SelectItem>
                <SelectItem value="WAITING_CUSTOMER">⏳ Chờ làm</SelectItem>
                <SelectItem value="PROCESSING">⚙️ Đang làm</SelectItem>
                <SelectItem value="READY">📦 Sẵn sàng</SelectItem>
                <SelectItem value="COMPLETED">🎉 Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">❌ Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            className="border rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ pointerEvents: 'auto' }}
          >
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
                    <TableCell colSpan={6} className="text-center">No orders assigned to you</TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {getCustomerInfo(order).name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getCustomerInfo(order).email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount || 0)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(order);
                            }}
                            title="Xem chi tiết"
                            className="hover:bg-slate-100 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Show Start Processing for CONFIRMED or WAITING_CUSTOMER orders - Bắt đầu làm */}
                          {(order.status === 'CONFIRMED' || order.status === 'WAITING_CUSTOMER') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(order, 'start');
                              }}
                              title="Bắt đầu làm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Show Mark Ready for PROCESSING orders - Làm xong */}
                          {order.status === 'PROCESSING' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(order, 'ready');
                              }}
                              title="Đánh dấu hoàn thành (Làm xong)"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 cursor-pointer"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Show Complete for READY orders - Giao khách */}
                          {order.status === 'READY' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(order, 'complete');
                              }}
                              title="Giao cho khách (Giao khách)"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {orders?.length || 0} of {pagination.total} orders
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Thông tin đơn</TabsTrigger>
                <TabsTrigger value="prescription">
                  <Glasses className="h-4 w-4 mr-2" />
                  Đơn thuốc
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Khách hàng</Label>
                    <p className="font-medium">
                      {getCustomerInfo(selectedOrder).name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getCustomerInfo(selectedOrder).email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getCustomerInfo(selectedOrder).phone}
                    </p>
                  </div>
                  <div>
                    <Label>Trạng thái</Label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
                <div>
                  <Label>Địa chỉ giao hàng</Label>
                  <p className="text-sm">{selectedOrder.shippingAddress}</p>
                </div>
                <div>
                  <Label>Sản phẩm</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Tổng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedOrder.items || (selectedOrder as any).orderItems || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Không có sản phẩm nào trong đơn hàng
                          </TableCell>
                        </TableRow>
                      ) : (
                        (selectedOrder.items || (selectedOrder as any).orderItems || []).map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName || item.product?.name || 'N/A'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.price || item.unitPrice || 0)}</TableCell>
                            <TableCell>{formatCurrency(item.subtotal || (item.quantity * (item.price || item.unitPrice || 0)))}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    Tổng: {formatCurrency(selectedOrder.totalAmount || 0)}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="prescription" className="mt-4">
                {loadingPrescription ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Đang tải thông tin đơn thuốc...
                  </div>
                ) : (
                  <PrescriptionDetails prescription={prescriptionData} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'start' && 'Bắt đầu xử lý đơn hàng?'}
              {actionType === 'ready' && 'Đánh dấu hoàn thành công việc?'}
              {actionType === 'complete' && 'Giao hàng cho khách?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'start' && (
                <>
                  Xác nhận bạn bắt đầu xử lý order <strong>{selectedOrder?.orderNumber}</strong>?
                  <br />
                  <span className="text-sm">Trạng thái sẽ chuyển sang PROCESSING (Đang xử lý).</span>
                </>
              )}
              {actionType === 'ready' && (
                <>
                  Xác nhận bạn đã hoàn thành order <strong>{selectedOrder?.orderNumber}</strong>?
                  <br />
                  <span className="text-sm">Trạng thái sẽ chuyển sang READY (Sẵn sàng giao khách).</span>
                </>
              )}
              {actionType === 'complete' && (
                <>
                  Xác nhận đã giao order <strong>{selectedOrder?.orderNumber}</strong> cho khách hàng?
                  <br />
                  <span className="text-sm">Trạng thái sẽ chuyển sang COMPLETED (Hoàn thành).</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Customer Dialog (for Complete action) */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Xác thực khách hàng
            </DialogTitle>
            <DialogDescription>
              Nhập số điện thoại của khách để xác thực trước khi giao hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verifyPhone">Số điện thoại *</Label>
              <Input
                id="verifyPhone"
                type="tel"
                placeholder="Nhập SĐT khách hàng"
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
                disabled={verifying}
              />
            </div>
            
            {verifyResult && (
              <div className={`p-4 rounded-lg border ${verifyResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {verifyResult.verified ? (
                  <div>
                    <p className="font-medium text-green-800">✅ Xác thực thành công</p>
                    <p className="text-sm text-green-700 mt-2">
                      <strong>Khách hàng:</strong> {verifyResult.customer.fullName}
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Email:</strong> {verifyResult.customer.email}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-800">❌ Xác thực thất bại</p>
                    <p className="text-sm text-red-700 mt-2">
                      Số điện thoại không khớp với đơn hàng
                    </p>
                  </div>
                )}
              </div>
            )}

            {verifyResult?.verified && (
              <div>
                <Label htmlFor="completionNote">Ghi chú giao hàng (tùy chọn)</Label>
                <Textarea
                  id="completionNote"
                  placeholder="Nhập ghi chú về việc giao hàng..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsVerifyDialogOpen(false);
                setVerifyResult(null);
              }}
            >
              Hủy
            </Button>
            {!verifyResult?.verified ? (
              <Button onClick={handleVerifyCustomer} disabled={verifying || !verifyPhone}>
                {verifying ? 'Đang xác thực...' : 'Xác thực'}
              </Button>
            ) : (
              <Button onClick={executeAction} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Hoàn thành giao hàng'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
