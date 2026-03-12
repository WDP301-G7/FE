'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { returnService, ReturnRequest, ReturnFilters } from '@/services/return.service';
import { ChevronDown, Eye, Check, X, Trash2, Download } from 'lucide-react';

export default function ReturnPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filter states
  const [filters, setFilters] = useState<ReturnFilters>({
    page: 1,
    limit: 10,
    status: '',
    type: '',
  });

  // Modal states
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Form states
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
  const [completionNote, setCompletionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  

  // Fetch returns
  const fetchReturns = async () => {
    try {
      console.log('🔄 Fetching returns with filters:', filters);
      setLoading(true);
      const response = await returnService.getReturns(filters);
      console.log('✅ API Response:', response);
      console.log('Returns data:', response.data);
      console.log('Pagination:', response.pagination);
      setReturns(response.data);
      console.log('Returns state updated:', returns);
      setPagination(response.pagination);
    
    } catch (error: any) {
      console.error('❌ Error fetching returns:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải danh sách trả hàng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📌 useEffect triggered with filters:', filters);
    fetchReturns();
    
  }, [filters]);

  const handleApprove = async () => {
    if (!selectedReturn) return;
    try {
      setActionLoading(true);
      await returnService.approveReturn(selectedReturn.id, approveNote || undefined);
      toast({
        title: 'Thành công',
        description: 'Đơn trả hàng đã được phê duyệt',
      });
      setShowApproveDialog(false);
      setApproveNote('');
      setShowDetailModal(false);
      fetchReturns();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể phê duyệt đơn trả hàng',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReturn || !rejectReason) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do từ chối',
        variant: 'destructive',
      });
      return;
    }
    try {
      setActionLoading(true);
      await returnService.rejectReturn(selectedReturn.id, rejectReason);
      toast({
        title: 'Thành công',
        description: 'Đơn trả hàng đã bị từ chối',
      });
      setShowRejectDialog(false);
      setRejectReason('');
      setShowDetailModal(false);
      fetchReturns();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể từ chối đơn trả hàng',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReturn) return;
    try {
      setActionLoading(true);
      await returnService.cancelReturn(selectedReturn.id);
      toast({
        title: 'Thành công',
        description: 'Đơn trả hàng đã bị hủy',
      });
      setShowCancelDialog(false);
      setShowDetailModal(false);
      fetchReturns();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể hủy đơn trả hàng',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedReturn) return;
    if (refundAmount === '' && selectedReturn.type === 'RETURN') {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập số tiền hoàn lại',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      console.log('Completing return with data:', {
        refundAmount,
        refundMethod,
        completionNote,
      });
      await returnService.completeReturn(selectedReturn.id, {
        refundAmount: refundAmount === '' ? 0 : Number(refundAmount),
        refundMethod,
        completionNote: completionNote || undefined,
      });
      toast({
        title: 'Thành công',
        description: 'Đơn trả hàng đã hoàn thành',
      });
      setShowCompleteDialog(false);
      setRefundAmount('');
      setCompletionNote('');
      setShowDetailModal(false);
      fetchReturns();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể hoàn thành đơn trả hàng',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // use global StatusBadge for colored status labels
  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: any }> = {
      RETURN: { label: 'Hoàn trả', variant: 'secondary' },
      EXCHANGE: { label: 'Đổi hàng', variant: 'blue' },
      WARRANTY: { label: 'Bảo hành', variant: 'green' },
    };

    const config = typeConfig[type];
    return <Badge variant={config?.variant}>{config?.label || type}</Badge>;
  };

  const formatCurrency = (value: number | string | undefined) => {
    if (!value) return '0 ₫';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Đơn Trả Hàng</h1>
        <p className="text-gray-600">Xem và quản lý các yêu cầu trả hàng từ khách hàng</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={filters.status || 'ALL'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === 'ALL' ? '' : value,
                    page: 1,
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ phê duyệt</SelectItem>
                  <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Loại</Label>
              <Select
                value={filters.type || 'ALL'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    type: value === 'ALL' ? '' : value,
                    page: 1,
                  })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="RETURN">Hoàn trả</SelectItem>
                  <SelectItem value="EXCHANGE">Đổi hàng</SelectItem>
                  <SelectItem value="WARRANTY">Bảo hành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit">Số lượng hiển thị</Label>
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(value) =>
                  setFilters({ ...filters, limit: parseInt(value), page: 1 })
                }
              >
                <SelectTrigger id="limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    page: 1,
                    limit: 10,
                    status: '',
                    type: '',
                  })
                }
                className="w-full"
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách Đơn Trả Hàng ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có đơn trả hàng nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Order</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnReq) => (
                    <TableRow key={returnReq.id}>
                      <TableCell className="font-medium">
                        {returnReq.order.id}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{returnReq.customer?.fullName}</p>
                          <p className="text-sm text-gray-600">
                            {returnReq.customer?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(returnReq.type)}</TableCell>
                      <TableCell><StatusBadge status={returnReq.status} /></TableCell>
                      <TableCell>
                        {returnReq.type === 'RETURN'
                          ? formatCurrency(returnReq.refundAmount || 0)
                          : returnReq.priceDifference
                            ? formatCurrency(returnReq.priceDifference)
                            : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(returnReq.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(returnReq);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Trước
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={pagination.page === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, page })}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Đơn Trả Hàng</DialogTitle>
            <DialogDescription>
              {selectedReturn?.order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Loại</Label>
                  <p className="mt-1">{getTypeBadge(selectedReturn.type)}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Trạng thái</Label>
                  <p className="mt-1"><StatusBadge status={selectedReturn.status} /></p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Lý do</Label>
                  <p className="mt-1">{selectedReturn.reason}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Ngày tạo</Label>
                  <p className="mt-1">{formatDate(selectedReturn.createdAt)}</p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedReturn.customer && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Thông tin khách hàng</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-600">Tên</Label>
                      <p>{selectedReturn.customer.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Email</Label>
                      <p>{selectedReturn.customer.email}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-600">Điện thoại</Label>
                      <p>{selectedReturn.customer.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Items (or requested products) */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Sản phẩm khách yêu cầu</h3>
                <div className="space-y-3">
                  {(selectedReturn.returnItems ?? []).map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p className="font-medium">{item.product.name}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold">Số lượng:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="font-semibold">Tình trạng:</span>{' '}
                          {item.condition}
                        </div>
                        <div>
                          <span className="font-semibold">Giá:</span>{' '}
                          {formatCurrency(item.product.price)}
                        </div>
                      </div>
                      {item.exchangeProduct && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <p className="text-gray-600">
                            <span className="font-semibold">Đổi lấy:</span>{' '}
                            {item.exchangeProduct.name}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Exchange products list for easy reference */}
              {selectedReturn && selectedReturn.type === 'EXCHANGE' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Sản phẩm muốn đổi</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    {(selectedReturn.returnItems ?? [])
                      .filter((item) => item.exchangeProduct)
                      .map((item) => (
                        <li key={item.id}>{item.exchangeProduct?.name}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Description */}
              {selectedReturn.description && (
                <div className="border-t pt-4">
                  <Label className="text-xs font-semibold text-gray-600">Mô tả chi tiết</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {selectedReturn.description}
                  </p>
                </div>
              )}

              {/* Images */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Hình ảnh</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReturn.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.imageUrl}
                          alt={image.imageType}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <p className="text-xs text-gray-600 mt-1 text-center">
                          {image.imageType === 'CUSTOMER_PROOF'
                            ? 'Ảnh khách hàng'
                            : 'Ảnh nhân viên'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedReturn.rejectionReason && (
                <div className="border-t pt-4 bg-red-50 p-3 rounded-lg">
                  <Label className="text-xs font-semibold text-red-700">
                    Lý do từ chối
                  </Label>
                  <p className="mt-1 text-sm text-red-700">
                    {selectedReturn.rejectionReason}
                  </p>
                </div>
              )}

              {/* Refund Info */}
              {(selectedReturn.refundAmount || selectedReturn.refundMethod) && (
                <div className="border-t pt-4 bg-green-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Thông tin hoàn tiền</h3>
                  <div className="space-y-1 text-sm text-green-900">
                    {selectedReturn.refundAmount && (
                      <p>
                        <span className="font-semibold">Số tiền:</span>{' '}
                        {formatCurrency(selectedReturn.refundAmount)}
                      </p>
                    )}
                    {selectedReturn.refundMethod && (
                      <p>
                        <span className="font-semibold">Phương thức:</span>{' '}
                        {selectedReturn.refundMethod === 'BANK_TRANSFER'
                          ? 'Chuyển khoản'
                          : 'Tiền mặt'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Completion Note */}
              {selectedReturn.completionNote && (
                <div className="border-t pt-4">
                  <Label className="text-xs font-semibold text-gray-600">
                    Ghi chú hoàn thành
                  </Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {selectedReturn.completionNote}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex gap-2 flex-wrap">
                {selectedReturn.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => setShowApproveDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Phê duyệt
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                  </>
                )}

                {selectedReturn.status === 'APPROVED' && (
                  <>
                    <Button
                      onClick={() => {
                        setRefundAmount('');
                        setShowCompleteDialog(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Hoàn thành
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hủy
                    </Button>
                  </>
                )}

                {['PENDING', 'APPROVED'].includes(selectedReturn.status) && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hủy đơn
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phê duyệt Đơn Trả Hàng</DialogTitle>
            <DialogDescription>
              Đơn: {selectedReturn?.order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-note">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="approve-note"
                placeholder="Nhập ghi chú phê duyệt..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối Đơn Trả Hàng</DialogTitle>
            <DialogDescription>
              Đơn: {selectedReturn?.order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Lý do từ chối *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason}
                variant="destructive"
              >
                {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy Đơn Trả Hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn trả hàng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành Đơn Trả Hàng</DialogTitle>
            <DialogDescription>
              Đơn: {selectedReturn?.order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReturn?.type === 'RETURN' && (
              <>
                <div>
                  <Label htmlFor="refund-amount">Số tiền hoàn lại *</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    placeholder="Nhập số tiền..."
                    value={refundAmount}
                    onChange={(e) =>
                      setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="refund-method">Phương thức hoàn lại *</Label>
                  <Select
                    value={refundMethod}
                    onValueChange={(value: any) => setRefundMethod(value)}
                  >
                    <SelectTrigger id="refund-method">
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
              <Label htmlFor="completion-note">Ghi chú hoàn thành (tùy chọn)</Label>
              <Textarea
                id="completion-note"
                placeholder="Nhập ghi chú..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleComplete}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? 'Đang xử lý...' : 'Hoàn thành'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
