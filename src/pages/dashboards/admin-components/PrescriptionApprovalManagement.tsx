import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { prescriptionService, PrescriptionRequest } from '@/services/prescription.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Phone, FileText, X, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const PrescriptionApprovalManagement: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<PrescriptionRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    loadRequests();
  }, [pagination.page, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await prescriptionService.getPrescriptionRequests({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      setRequests(data.data || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách yêu cầu tư vấn',
        variant: 'destructive',
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: PrescriptionRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const handleStartContact = async (request: PrescriptionRequest) => {
    try {
      await prescriptionService.startContact(request.id);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái sang "Đang tư vấn"',
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const handleOpenClose = (request: PrescriptionRequest) => {
    setSelectedRequest(request);
    setCloseReason('');
    setIsCloseDialogOpen(true);
  };

  const handleCloseRequest = async () => {
    if (!selectedRequest || !closeReason.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do đóng yêu cầu',
        variant: 'destructive',
      });
      return;
    }

    try {
      await prescriptionService.closeRequest(selectedRequest.id, { reason: closeReason });
      toast({
        title: 'Thành công',
        description: 'Đã đóng yêu cầu tư vấn',
      });
      setIsCloseDialogOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể đóng yêu cầu',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { label: 'Chờ tư vấn', class: 'bg-orange-100 text-orange-800', icon: '⏳' },
      CONTACTING: { label: 'Đang tư vấn', class: 'bg-blue-100 text-blue-800', icon: '📞' },
      QUOTED: { label: 'Đã báo giá', class: 'bg-purple-100 text-purple-800', icon: '💰' },
      ACCEPTED: { label: 'Đã xác nhận', class: 'bg-green-100 text-green-800', icon: '✅' },
      SCHEDULED: { label: 'Đã đặt lịch', class: 'bg-cyan-100 text-cyan-800', icon: '📅' },
      EXPIRED: { label: 'Đã hết hạn', class: 'bg-gray-100 text-gray-800', icon: '⏰' },
      LOST: { label: 'Đã đóng', class: 'bg-red-100 text-red-800', icon: '❌' },
    };
    const item = config[status as keyof typeof config] || config.PENDING;
    return (
      <Badge variant="outline" className={item.class}>
        <span className="mr-1">{item.icon}</span>
        {item.label}
      </Badge>
    );
  };

  const getConsultationTypeBadge = (type: string) => {
    const config = {
      PHONE: { label: 'Điện thoại', icon: '📞' },
      IN_STORE: { label: 'Tại cửa hàng', icon: '🏪' },
      VIDEO: { label: 'Video call', icon: '📹' },
    };
    const item = config[type as keyof typeof config] || config.PHONE;
    return (
      <span className="text-sm text-muted-foreground">
        {item.icon} {item.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Duyệt Đơn Tư Vấn Kính Mắt
          </CardTitle>
          <CardDescription>Xử lý các yêu cầu tư vấn từ khách hàng</CardDescription>
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
                placeholder="Tìm theo tên, SĐT khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={loadRequests}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ tư vấn</SelectItem>
                <SelectItem value="CONTACTING">Đang tư vấn</SelectItem>
                <SelectItem value="QUOTED">Đã báo giá</SelectItem>
                <SelectItem value="ACCEPTED">Đã xác nhận</SelectItem>
                <SelectItem value="LOST">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div
            className="border rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Loại tư vấn</TableHead>
                  <TableHead>Triệu chứng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Không có yêu cầu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.customer?.fullName}</div>
                          <div className="text-sm text-muted-foreground">{request.customer?.phone}</div>
                          <div className="text-sm text-muted-foreground">{request.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getConsultationTypeBadge(request.consultationType)}</TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[200px] truncate">{request.symptoms || 'Không có'}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm">{formatDate(request.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(request)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartContact(request)}
                              title="Bắt đầu tư vấn"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          {(request.status === 'PENDING' || request.status === 'CONTACTING') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenClose(request)}
                              title="Đóng yêu cầu"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
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
              Hiển thị {requests.length} / {pagination.total} yêu cầu
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu tư vấn</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Khách hàng</Label>
                  <p className="font-medium">{selectedRequest.customer?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.customer?.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.customer?.phone}</p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại tư vấn</Label>
                  <p className="mt-1">{getConsultationTypeBadge(selectedRequest.consultationType)}</p>
                </div>
                <div>
                  <Label>Cửa hàng</Label>
                  <p className="font-medium text-sm">{selectedRequest.store?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.store?.address}</p>
                </div>
              </div>

              {selectedRequest.symptoms && (
                <div>
                  <Label>Triệu chứng</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedRequest.symptoms}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div>
                  <Label>Ghi chú</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.images && selectedRequest.images.length > 0 && (
                <div>
                  <Label>Ảnh đơn thuốc</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {selectedRequest.images.map((image) => (
                      <img
                        key={image.id}
                        src={image.imageUrl}
                        alt="Prescription"
                        className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(image.imageUrl, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Ngày tạo</Label>
                  <p>{formatDate(selectedRequest.createdAt)}</p>
                </div>
                {selectedRequest.contactedAt && (
                  <div>
                    <Label>Ngày liên hệ</Label>
                    <p>{formatDate(selectedRequest.contactedAt)}</p>
                  </div>
                )}
              </div>

              {selectedRequest.orderId && selectedRequest.order && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <Label className="text-green-800">Đơn hàng đã tạo</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <strong>Mã đơn:</strong> {selectedRequest.order.orderNumber}
                    </p>
                    <p className="text-sm">
                      <strong>Tổng tiền:</strong>{' '}
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        selectedRequest.order.totalAmount
                      )}
                    </p>
                    <p className="text-sm">
                      <strong>Trạng thái:</strong> {selectedRequest.order.status}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đóng yêu cầu tư vấn</DialogTitle>
            <DialogDescription>Vui lòng nhập lý do đóng yêu cầu này</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="closeReason">Lý do *</Label>
              <Textarea
                id="closeReason"
                placeholder="Ví dụ: Khách hàng không phản hồi, đã chọn cửa hàng khác..."
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleCloseRequest}>
              Xác nhận đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
