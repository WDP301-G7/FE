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
import { Search, RefreshCw, Eye, CheckCircle, Package2, AlertCircle } from 'lucide-react';
import { ImageUploader, ImageGallery } from '@/components/ImageUploader';
import { motion } from 'framer-motion';

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
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
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
      setReturns(data?.data || []);
      setPagination(prev => ({ ...prev, total: data?.pagination?.total || 0 }));
    } catch (error: any) {
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
    } else {
      setRefundAmount('');
    }
    
    setRefundMethod('BANK_TRANSFER');
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

    setSubmitting(true);
    try {
      // Upload images first if any
      if (uploadImages.length > 0) {
        await returnService.uploadReturnImages(selectedReturn.id, uploadImages);
      }

      // Complete the return
      await returnService.completeReturn(selectedReturn.id, {
        refundAmount: selectedReturn.type === 'RETURN' ? parseFloat(refundAmount) : undefined,
        refundMethod: selectedReturn.type === 'RETURN' ? refundMethod : undefined,
        completionNote: completionNote || undefined,
      });

      toast({
        title: 'Thành công',
        description: 'Đã hoàn tất xử lý yêu cầu đổi/trả',
      });

      setIsCompleteDialogOpen(false);
      setSelectedReturn(null);
      loadReturns();
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
                      <TableCell className="font-medium">{returnRequest.order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{returnRequest.customer?.fullName}</div>
                          <div className="text-sm text-muted-foreground">{returnRequest.customer?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(returnRequest.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {returnRequest.returnItems.map(item => item.product.name).join(', ')}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu đổi/trả</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã đơn hàng</Label>
                  <p className="font-medium">{selectedReturn.order.orderNumber}</p>
                </div>
                <div>
                  <Label>Loại yêu cầu</Label>
                  <div className="mt-1">{getTypeBadge(selectedReturn.type)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Khách hàng</Label>
                  <p className="font-medium">{selectedReturn.customer?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedReturn.customer?.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedReturn.customer?.phone}</p>
                </div>
                <div>
                  <Label>Ngày tạo</Label>
                  <p className="text-sm">{formatDate(selectedReturn.createdAt)}</p>
                  {selectedReturn.approvedAt && (
                    <>
                      <Label className="mt-2">Ngày duyệt</Label>
                      <p className="text-sm">{formatDate(selectedReturn.approvedAt)}</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label>Lý do</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedReturn.reason}</p>
              </div>

              {selectedReturn.description && (
                <div>
                  <Label>Mô tả chi tiết</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedReturn.description}</p>
                </div>
              )}

              <div>
                <Label>Sản phẩm yêu cầu đổi/trả</Label>
                <div className="mt-2 space-y-2">
                  {selectedReturn.returnItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
                      {item.product.images && item.product.images[0] && (
                        <img
                          src={item.product.images[0].imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity} • Tình trạng: {item.condition}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Giá: {formatCurrency(parseFloat(item.product.price))}
                        </p>
                      </div>
                      {item.exchangeProduct && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">→</span>
                          <div>
                            <p className="font-medium text-sm">{item.exchangeProduct.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(parseFloat(item.exchangeProduct.price))}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedReturn.type === 'RETURN' && selectedReturn.refundAmount && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <Label>Số tiền hoàn</Label>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(selectedReturn.refundAmount)}
                  </p>
                </div>
              )}

              {selectedReturn.type === 'EXCHANGE' && selectedReturn.priceDifference !== undefined && (
                <div className={`p-4 border rounded ${selectedReturn.priceDifference > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <Label>Chênh lệch giá</Label>
                  <p className={`text-lg font-bold ${selectedReturn.priceDifference > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {selectedReturn.priceDifference > 0 ? '+' : ''}{formatCurrency(selectedReturn.priceDifference)}
                  </p>
                  <p className="text-sm mt-1">
                    {selectedReturn.priceDifference > 0 
                      ? 'Khách cần thanh toán thêm' 
                      : 'Khách được hoàn lại'}
                  </p>
                </div>
              )}

              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <Label>Hình ảnh chứng minh từ khách hàng</Label>
                  <div className="mt-2">
                    <ImageGallery images={selectedReturn.images.filter(img => img.imageType === 'CUSTOMER_PROOF')} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hoàn tất xử lý yêu cầu</DialogTitle>
            <DialogDescription>
              Xác nhận đã nhận hàng từ khách và hoàn tất xử lý
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {selectedReturn.type === 'RETURN' && 'Trả hàng hoàn tiền'}
                      {selectedReturn.type === 'EXCHANGE' && 'Đổi sản phẩm'}
                      {selectedReturn.type === 'WARRANTY' && 'Bảo hành'}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Đơn hàng: {selectedReturn.order.orderNumber}
                    </p>
                  </div>
                </div>
              </div>

              {selectedReturn.type === 'RETURN' && (
                <>
                  <div>
                    <Label htmlFor="refundAmount">Số tiền hoàn *</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      placeholder="Nhập số tiền hoàn"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      disabled={submitting}
                    />
                    {selectedReturn.refundAmount && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Đề xuất: {formatCurrency(selectedReturn.refundAmount)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="refundMethod">Phương thức hoàn tiền *</Label>
                    <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)} disabled={submitting}>
                      <SelectTrigger id="refundMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                        <SelectItem value="CASH">Tiền mặt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="completionNote">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="completionNote"
                  placeholder="Nhập ghi chú về quá trình xử lý..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label>Upload ảnh nhận hàng (tùy chọn)</Label>
                <div className="mt-2">
                  <ImageUploader
                    images={uploadImages}
                    onChange={setUploadImages}
                    maxImages={5}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleCompleteReturn} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Hoàn tất'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
