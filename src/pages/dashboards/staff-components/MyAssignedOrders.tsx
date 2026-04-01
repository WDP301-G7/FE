import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { orderService, Order } from '@/services/order.service';
import { productService, Product } from '@/services/product.service';
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
import { Search, ClipboardList, Eye, CheckCircle, Package, Play, UserCheck, Glasses, RefreshCw, Phone, FileText, Upload, X, MapPin, Calendar, DollarSign, User, Mail } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PrescriptionDetails } from './PrescriptionDetails';
import { motion } from 'framer-motion';
import { ModernImageUpload } from '@/components/dashboard/ModernImageUpload';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/StatusBadge';

// Helper function to get full image URL
const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiUrl.replace('/api', '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

export const MyAssignedOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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
  
  // Product images cache
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Verify customer state
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Complete with notes and images
  const [completionNote, setCompletionNote] = useState('');
  const [completionImages, setCompletionImages] = useState<File[]>([]);
  
  // Combined complete dialog
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [pagination.page, searchTerm, statusFilter]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && orders.length > 0) {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        setIsDetailDialogOpen(true);
        // Clear query param so it doesn't re-open on refresh
        setSearchParams({});
      }
    }
  }, [searchParams, orders, setSearchParams]);

  const loadOrders = async () => {
    console.log('\ud83d\udd04 loadOrders() CALLED - Loading all orders from API');
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
      // When specific status is selected, trust backend filtering
      // When ALL selected, apply client-side filter as backup
      let myOrders;
      
      if (statusFilter !== 'ALL') {
        // Trust backend when filtering by specific status
        // Show all orders returned (backend should have filtered by staff + status)
        console.log(`✅ Status filter "${statusFilter}" active - showing all ${data.items.length} orders from backend`);
        myOrders = data.items;
      } else {
        // For ALL orders, apply client-side filter to ensure only assigned orders show
        myOrders = data.items.filter((order: any) => {
          const assignedStaffId = order.handledBy || order.handler?.id || order.assignedStaffId || order.staffId;
          const isMyOrder = assignedStaffId === user?.id;
          
          console.log(`Order ${order.orderNumber}: handledBy=${assignedStaffId}, isMyOrder=${isMyOrder}, status=${order.status}`);
          
          return isMyOrder;
        });
        
        console.log('✅ Filtered to MY orders:', myOrders.length, 'orders');
      }
      
      setOrders(myOrders);
      setPagination(prev => ({ ...prev, total: myOrders.length }));
      
      // Preload product images for all orders
      await preloadProductImages(myOrders);
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
    
    // Load product images
    await loadProductImages(order);
    
    // Load prescription if it's a prescription order
    if (order.status !== 'NEW') {
      console.log('📋 Loading prescription for order:', order.id);
      await loadPrescription(order.id);
    }
  };

  const validatePhone = (phone: string): string => {
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/\s+/g, '');
    
    if (!cleanPhone) {
      return 'Vui lòng nhập số điện thoại';
    }
    
    // Vietnamese phone number: 10 digits, starts with 0
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0';
    }
    
    return '';
  };

  const handlePhoneChange = (value: string) => {
    setVerifyPhone(value);
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
    // Clear previous verification result
    if (verifyResult) {
      setVerifyResult(null);
    }
  };

  const handleAction = (order: Order, action: 'start' | 'ready' | 'complete') => {
    console.log('⚡ handleAction called:', { orderId: order.id, action });
    setSelectedOrder(order);
    setActionType(action);
    
    if (action === 'complete') {
      // For complete action, open combined dialog with order details + verification
      console.log('🔐 Opening combined complete dialog');
      setVerifyPhone('');
      setPhoneError('');
      setVerifyResult(null);
      setCompletionNote('');
      setCompletionImages([]);
      setPrescriptionData(null);
      setIsCompleteDialogOpen(true);
      // Load product images and prescription
      loadProductImages(order);
      loadPrescription(order.id);
    } else {
      console.log('✅ Opening confirm dialog for action:', action);
      setIsConfirmDialogOpen(true);
    }
  };

  const handleVerifyCustomer = async () => {
    if (!selectedOrder) return;
    
    // Validate phone inline
    const error = validatePhone(verifyPhone);
    if (error) {
      setPhoneError(error);
      return;
    }

    setVerifying(true);
    setPhoneError('');
    
    try {
      const result = await orderService.verifyCustomer(selectedOrder.id, verifyPhone);
      setVerifyResult(result);
      
      if (!result.verified) {
        // Show error inline instead of toast
        setPhoneError('Số điện thoại không khớp với đơn hàng');
      }
    } catch (error: any) {
      // Show error inline instead of toast
      setPhoneError(error.response?.data?.message || 'Không thể xác thực. Vui lòng thử lại');
    } finally {
      setVerifying(false);
    }
  };

  const loadPrescription = async (orderId: string) => {
    setLoadingPrescription(true);
    try {
      const data = await orderService.getOrderPrescription(orderId);
      console.log('📋 Raw prescription data from API:', data);
      console.log('📋 Prescription object keys:', data.prescription ? Object.keys(data.prescription) : 'No prescription object');
      console.log('📋 Full prescription object:', data.prescription);
      
      // Handle different response structures
      let prescriptionData = null;
      
      if (data && typeof data === 'object') {
        // Case 1: { prescription: {...} }
        if (data.prescription) {
          prescriptionData = data.prescription;
        }
        // Case 2: Direct prescription object with prescription fields
        else if (data.rightEyeSphere !== undefined || data.leftEyeSphere !== undefined || data.pupillaryDistance !== undefined ||
                 data.right_eye_sphere !== undefined || data.left_eye_sphere !== undefined || data.pupillary_distance !== undefined) {
          prescriptionData = data;
        }
        // Case 3: Nested in data field
        else if (data.data && typeof data.data === 'object') {
          prescriptionData = data.data.prescription || data.data;
        }
      }
      
      // Convert to flat structure that PrescriptionDetails component expects
      if (prescriptionData) {
        console.log('📋 Before normalization:', prescriptionData);
        const normalized: any = {};
        
        // Handle nested rightEye/leftEye objects (Backend format)
        if (prescriptionData.rightEye && typeof prescriptionData.rightEye === 'object') {
          const rightEye = prescriptionData.rightEye;
          normalized.rightEyeSphere = rightEye.sphere || rightEye.sph || rightEye.spherical;
          normalized.rightEyeCylinder = rightEye.cylinder || rightEye.cyl || rightEye.cylindrical;
          normalized.rightEyeAxis = rightEye.axis || rightEye.ax;
        } else {
          // Fallback to flat structure
          normalized.rightEyeSphere = prescriptionData.rightEyeSphere || prescriptionData.right_eye_sphere || 
                                       prescriptionData.rightSph || prescriptionData.odSph || prescriptionData.od_sph ||
                                       prescriptionData.sphereOd || prescriptionData.sphere_od;
          normalized.rightEyeCylinder = prescriptionData.rightEyeCylinder || prescriptionData.right_eye_cylinder || 
                                         prescriptionData.rightCyl || prescriptionData.odCyl || prescriptionData.od_cyl ||
                                         prescriptionData.cylinderOd || prescriptionData.cylinder_od;
          normalized.rightEyeAxis = prescriptionData.rightEyeAxis || prescriptionData.right_eye_axis || 
                                     prescriptionData.rightAxis || prescriptionData.odAxis || prescriptionData.od_axis ||
                                     prescriptionData.axisOd || prescriptionData.axis_od;
        }
        
        // Handle nested leftEye object (Backend format)
        if (prescriptionData.leftEye && typeof prescriptionData.leftEye === 'object') {
          const leftEye = prescriptionData.leftEye;
          normalized.leftEyeSphere = leftEye.sphere || leftEye.sph || leftEye.spherical;
          normalized.leftEyeCylinder = leftEye.cylinder || leftEye.cyl || leftEye.cylindrical;
          normalized.leftEyeAxis = leftEye.axis || leftEye.ax;
        } else {
          // Fallback to flat structure
          normalized.leftEyeSphere = prescriptionData.leftEyeSphere || prescriptionData.left_eye_sphere || 
                                      prescriptionData.leftSph || prescriptionData.osSph || prescriptionData.os_sph ||
                                      prescriptionData.sphereOs || prescriptionData.sphere_os;
          normalized.leftEyeCylinder = prescriptionData.leftEyeCylinder || prescriptionData.left_eye_cylinder || 
                                        prescriptionData.leftCyl || prescriptionData.osCyl || prescriptionData.os_cyl ||
                                        prescriptionData.cylinderOs || prescriptionData.cylinder_os;
          normalized.leftEyeAxis = prescriptionData.leftEyeAxis || prescriptionData.left_eye_axis || 
                                    prescriptionData.leftAxis || prescriptionData.osAxis || prescriptionData.os_axis ||
                                    prescriptionData.axisOs || prescriptionData.axis_os;
        }
        
        // Direct fields
        normalized.pupillaryDistance = prescriptionData.pupillaryDistance || prescriptionData.pupillary_distance || prescriptionData.pd;
        normalized.notes = prescriptionData.notes || prescriptionData.note;
        normalized.prescriptionImageUrl = prescriptionData.prescriptionImageUrl || prescriptionData.prescription_image_url || 
                                           prescriptionData.imageUrl || prescriptionData.image_url ||
                                           prescriptionData.prescriptionImage || prescriptionData.prescription_image;
        
        console.log('📋 After normalization:', normalized);
        prescriptionData = normalized;
      }
      
      console.log('📋 Final processed prescription data:', prescriptionData);
      setPrescriptionData(prescriptionData);
    } catch (error: any) {
      // Silently fail - not all orders have prescriptions
      console.log('ℹ️ No prescription found for order:', orderId);
      console.error('❌ Prescription load error:', error);
      setPrescriptionData(null);
    } finally {
      setLoadingPrescription(false);
    }
  };

  const loadProductImages = async (order: Order) => {
    const items = order.items || (order as any).orderItems || [];
    const newImageCache: Record<string, string> = {};
    
    try {
      // Fetch product details for all items to get images
      const productPromises = items.map(async (item: any) => {
        const productId = item.productId || item.product?.id;
        if (!productId) return;
        
        try {
          const product = await productService.getProduct(productId);
          if (product.images && product.images.length > 0) {
            // Store the first image URL for this product
            const firstImage = product.images[0];
            const imageUrl = firstImage.imageUrl || (firstImage as any).url;
            newImageCache[productId] = imageUrl;
          }
        } catch (err) {
          console.log('Failed to fetch product images for:', productId);
        }
      });
      
      await Promise.all(productPromises);
      setProductImages(prevCache => ({ ...prevCache, ...newImageCache }));
    } catch (error) {
      console.log('Error loading product images:', error);
    }
  };

  const preloadProductImages = async (orders: Order[]) => {
    console.log('🔄 Preloading product images for', orders.length, 'orders');
    const newImageCache: Record<string, string> = {};
    const uniqueProductIds = new Set<string>();
    
    // Collect all unique product IDs from all orders
    orders.forEach(order => {
      const items = order.items || (order as any).orderItems || [];
      items.forEach((item: any) => {
        const productId = item.productId || item.product?.id;
        if (productId) {
          uniqueProductIds.add(productId);
        }
      });
    });
    
    console.log('📦 Found', uniqueProductIds.size, 'unique products to fetch images for');
    
    try {
      // Fetch product details for all unique products
      const productPromises = Array.from(uniqueProductIds).map(async (productId) => {
        try {
          const product = await productService.getProduct(productId);
          if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            const imageUrl = firstImage.imageUrl || (firstImage as any).url;
            newImageCache[productId] = imageUrl;
          }
        } catch (err) {
          console.log('⚠️ Failed to fetch images for product:', productId);
        }
      });
      
      await Promise.all(productPromises);
      console.log('✅ Preloaded', Object.keys(newImageCache).length, 'product images');
      setProductImages(prevCache => ({ ...prevCache, ...newImageCache }));
    } catch (error) {
      console.log('❌ Error preloading product images:', error);
    }
  };

  const executeAction = async () => {
    if (!selectedOrder || !actionType) return;

    setActionLoading(true);
    console.log('\ud83d\udd04 Starting action execution (actionLoading=true, will NOT show table loading)');
    try {
      let result;
      let message = '';
      let newStatus: string | null = null;
      
      switch (actionType) {
        case 'start':
          result = await orderService.startProcessing(selectedOrder.id);
          message = 'Đã bắt đầu xử lý đơn hàng';
          newStatus = 'PROCESSING';
          break;
        case 'ready':
          result = await orderService.markReady(selectedOrder.id);
          message = 'Đã đánh dấu hoàn thành';
          newStatus = 'READY_FOR_PICKUP';
          break;
        case 'complete':
          if (completionNote) {
            result = await orderService.completeOrderWithNotes(selectedOrder.id, { completionNote });
          } else {
            result = await orderService.completeOrder(selectedOrder.id);
          }
          message = 'Đơn hàng đã hoàn tất';
          newStatus = 'COMPLETED';
          break;
      }
      
      toast({ title: 'Thành công', description: message });
      
      console.log('\u2705 Action completed successfully, updating local state only (NOT calling loadOrders)');
      
      // Update state instead of reloading
      if (actionType === 'complete') {
        console.log('\ud83d\uddd1\ufe0f Removing completed order from list:', selectedOrder.id);
        // Remove completed order from list
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      } else if (newStatus) {
        console.log('\ud83d\udd04 Updating order status to:', newStatus, 'for order:', selectedOrder.id);
        // Update status of the order
        setOrders(prev => prev.map(o => 
          o.id === selectedOrder.id ? { ...o, status: newStatus as any } : o
        ));
      }
      
      // Close all dialogs
      setIsConfirmDialogOpen(false);
      setIsVerifyDialogOpen(false);
      setIsCompleteDialogOpen(false);
      setSelectedOrder(null);
      setActionType(null);
      setVerifyResult(null);
      setCompletionNote('');
      setCompletionImages([]);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xử lý đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      console.log('✅ Action execution finished (actionLoading=false)');
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

  // Helper to get order number with fallback to ID
  const getOrderNumber = (order: any) => {
    return order.orderNumber || order.id || 'N/A';
  };

  const getStatusBadge = (status: string) => (
    <StatusBadge status={status} />
  );

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
            Đơn Hàng Được Giao
          </CardTitle>
          <CardDescription>Danh sách đơn hàng được giao cho bạn bởi nhóm vận hành</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="flex items-center mb-4 gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="CONFIRMED"> Đã xác nhận</SelectItem>
                  <SelectItem value="WAITING_CUSTOMER"> Chờ làm</SelectItem>
                  <SelectItem value="PROCESSING"> Đang làm</SelectItem>
                  <SelectItem value="READY"> Sẵn sàng</SelectItem>
                  <SelectItem value="COMPLETED"> Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED"> Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadOrders}
                disabled={loading}
                title="Làm mới danh sách"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Đang tải...</TableCell>
                  </TableRow>
                ) : !orders || orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Không có đơn hàng nào được giao cho bạn</TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{getOrderNumber(order)}</TableCell>
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
              Hiển thị {orders?.length || 0} trong tổng số {pagination.total} đơn hàng
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Tiếp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog - Modernized */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Chi tiết đơn hàng</DialogTitle>
            <DialogDescription>
              Đơn hàng #{selectedOrder?.orderNumber || selectedOrder?.id || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {selectedOrder && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Thông tin đơn
                  </TabsTrigger>
                  <TabsTrigger value="prescription" className="gap-2">
                    <Glasses className="h-4 w-4" />
                    Đơn thuốc
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-6 h-[600px]">
                  {/* Customer Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Thông tin khách hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Họ tên</p>
                            <p className="font-medium">{getCustomerInfo(selectedOrder).name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Số điện thoại</p>
                            <p className="font-medium">{getCustomerInfo(selectedOrder).phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{getCustomerInfo(selectedOrder).email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                            <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Products Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Sản phẩm
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-20">Hình</TableHead>
                              <TableHead>Sản phẩm</TableHead>
                              <TableHead className="text-center">SL</TableHead>
                              <TableHead className="text-right">Giá</TableHead>
                              <TableHead className="text-right">Tổng</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedOrder.items || (selectedOrder as any).orderItems || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                  Không có sản phẩm nào trong đơn hàng
                                </TableCell>
                              </TableRow>
                            ) : (
                              (selectedOrder.items || (selectedOrder as any).orderItems || []).map((item: any, index: number) => {
                                // Debug: Log item structure to find correct image field
                                if (index === 0) {
                                  console.log('🖼️ Item structure for images:');
                                  console.log('📦 Full item object:', item);
                                  console.log('🔑 Item keys:', Object.keys(item));
                                  if (item.product) {
                                    console.log('🏷️ Product object:', item.product);
                                    console.log('🔑 Product keys:', Object.keys(item.product));
                                  }
                                  console.log('🖼️ Available image fields:', {
                                    'item.image': item.image,
                                    'item.imageUrl': item.imageUrl,
                                    'item.productImage': item.productImage,
                                    'item.product?.image': item.product?.image,
                                    'item.product?.imageUrl': item.product?.imageUrl,
                                    'item.product?.images': item.product?.images,
                                  });
                                  console.log('💾 Cached product images:', productImages);
                                }
                                
                                // Get image URL from cache or product.images array
                                const productId = item.productId || item.product?.id;
                                let imageUrl = '';
                                
                                // Priority 1: Use cached image from productImages state
                                if (productId && productImages[productId]) {
                                  imageUrl = getFullImageUrl(productImages[productId]);
                                }
                                // Priority 2: Try product.images array (if backend includes it)
                                else if (item.product?.images && item.product.images.length > 0) {
                                  const firstImage = item.product.images[0];
                                  imageUrl = getFullImageUrl(
                                    firstImage?.url || firstImage?.imageUrl || ''
                                  );
                                }
                                // Priority 3: Fallback to other possible fields
                                else {
                                  imageUrl = getFullImageUrl(
                                    item.image || item.imageUrl || item.productImage || item.product?.image || item.product?.imageUrl || ''
                                  );
                                }
                                
                                return (
                                  <TableRow key={item.id || index}>
                                    <TableCell>
                                      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                        {imageUrl ? (
                                          <img 
                                            src={imageUrl} 
                                            alt={item.productName || item.product?.name || 'Product'} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              console.log('❌ Image load error for:', imageUrl);
                                              (e.target as HTMLImageElement).style.display = 'none';
                                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-xs text-muted-foreground">No img</div>';
                                            }}
                                          />
                                        ) : (
                                          <Package className="h-6 w-6 text-muted-foreground" />
                                        )}
                                      </div>
                                    </TableCell>
                                  <TableCell className="font-medium">{item.productName || item.product?.name || 'N/A'}</TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.price || item.unitPrice || 0)}</TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(item.subtotal || (item.quantity * (item.price || item.unitPrice || 0)))}</TableCell>
                                </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Tổng cộng</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(selectedOrder.totalAmount || 0)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Thời gian
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Ngày tạo:</span>
                        <span className="font-medium text-foreground">
                          {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="prescription" className="mt-6">
                  {loadingPrescription ? (
                    <div className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Đang tải thông tin đơn thuốc...</p>
                    </div>
                  ) : prescriptionData ? (
                    <PrescriptionDetails prescription={prescriptionData} />
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Glasses className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Đơn hàng này không có đơn thuốc</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Combined Complete Order Dialog - View + Verification + Completion */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Hoàn tất xử lý yêu cầu</DialogTitle>
            <DialogDescription>
              Xác nhận đã nhận hàng từ khách và hoàn tất xử lý đơn hàng #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {selectedOrder && (
              <div className="space-y-6 py-2">
                {/* Order Information Section */}
                <Card className="border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Thông tin đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Khách hàng</p>
                          <p className="font-medium truncate">{getCustomerInfo(selectedOrder).name}</p>
                          <p className="text-sm text-muted-foreground truncate">{getCustomerInfo(selectedOrder).phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tổng tiền</p>
                          <p className="font-bold text-lg text-primary">{formatCurrency(selectedOrder.totalAmount || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ngày tạo</p>
                          <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Products Table */}
                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Sản phẩm
                      </p>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="w-16">Hình</TableHead>
                              <TableHead>Sản phẩm</TableHead>
                              <TableHead className="text-center w-20">SL</TableHead>
                              <TableHead className="text-right">Giá</TableHead>
                              <TableHead className="text-right w-32">Tổng</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedOrder.items || (selectedOrder as any).orderItems || []).map((item: any, index: number) => {
                              // Get image URL from cache or product.images array
                              const productId = item.productId || item.product?.id;
                              let imageUrl = '';
                              
                              // Priority 1: Use cached image from productImages state
                              if (productId && productImages[productId]) {
                                imageUrl = getFullImageUrl(productImages[productId]);
                              }
                              // Priority 2: Try product.images array (if backend includes it)
                              else if (item.product?.images && item.product.images.length > 0) {
                                const firstImage = item.product.images[0];
                                imageUrl = getFullImageUrl(
                                  firstImage?.url || firstImage?.imageUrl || ''
                                );
                              }
                              // Priority 3: Fallback to other possible fields
                              else {
                                imageUrl = getFullImageUrl(
                                  item.image || item.imageUrl || item.productImage || item.product?.image || item.product?.imageUrl || ''
                                );
                              }
                              
                              return (
                                <TableRow key={item.id || index}>
                                  <TableCell>
                                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                      {imageUrl ? (
                                        <img 
                                          src={imageUrl} 
                                          alt={item.productName || item.product?.name || 'Product'} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-xs text-muted-foreground">No img</div>';
                                          }}
                                        />
                                      ) : (
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </TableCell>
                                <TableCell>{item.productName || item.product?.name || 'N/A'}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(item.price || item.unitPrice || 0)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(item.subtotal || (item.quantity * (item.price || item.unitPrice || 0)))}</TableCell>
                              </TableRow>
                              );
                            })
                          }
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Prescription if available */}
                    {prescriptionData && (
                      <>
                        <Separator />
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Glasses className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Đơi sản phẩm</p>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Đơn hàng có kèm theo đơn thuốc/yêu cầu đặc biệt
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Separator className="my-6" />

                {/* Verification Section */}
                <Card className={verifyResult?.verified ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10' : ''}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Xác thực khách hàng
                    </CardTitle>
                    <CardDescription>
                      {verifyResult?.verified 
                        ? '✅ Đã xác thực thành công' 
                        : 'Nhập số điện thoại của khách để xác thực trước khi hoàn tất'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!verifyResult?.verified ? (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label htmlFor="complete-phone" className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Số điện thoại khách hàng *
                            </Label>
                            <Input
                              id="complete-phone"
                              type="tel"
                              placeholder="Ví dụ: 0912345678"
                              value={verifyPhone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              disabled={verifying}
                              className={`mt-1.5 ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {phoneError && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{phoneError}</span>
                              </p>
                            )}
                          </div>
                          <div className="flex items-end">
                            <Button 
                              onClick={handleVerifyCustomer} 
                              disabled={verifying || !verifyPhone}
                              className="gap-2"
                            >
                              {verifying ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Đang xác thực...
                                </>) : (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Xác thực
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-green-900 dark:text-green-100 mb-2">Xác thực thành công</p>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-green-700 dark:text-green-300" />
                                <span className="text-green-800 dark:text-green-200">
                                  <strong>Khách hàng:</strong> {verifyResult.customer.fullName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-green-700 dark:text-green-300" />
                                <span className="text-green-800 dark:text-green-200">
                                  <strong>Email:</strong> {verifyResult.customer.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Completion Details Section - Only show after verification */}
                {verifyResult?.verified && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Ghi chú (tùy chọn)
                      </CardTitle>
                      <CardDescription>
                        Nhập ghi chú về việc giao hàng hoặc bất kỳ thông tin bổ sung nào
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="completion-note" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Ghi chú giao hàng (tùy chọn)
                        </Label>
                        <Textarea
                          id="completion-note"
                          placeholder="Nhập ghi chú về quá trình xử lý yêu cầu..."
                          value={completionNote}
                          onChange={(e) => setCompletionNote(e.target.value)}
                          rows={3}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 mb-3">
                          <Upload className="h-4 w-4" />
                          Upload ảnh nhận hàng (tùy chọn)
                        </Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          0/5 ảnh • JPG/PNG • Tối đa 5MB/ảnh
                        </p>
                        <ModernImageUpload
                          images={completionImages}
                          onImagesChange={setCompletionImages}
                          maxImages={5}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCompleteDialogOpen(false);
                setVerifyResult(null);
                setVerifyPhone('');
                setCompletionNote('');
                setCompletionImages([]);
              }}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={executeAction} 
              disabled={actionLoading || !verifyResult?.verified}
              className="gap-2 min-w-[160px]"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Hoàn tất giao hàng
                </>
              )}
            </Button>
          </DialogFooter>
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
