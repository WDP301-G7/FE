'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { returnService, ReturnRequest, ReturnFilters } from '@/services/return.service';
import StatusBadge from '@/components/StatusBadge';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  Divider,
  Badge,
} from 'antd';
import { motion } from 'framer-motion';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ReturnPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState<ReturnFilters>({ page: 1, limit: 10, status: '', type: '' });

  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
  const [completionNote, setCompletionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await returnService.getReturns(filters);
      setReturns(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tải danh sách trả hàng', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, [filters]);

  const handleApprove = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      await returnService.approveReturn(selectedReturn.id, approveNote || undefined);
      toast({ title: 'Thành công', description: 'Đơn trả hàng đã được phê duyệt' });
      setShowApproveModal(false);
      setShowDetailModal(false);
      setApproveNote('');
      fetchReturns();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể phê duyệt', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReturn || !rejectReason) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập lý do từ chối', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      await returnService.rejectReturn(selectedReturn.id, rejectReason);
      toast({ title: 'Thành công', description: 'Đơn trả hàng đã bị từ chối' });
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
      fetchReturns();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể từ chối', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      await returnService.cancelReturn(selectedReturn.id);
      toast({ title: 'Thành công', description: 'Đơn trả hàng đã bị hủy' });
      setShowCancelModal(false);
      setShowDetailModal(false);
      fetchReturns();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể hủy', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedReturn) return;
    if (refundAmount === '' && selectedReturn.type === 'RETURN') {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập số tiền hoàn lại', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      await returnService.completeReturn(selectedReturn.id, {
        refundAmount: refundAmount === '' ? 0 : Number(refundAmount),
        refundMethod,
        completionNote: completionNote || undefined,
      });
      toast({ title: 'Thành công', description: 'Đơn trả hàng đã hoàn thành' });
      setShowCompleteModal(false);
      setShowDetailModal(false);
      setRefundAmount('');
      setCompletionNote('');
      fetchReturns();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể hoàn thành', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      RETURN: { label: 'Hoàn trả', color: 'default' },
      EXCHANGE: { label: 'Đổi hàng', color: 'blue' },
      WARRANTY: { label: 'Bảo hành', color: 'green' },
    };
    const c = config[type] || { label: type, color: 'default' };
    return <Tag color={c.color}>{c.label}</Tag>;
  };

  const formatCurrency = (value: number | string | undefined) => {
    if (!value) return '0 ₫';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

  // Derived stats
  const pendingCount = returns.filter((r) => r.status === 'PENDING').length;
  const approvedCount = returns.filter((r) => r.status === 'APPROVED').length;
  const completedCount = returns.filter((r) => r.status === 'COMPLETED').length;

  const columns = [
    {
      title: 'Mã Order',
      key: 'orderId',
      render: (_: unknown, record: ReturnRequest) => (
        <Text strong style={{ fontSize: 12 }}>{record.order.id}</Text>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: ReturnRequest) => (
        <div>
          <Text strong>{record.customer?.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customer?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (val: string) => getTypeBadge(val),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      title: 'Số tiền',
      key: 'amount',
      render: (_: unknown, record: ReturnRequest) =>
        record.type === 'RETURN'
          ? <Text strong>{formatCurrency(record.refundAmount || 0)}</Text>
          : record.priceDifference
          ? <Text strong>{formatCurrency(record.priceDifference)}</Text>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => <Text>{formatDate(val)}</Text>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: ReturnRequest) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => { setSelectedReturn(record); setShowDetailModal(true); }}
        >
          Xem
        </Button>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn trả', value: pagination.total },
          { label: 'Chờ phê duyệt', value: pendingCount },
          { label: 'Đã phê duyệt', value: approvedCount },
          { label: 'Hoàn thành', value: completedCount },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Card className="stat-card">
              <div className="space-y-2">
                <Text className="text-muted-foreground">{stat.label}</Text>
                <Title level={3} className="!mb-0 !text-foreground">{stat.value}</Title>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Title level={4} className="!text-foreground !mb-0">Quản lý Đơn Trả Hàng</Title>
            <Space wrap>
              <Select
                style={{ width: 180 }}
                value={filters.status || 'ALL'}
                onChange={(v) => setFilters({ ...filters, status: v === 'ALL' ? '' : v, page: 1 })}
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="PENDING">Chờ phê duyệt</Option>
                <Option value="APPROVED">Đã phê duyệt</Option>
                <Option value="COMPLETED">Hoàn thành</Option>
                <Option value="REJECTED">Bị từ chối</Option>
                <Option value="CANCELLED">Đã hủy</Option>
              </Select>
              <Select
                style={{ width: 160 }}
                value={filters.type || 'ALL'}
                onChange={(v) => setFilters({ ...filters, type: v === 'ALL' ? '' : v, page: 1 })}
              >
                <Option value="ALL">Tất cả loại</Option>
                <Option value="RETURN">Hoàn trả</Option>
                <Option value="EXCHANGE">Đổi hàng</Option>
                <Option value="WARRANTY">Bảo hành</Option>
              </Select>
              <Button
                onClick={() => setFilters({ page: 1, limit: 10, status: '', type: '' })}
              >
                Đặt lại
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchReturns()}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <Table
            dataSource={returns}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn trả hàng`,
              onChange: (page, pageSize) => setFilters({ ...filters, page, limit: pageSize }),
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết Đơn Trả Hàng"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        destroyOnClose
        width={680}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        {selectedReturn && (
          <div className="space-y-4 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Mã đơn', value: selectedReturn.order.orderNumber },
                { label: 'Ngày tạo', value: formatDate(selectedReturn.createdAt) },
                { label: 'Lý do', value: selectedReturn.reason },
              ].map(({ label, value }) => (
                <div key={label}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                  <div><Text strong>{value}</Text></div>
                </div>
              ))}
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Loại</Text>
                <div>{getTypeBadge(selectedReturn.type)}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái</Text>
                <div><StatusBadge status={selectedReturn.status} /></div>
              </div>
            </div>

            {/* Customer info */}
            {selectedReturn.customer && (
              <>
                <Divider orientation="left"><Text strong>Thông tin khách hàng</Text></Divider>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tên', value: selectedReturn.customer.fullName },
                    { label: 'Email', value: selectedReturn.customer.email },
                    { label: 'Điện thoại', value: selectedReturn.customer.phone },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                      <div><Text>{value}</Text></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Return items */}
            {(selectedReturn.returnItems ?? []).length > 0 && (
              <>
                <Divider orientation="left"><Text strong>Sản phẩm yêu cầu</Text></Divider>
                <div className="space-y-2">
                  {(selectedReturn.returnItems ?? []).map((item) => (
                    <Card key={item.id} size="small" style={{ background: '#fafafa' }}>
                      <Text strong>{item.product.name}</Text>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { label: 'Số lượng', value: item.quantity },
                          { label: 'Tình trạng', value: item.condition },
                          { label: 'Giá', value: formatCurrency(item.product.price) },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
                            <div><Text style={{ fontSize: 12 }}>{value}</Text></div>
                          </div>
                        ))}
                      </div>
                      {item.exchangeProduct && (
                        <div className="mt-2 pt-2 border-t">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Đổi lấy: <Text strong>{item.exchangeProduct.name}</Text>
                          </Text>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Description */}
            {selectedReturn.description && (
              <>
                <Divider />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Mô tả chi tiết</Text>
                  <div><Text>{selectedReturn.description}</Text></div>
                </div>
              </>
            )}

            {/* Images */}
            {selectedReturn.images && selectedReturn.images.length > 0 && (
              <>
                <Divider orientation="left"><Text strong>Hình ảnh</Text></Divider>
                <div className="grid grid-cols-3 gap-2">
                  {selectedReturn.images.map((image) => (
                    <div key={image.id}>
                      <img src={image.imageUrl} alt={image.imageType} className="w-full h-32 object-cover rounded border" />
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: 'center', marginTop: 4 }}>
                        {image.imageType === 'CUSTOMER_PROOF' ? 'Ảnh khách hàng' : 'Ảnh nhân viên'}
                      </Text>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Rejection reason */}
            {selectedReturn.rejectionReason && (
              <Card size="small" style={{ background: '#fff1f0', border: '1px solid #ffa39e' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Lý do từ chối</Text>
                <div><Text type="danger">{selectedReturn.rejectionReason}</Text></div>
              </Card>
            )}

            {/* Refund info */}
            {(selectedReturn.refundAmount || selectedReturn.refundMethod) && (
              <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Text strong style={{ color: '#389e0d' }}>Thông tin hoàn tiền</Text>
                <div className="space-y-1 mt-1">
                  {selectedReturn.refundAmount && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Số tiền</Text>
                      <div><Text strong>{formatCurrency(selectedReturn.refundAmount)}</Text></div>
                    </div>
                  )}
                  {selectedReturn.refundMethod && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Phương thức</Text>
                      <div><Text>{selectedReturn.refundMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}</Text></div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Completion note */}
            {selectedReturn.completionNote && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú hoàn thành</Text>
                <div><Text>{selectedReturn.completionNote}</Text></div>
              </div>
            )}

            {/* Action buttons */}
            <Divider />
            <div className="flex gap-2 flex-wrap">
              {selectedReturn.status === 'PENDING' && (
                <>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setShowApproveModal(true)}>
                    Phê duyệt
                  </Button>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => setShowRejectModal(true)}>
                    Từ chối
                  </Button>
                </>
              )}
              {selectedReturn.status === 'APPROVED' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { setRefundAmount(''); setShowCompleteModal(true); }}>
                  Hoàn thành
                </Button>
              )}
              {['PENDING', 'APPROVED'].includes(selectedReturn.status) && (
                <Button danger icon={<DeleteOutlined />} onClick={() => setShowCancelModal(true)}>
                  Hủy đơn
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        title="Phê duyệt Đơn Trả Hàng"
        open={showApproveModal}
        onCancel={() => setShowApproveModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Mã đơn">
            <Input value={selectedReturn?.order.orderNumber} readOnly />
          </Form.Item>
          <Form.Item label="Ghi chú (tùy chọn)">
            <TextArea
              placeholder="Nhập ghi chú phê duyệt..."
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowApproveModal(false)}>Hủy</Button>
            <Button type="primary" onClick={handleApprove} loading={actionLoading}>
              Phê duyệt
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối Đơn Trả Hàng"
        open={showRejectModal}
        onCancel={() => setShowRejectModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Mã đơn">
            <Input value={selectedReturn?.order.orderNumber} readOnly />
          </Form.Item>
          <Form.Item label="Lý do từ chối" required>
            <TextArea
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowRejectModal(false)}>Hủy</Button>
            <Button danger onClick={handleReject} loading={actionLoading} disabled={!rejectReason}>
              Từ chối
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Hủy Đơn Trả Hàng"
        open={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        footer={null}
        destroyOnClose
      >
        <div className="py-2 space-y-4">
          <Text>Bạn có chắc chắn muốn hủy đơn trả hàng này? Hành động này không thể hoàn tác.</Text>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCancelModal(false)}>Đóng</Button>
            <Button danger onClick={handleCancel} loading={actionLoading}>
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Modal */}
      <Modal
        title="Hoàn thành Đơn Trả Hàng"
        open={showCompleteModal}
        onCancel={() => setShowCompleteModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Mã đơn">
            <Input value={selectedReturn?.order.orderNumber} readOnly />
          </Form.Item>
          {selectedReturn?.type === 'RETURN' && (
            <>
              <Form.Item label="Số tiền hoàn lại" required>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={refundAmount === '' ? undefined : refundAmount}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  onChange={(v) => setRefundAmount(v === null ? '' : v)}
                  placeholder="Nhập số tiền..."
                />
              </Form.Item>
              <Form.Item label="Phương thức hoàn lại" required>
                <Select value={refundMethod} onChange={(v) => setRefundMethod(v)} style={{ width: '100%' }}>
                  <Option value="BANK_TRANSFER">Chuyển khoản</Option>
                  <Option value="CASH">Tiền mặt</Option>
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item label="Ghi chú hoàn thành (tùy chọn)">
            <TextArea
              placeholder="Nhập ghi chú..."
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCompleteModal(false)}>Hủy</Button>
            <Button type="primary" onClick={handleComplete} loading={actionLoading}>
              Hoàn thành
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
}