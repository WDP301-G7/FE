import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { returnService, ReturnRequest } from '@/services/return.service';
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

export const ReturnManagement: React.FC = () => {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Complete form state
  const [uploadImages, setUploadImages] = useState<File[]>([]);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER' | 'CASH'>('CASH');
  const [completionNote, setCompletionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReturns();
  }, [pagination.page, typeFilter]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await returnService.getApprovedReturns({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
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

  const handleViewDetails = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest);
    setIsDetailDialogOpen(true);
  };

  const handleOpenComplete = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest);
    
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
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteReturn = async () => {
    if (!selectedReturn) return;

    // Validate for RETURN type
    if (selectedReturn.type === 'RETURN') {
      if (!refundAmount || parseFloat(refundAmount) <= 0) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng nhập số tiền hoàn',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Validate for EXCHANGE type
    if (selectedReturn.type === 'EXCHANGE') {
      if (!refundAmount) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tính toán chênh lệch giá',
          variant: 'destructive',
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Upload images first if any
      if (uploadImages.length > 0) {
        await returnService.uploadReturnImages(selectedReturn.id, uploadImages);
      }

      // Complete the return
      const amount = parseFloat(refundAmount);
      await returnService.completeReturn(selectedReturn.id, {
        refundAmount: selectedReturn.type === 'RETURN' || (selectedReturn.type === 'EXCHANGE' && amount < 0) 
          ? Math.abs(amount) 
          : undefined,
        refundMethod: selectedReturn.type === 'RETURN' || (selectedReturn.type === 'EXCHANGE' && amount < 0)
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
            <CardDescription>Xử lý các yêu cầu đổi/trả đã được phê duyệt</CardDescription>
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
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
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Đang tải...</TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Không có yêu cầu nào</TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenComplete(returnRequest)}
                            title="Hoàn tất xử lý"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
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
                        .map((item: any, index: number) => (
                        <div key={item.id || index} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                          {item.product?.images && item.product.images[0] && (
                            <img
                              src={item.product.images[0].imageUrl}
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{item.product?.name || 'N/A'}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>SL: {item.quantity}</span>
                              <span>•</span>
                              <span>Tình trạng: {item.condition || 'N/A'}</span>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {item.product?.price ? formatCurrency(parseFloat(item.product.price)) : 'N/A'}
                            </p>
                          </div>
                          {item.exchangeProduct && (
                            <>
                              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex items-center gap-3">
                                {item.exchangeProduct.images && item.exchangeProduct.images[0] && (
                                  <img
                                    src={item.exchangeProduct.images[0].imageUrl}
                                    alt={item.exchangeProduct.name}
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-sm">{item.exchangeProduct.name}</p>
                                  <p className="text-sm text-primary font-semibold">
                                    {formatCurrency(parseFloat(item.exchangeProduct.price))}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
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
                                ? '💰 Khách cần thanh toán thêm' 
                                : '🔄 Khách dự kiến sẽ được hoàn lại'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Images Card */}
                {selectedReturn.images && selectedReturn.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Hình ảnh chứng minh từ khách hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImageGallery images={selectedReturn.images.filter(img => img.imageType === 'CUSTOMER_PROOF')} />
                    </CardContent>
                  </Card>
                )}
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
                        <Label htmlFor="refundAmount" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Số tiền hoàn *
                        </Label>
                        <Input
                          id="refundAmount"
                          type="number"
                          placeholder="Nhập số tiền hoàn"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          disabled={submitting}
                          className="mt-1.5"
                        />
                        {selectedReturn.refundAmount && (
                          <p className="text-sm text-muted-foreground mt-1.5">
                            💡 Đề xuất: <span className="font-medium text-foreground">{formatCurrency(selectedReturn.refundAmount)}</span>
                          </p>
                        )}
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
                        Giá dự kiến chênh lệch khi đổi hàng
                      </CardTitle>
                      <CardDescription>
                        {parseFloat(refundAmount) < 0 && '✓ Không có chênh lệch'}
                        {parseFloat(refundAmount) === 0 && '✓ Khách được hoàn lại'}
                        {parseFloat(refundAmount) > 0 && 'Khách cần thanh toán thêm'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
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
                          <p className="text-sm text-muted-foreground mt-2">
                            {parseFloat(refundAmount) < 0 
                              ? '🔄 Hoàn tiền cho khách hàng' 
                              : parseFloat(refundAmount) > 0 
                              ? '💰 Khách cần thanh toán thêm'
                              : '✓ Không có chênh lệch'}
                          </p>
                        </div>
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
                  
                      {parseFloat(refundAmount) > 0 && (
                        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10">
                          <CardContent className="pt-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span>Xác nhận đã thu thêm {formatCurrency(parseFloat(refundAmount))} từ khách hàng</span>
                            </p>
                          </CardContent>
                        </Card>
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
