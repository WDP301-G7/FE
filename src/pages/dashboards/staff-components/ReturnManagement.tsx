import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { returnService, ReturnRequest } from '@/services/return.service';
import { productService } from '@/services/product.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Search, RefreshCw, Eye, CheckCircle, Package2, AlertCircle, User, Phone, Mail, Calendar, FileText, Upload, DollarSign, ArrowRight, ImageIcon } from 'lucide-react';
import { ImageUploader, ImageGallery } from '@/components/ImageUploader';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

// Helper function to get full image URL
const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiUrl.replace('/api', '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

// Helper function to format number with thousand separators
const formatNumberInput = (value: string): string => {
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  // Add thousand separators
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function to parse formatted number back to plain number
const parseFormattedNumber = (value: string): string => {
  return value.replace(/,/g, '');
};

export const ReturnManagement: React.FC = () => {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Product images cache
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Complete form state
  const [uploadImages, setUploadImages] = useState<File[]>([]);
  const [refundAmount, setRefundAmount] = useState(''); // Suggested/calculated amount
  const [finalAmount, setFinalAmount] = useState(''); // Actual transaction amount
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER' | 'CASH'>('CASH');
  const [completionNote, setCompletionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReturns();
  }, [pagination.page, typeFilter, statusFilter]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await returnService.getReturns({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      console.log('✅ Return data from API:', data);
      console.log('📊 Returns array:', data?.data);
      
      // Debug first return request structure
      if (data?.data && data.data.length > 0) {
        console.log('🔍 First return request:', data.data[0]);
        console.log('🔍 Order field:', data.data[0].order);
        console.log('🔍 OrderId field:', data.data[0].orderId);
        console.log('🔍 ReturnItems field:', data.data[0].returnItems);
        console.log('🔍 Items field:', data.data[0].items);
        console.log('🔍 All keys:', Object.keys(data.data[0]));
      }
      
      setReturns(data?.data || []);
      setPagination(prev => ({ ...prev, total: data?.pagination?.total || 0 }));
    } catch (error: any) {
      console.error('❌ Error loading returns:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách đổi/trả',
        variant: 'destructive',
      });
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest);
    setIsDetailDialogOpen(true);
    
    // Load product images for return items
    await loadReturnProductImages(returnRequest);
  };

  const handleOpenComplete = async (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest);
    
    // Load product images for return items
    await loadReturnProductImages(returnRequest);
    
    // Pre-fill refund amount for RETURN type
    if (returnRequest.type === 'RETURN' && returnRequest.refundAmount) {
      setRefundAmount(returnRequest.refundAmount.toString());
    } else if (returnRequest.type === 'EXCHANGE') {
      // Calculate price difference for EXCHANGE
      let totalPriceDiff = 0;
      const items = getReturnItems(returnRequest);
      
      items.forEach((item: any) => {
        if (item.product && item.exchangeProduct) {
          const originalPrice = parseFloat(item.product.price) * item.quantity;
          const exchangePrice = parseFloat(item.exchangeProduct.price) * item.quantity;
          const diff = exchangePrice - originalPrice;
          totalPriceDiff += diff;
        }
      });
      
      // If price difference is negative (customer exchanging for cheaper), they get refund
      // If positive, they need to pay more
      if (totalPriceDiff < 0) {
        setRefundAmount(Math.abs(totalPriceDiff).toString());
      } else {
        setRefundAmount(totalPriceDiff.toString());
      }
    } else {
      setRefundAmount('');
    }
    
    setRefundMethod('CASH');
    setCompletionNote('');
    setUploadImages([]);
    setFinalAmount(''); // Reset final amount
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteReturn = async () => {
    if (!selectedReturn) return;

    // Validate final amount is provided
    if (!finalAmount || finalAmount.trim() === '') {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập số tiền thực tế',
        variant: 'destructive',
      });
      return;
    }

    const finalAmountValue = parseFloat(finalAmount);
    if (isNaN(finalAmountValue) || finalAmountValue < 0) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền không hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Upload images first if any
      if (uploadImages.length > 0) {
        await returnService.uploadReturnImages(selectedReturn.id, uploadImages);
      }

      // Complete the return
      const finalAmountValue = parseFloat(finalAmount);
      const calculatedAmount = parseFloat(refundAmount || '0');
      
      await returnService.completeReturn(selectedReturn.id, {
        finalAmount: finalAmountValue,
        refundAmount: selectedReturn.type === 'RETURN' || (selectedReturn.type === 'EXCHANGE' && calculatedAmount < 0) 
          ? finalAmountValue 
          : undefined,
        refundMethod: selectedReturn.type === 'RETURN' || (selectedReturn.type === 'EXCHANGE' && calculatedAmount < 0)
          ? refundMethod 
          : undefined,
        completionNote: completionNote || undefined,
      });

      toast({
        title: 'Thành công',
        description: 'Đã hoàn tất xử lý yêu cầu đổi/trả',
      });

      setIsCompleteDialogOpen(false);
      
      // Remove the completed return from the list instead of reloading all
      setReturns(prev => prev.filter(r => r.id !== selectedReturn.id));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      
      setSelectedReturn(null);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể hoàn tất yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Load product images for return request items
  const loadReturnProductImages = async (returnRequest: ReturnRequest) => {
    const items = getReturnItems(returnRequest);
    const newImageCache: Record<string, string> = {};
    
    try {
      const productIds = new Set<string>();
      
      // Collect all product IDs (original and exchange products)
      items.forEach((item: any) => {
        if (item.product?.id || item.productId) {
          productIds.add(item.product?.id || item.productId);
        }
        if (item.exchangeProduct?.id) {
          productIds.add(item.exchangeProduct.id);
        }
      });
      
      // Fetch product details for all products
      const productPromises = Array.from(productIds).map(async (productId) => {
        try {
          const product = await productService.getProduct(productId);
          if (product.images && product.images.length > 0) {
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
      console.log('🖼️ Loaded product images:', newImageCache);
    } catch (error) {
      console.log('Error loading product images:', error);
    }
  };

  // Helper function to get order number from different possible fields
  const getOrderNumber = (returnRequest: any) => {
    return returnRequest.order?.orderNumber || 
           returnRequest.orderNumber || 
           returnRequest.orderId || 
           'N/A';
  };

  // Helper function to get return items from different possible fields
  const getReturnItems = (returnRequest: any) => {
    return returnRequest.returnItems || 
           returnRequest.items || 
           [];
  };

  const getTypeBadge = (type: string) => {
    const config = {
      RETURN: { label: 'Trả hàng', icon: '💰', class: 'bg-green-100 text-green-800' },
      EXCHANGE: { label: 'Đổi hàng', icon: '🔄', class: 'bg-blue-100 text-blue-800' },
      WARRANTY: { label: 'Bảo hành', icon: '🛡️', class: 'bg-purple-100 text-purple-800' },
    };
    const item = config[type as keyof typeof config] || config.RETURN;
    return (
      <Badge variant="outline" className={item.class}>
        <span className="mr-1">{item.icon}</span>
        {item.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Quản Lý Đổi/Trả Hàng
            </CardTitle>
            <CardDescription>Xử lý các yêu cầu đổi/trả và xem lịch sử hoàn thành</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div 
              className="flex justify-between items-center mb-4 gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Input
                  placeholder="Tìm theo mã đơn hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={loadReturns}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                    <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả loại</SelectItem>
                  <SelectItem value="RETURN">Trả hàng</SelectItem>
                  <SelectItem value="EXCHANGE">Đổi hàng</SelectItem>
                  <SelectItem value="WARRANTY">Bảo hành</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={loadReturns}
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
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Đang tải...</TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Không có yêu cầu nào</TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnRequest, index) => (
                    <motion.tr 
                      key={returnRequest.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{getOrderNumber(returnRequest)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{returnRequest.customer?.fullName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{returnRequest.customer?.phone || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(returnRequest.type)}</TableCell>
                      <TableCell>
                        {returnRequest.status === 'APPROVED' ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Đã phê duyệt</Badge>
                        ) : returnRequest.status === 'COMPLETED' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Đã hoàn thành</Badge>
                        ) : (
                          <Badge variant="outline">{returnRequest.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getReturnItems(returnRequest)
                            .filter((item: any) => item && item.product)
                            .map((item: any) => item.product?.name || 'N/A')
                            .join(', ') || 'Không có sản phẩm'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(returnRequest.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(returnRequest)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {returnRequest.status === 'APPROVED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenComplete(returnRequest)}
                              title="Hoàn tất xử lý"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>

          {/* Pagination */}
          <motion.div 
            className="flex justify-between items-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="text-sm text-muted-foreground">
              Hiển thị {returns.length} / {pagination.total} yêu cầu
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
                Sau
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Detail Dialog - Modernized */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Chi tiết yêu cầu của đổi/trả</DialogTitle>
            <DialogDescription>
              Mã đơn hàng: {selectedReturn && getOrderNumber(selectedReturn)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {selectedReturn && (
              <div className="space-y-6 py-2">
                {/* Order Info Card */}
                <Card className="border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package2 className="h-5 w-5 text-primary" />
                      Thông tin đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Package2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                          <p className="font-medium">{getOrderNumber(selectedReturn)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loại yêu cầu</p>
                          <div className="mt-1">{getTypeBadge(selectedReturn.type)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                          <p className="font-medium">{selectedReturn.customer?.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium">{selectedReturn.customer?.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedReturn.customer?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày tạo</p>
                          <p className="font-medium">{formatDate(selectedReturn.createdAt)}</p>
                          {selectedReturn.approvedAt && (
                            <>
                              <p className="text-sm text-muted-foreground mt-2">Ngày duyệt</p>
                              <p className="font-medium">{formatDate(selectedReturn.approvedAt)}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reason Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Lý do
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{selectedReturn.reason}</p>
                    </div>
                    {selectedReturn.description && (
                      <>
                        <Label className="mt-4 block">Mô tả chi tiết</Label>
                        <div className="p-3 bg-muted rounded-lg mt-2">
                          <p className="text-sm">{selectedReturn.description}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Products Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package2 className="h-5 w-5" />
                      Sản phẩm yêu cầu đổi/trả
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getReturnItems(selectedReturn)
                        .filter((item: any) => item && item.product)
                        .map((item: any, index: number) => {
                          // Get image URLs from cache
                          const productId = item.product?.id || item.productId;
                          const exchangeProductId = item.exchangeProduct?.id;
                          
                          let productImageUrl = '';
                          if (productId && productImages[productId]) {
                            productImageUrl = getFullImageUrl(productImages[productId]);
                          }
                          
                          let exchangeImageUrl = '';
                          if (exchangeProductId && productImages[exchangeProductId]) {
                            exchangeImageUrl = getFullImageUrl(productImages[exchangeProductId]);
                          }
                          
                          return (
                            <div key={item.id || index} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                              {/* Original Product */}
                              <div className="flex items-center gap-3 flex-1">
                                {/* Product Image */}
                                <div className="w-20 h-20 rounded border bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  {productImageUrl ? (
                                    <img
                                      src={productImageUrl}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>';
                                      }}
                                    />
                                  ) : (
                                    <Package2 className="h-10 w-10 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold">{item.product?.name || 'N/A'}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span>SL: {item.quantity || 1}</span>
                                    <span>•</span>
                                    <span>Tình trạng: {item.condition || 'N/A'}</span>
                                  </div>
                                  <p className="text-sm font-medium mt-1">
                                    {item.product?.price ? formatCurrency(parseFloat(item.product.price)) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Arrow - Only show for EXCHANGE */}
                              {item.exchangeProduct && (
                                <div className="flex items-center justify-center px-2">
                                  <ArrowRight className="h-6 w-6 text-primary flex-shrink-0" />
                                </div>
                              )}
                              
                              {/* Exchange Product - Only show for EXCHANGE */}
                              {item.exchangeProduct && (
                                <div className="flex items-center gap-3 flex-1">
                                  {/* Exchange Product Image */}
                                  <div className="w-20 h-20 rounded border bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    {exchangeImageUrl ? (
                                      <img
                                        src={exchangeImageUrl}
                                        alt={item.exchangeProduct.name}
                                        className="w-full h-full object-cover rounded"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>';
                                        }}
                                      />
                                    ) : (
                                      <Package2 className="h-10 w-10 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-primary">{item.exchangeProduct.name}</p>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                      <span>SL: {item.quantity || 1}</span>
                                    </div>
                                    <p className="text-sm text-primary font-semibold mt-1">
                                      {formatCurrency(parseFloat(item.exchangeProduct.price))}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                {/* Refund/Price Difference Card */}
                {selectedReturn.type === 'RETURN' && selectedReturn.refundAmount && (
                  <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/10">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm text-muted-foreground">Số tiền hoàn</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(selectedReturn.refundAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedReturn.type === 'EXCHANGE' && selectedReturn.priceDifference !== undefined && (
                  <Card className={selectedReturn.priceDifference > 0 ? 'border-orange-500/50 bg-orange-50/50' : 'border-green-500/50 bg-green-50/50'}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className={`h-5 w-5 ${selectedReturn.priceDifference > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                          <div>
                            <p className="text-sm text-muted-foreground">Giá dự kiến chênh lệch khi đổi hàng</p>
                            <p className={`text-2xl font-bold ${selectedReturn.priceDifference > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                              {selectedReturn.priceDifference > 0 ? '+' : ''}{formatCurrency(selectedReturn.priceDifference)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedReturn.priceDifference > 0 
                                ? '💰 Giá dự kiến mà khách cần thanh toán thêm' 
                                : '🔄 Khách dự kiến sẽ được hoàn lại'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Images Card */}                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Hình ảnh chứng minh từ khách hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const customerImages = selectedReturn.images?.filter(
                        img => img.imageType === 'CUSTOMER_PRODUCT' || img.imageType === 'CUSTOMER_DEFECT'
                      ) || [];
                      
                      if (customerImages.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Khách hàng không cung cấp hình ảnh</p>
                          </div>
                        );
                      }
                      
                      return <ImageGallery images={customerImages} />;
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog - Modernized */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Hoàn tất xử lý yêu cầu</DialogTitle>
            <DialogDescription>
              Xác nhận đã nhận hàng từ khách và hoàn tất xử lý
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {selectedReturn && (
              <div className="space-y-6 py-2">
                {/* Return Type Info */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Package2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {selectedReturn.type === 'RETURN' && '🔙 Trả hàng hoàn tiền'}
                          {selectedReturn.type === 'EXCHANGE' && '🔄 Đổi sản phẩm'}
                          {selectedReturn.type === 'WARRANTY' && '🛠️ Bảo hành'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Đơn hàng: <span className="font-medium text-foreground">{getOrderNumber(selectedReturn)}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Refund Section for RETURN */}
                {selectedReturn.type === 'RETURN' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Thông tin hoàn tiền
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Số tiền hoàn dự kiến
                        </Label>
                        <div className="mt-1.5 p-3 border rounded-lg bg-muted/30">
                          <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(parseFloat(refundAmount || '0'))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 Số tiền được tính tự động
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="finalAmount" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          Số tiền thực tế hoàn lại cho khách *
                        </Label>
                        <Input
                          id="finalAmount"
                          type="text"
                          placeholder="Nhập số tiền thực tế đã hoàn lại"
                          value={formatNumberInput(finalAmount)}
                          onChange={(e) => {
                            const parsed = parseFormattedNumber(e.target.value);
                            setFinalAmount(parsed);
                          }}
                          disabled={submitting}
                          className="mt-1.5 border-orange-500/50 focus:border-orange-500"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          ⚠️ Nhập số tiền thực tế đã hoàn lại cho khách hàng (có thể khác với số tiền dự kiến)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="refundMethod" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Phương thức hoàn tiền *
                        </Label>
                        <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)} disabled={submitting}>
                          <SelectTrigger id="refundMethod" className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">💵 Tiền mặt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Price Difference Section for EXCHANGE */}
                {selectedReturn.type === 'EXCHANGE' && (
                  <Card className={`${
                    parseFloat(refundAmount) < 0 
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10' 
                      : parseFloat(refundAmount) > 0 
                      ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/10' 
                      : 'border-muted'
                  }`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Chênh lệch giá khi đổi hàng
                      </CardTitle>
                      <CardDescription>
                        {parseFloat(refundAmount) < 0 && 'Khách được hoàn lại'}
                        {parseFloat(refundAmount) === 0 && '✓ Không có chênh lệch'}
                        {parseFloat(refundAmount) > 0 && 'Khách cần thanh toán thêm'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between p-4 mt-1.5 border rounded-lg bg-card">
                          <div>
                            <p className={`text-3xl font-bold ${
                              parseFloat(refundAmount) < 0 
                                ? 'text-green-700 dark:text-green-400' 
                                : parseFloat(refundAmount) > 0 
                                ? 'text-orange-700 dark:text-orange-400' 
                                : 'text-muted-foreground'
                            }`}>
                              {parseFloat(refundAmount) < 0 ? '-' : parseFloat(refundAmount) > 0 ? '+' : ''}
                              {formatCurrency(Math.abs(parseFloat(refundAmount) || 0))}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {parseFloat(refundAmount) < 0 
                                ? '🔄 Hoàn tiền cho khách hàng' 
                                : parseFloat(refundAmount) > 0 
                                ? '💰 Giá dự kiến mà khách cần thanh toán thêm'
                                : '✓ Không có chênh lệch'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="finalAmount" className="flex items-center gap-2">
                          <DollarSign className={`h-4 w-4 ${parseFloat(refundAmount) < 0 ? 'text-green-500' : 'text-orange-500'}`} />
                          {parseFloat(refundAmount) < 0 
                            ? 'Số tiền thực tế hoàn lại cho khách *' 
                            : parseFloat(refundAmount) > 0
                            ? 'Số tiền thực tế khách cần thanh toán thêm *'
                            : 'Số tiền thực tế *'}
                        </Label>
                        <Input
                          id="finalAmount"
                          type="text"
                          placeholder={
                            parseFloat(refundAmount) < 0 
                              ? 'Nhập số tiền thực tế đã hoàn lại' 
                              : parseFloat(refundAmount) > 0
                              ? 'Nhập số tiền thực tế khách đã thanh toán thêm'
                              : 'Nhập số tiền thực tế'
                          }
                          value={formatNumberInput(finalAmount)}
                          onChange={(e) => {
                            const parsed = parseFormattedNumber(e.target.value);
                            setFinalAmount(parsed);
                          }}
                          disabled={submitting}
                          className={`mt-1.5 ${parseFloat(refundAmount) < 0 ? 'border-green-500/50 focus:border-green-500' : parseFloat(refundAmount) > 0 ? 'border-orange-500/50 focus:border-orange-500' : ''}`}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          ⚠️ Nhập số tiền thực tế (có thể khác với số tiền dự kiến do làm tròn, thương lượng, v.v.)
                        </p>
                      </div>
                  
                      {parseFloat(refundAmount) < 0 && (
                        <div>
                          <Label htmlFor="refundMethod" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Phương thức hoàn tiền *
                          </Label>
                          <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)} disabled={submitting}>
                            <SelectTrigger id="refundMethod" className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">💵 Tiền mặt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Ghi chú và hình ảnh
                    </CardTitle>
                    <CardDescription>
                      Thêm ghi chú và upload ảnh xác nhận đã nhận hàng
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="completionNote" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ghi chú (tùy chọn)
                      </Label>
                      <Textarea
                        id="completionNote"
                        placeholder="Nhập ghi chú về quá trình xử lý yêu cầu..."
                        value={completionNote}
                        onChange={(e) => setCompletionNote(e.target.value)}
                        rows={3}
                        disabled={submitting}
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
                      <ImageUploader
                        images={uploadImages}
                        onChange={setUploadImages}
                        maxImages={5}
                        disabled={submitting}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsCompleteDialogOpen(false)} 
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleCompleteReturn} 
              disabled={submitting}
              className="gap-2 min-w-[140px]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Hoàn tất
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
