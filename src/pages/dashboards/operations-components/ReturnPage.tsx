'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Divider,
} from 'antd';
import { motion } from 'framer-motion';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  User,
  Phone,
  Mail,
  Package,
  CalendarDays,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ReturnPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState<ReturnFilters>({ page: 1, limit: 10, status: '', type: '' });
  const [keyword, setKeyword] = useState('');

  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
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

  const getOrderCode = (request: ReturnRequest | null | undefined) => {
    return request?.order?.orderNumber || request?.order?.id || request?.orderId || 'N/A';
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

  const getConditionLabel = (condition?: string) => {
    const conditionMap: Record<string, string> = {
      NEW: 'Mới',
      LIKE_NEW: 'Như mới',
      GOOD: 'Tốt',
      DEFECTIVE: 'Lỗi',
    };
    return condition ? (conditionMap[condition] || condition) : 'Không xác định';
  };

  // Derived stats
  const pendingCount = returns.filter((r) => r.status === 'PENDING').length;
  const approvedCount = returns.filter((r) => r.status === 'APPROVED').length;
  const completedCount = returns.filter((r) => r.status === 'COMPLETED').length;

  const filteredReturns = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return returns;

    return returns.filter((item) => {
      const searchText = [
        getOrderCode(item),
        item.customer?.fullName,
        item.customer?.email,
        item.customer?.phone,
        item.status,
        item.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(kw);
    });
  }, [returns, keyword]);

  const columns = [
    {
      title: 'Mã Đơn',
      key: 'orderId',
      render: (_: unknown, record: ReturnRequest) => (
        <Text strong style={{ fontSize: 12 }}>{getOrderCode(record)}</Text>
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
      render: (_: unknown, record: ReturnRequest) => {
        if (record.type === 'RETURN') {
          const amount = record.refundAmount || 0;
          const isCompleted = record.status === 'COMPLETED';
          return (
            <div>
              <Text strong>{formatCurrency(amount)}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {isCompleted ? '(Thực tế)' : '(Dự kiến)'}
              </Text>
            </div>
          );
        }
        return record.priceDifference
          ? <Text strong>{formatCurrency(record.priceDifference)}</Text>
          : <Text type="secondary">—</Text>;
      },
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
              <Input
                style={{ width: 220 }}
                prefix={<SearchOutlined />}
                placeholder="Tìm mã đơn/tên khách hàng..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
              <Button
                onClick={() => {
                  setKeyword('');
                  setFilters({ page: 1, limit: 10, status: '', type: '' });
                }}
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
            dataSource={filteredReturns}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: keyword.trim() ? filteredReturns.length : pagination.total,
              showSizeChanger: true,
              showTotal: (total) => keyword.trim() ? `Tìm thấy ${total} đơn trả hàng` : `Tổng ${total} đơn trả hàng`,
              onChange: (page, pageSize) => setFilters({ ...filters, page, limit: pageSize }),
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        title={null}
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        destroyOnClose
        width={960}
      >
        {selectedReturn && (
          <div className="py-2">
            <div className="mb-4">
              <Title level={3} className="!mb-1">Chi tiết đơn trả hàng</Title>
              <Text type="secondary">Đơn #{getOrderCode(selectedReturn)}</Text>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Customer Info Card */}
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-gray-600" />
                    <Text strong style={{ fontSize: 20 }}>Thông tin khách hàng</Text>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {selectedReturn.customer && (
                        <>
                          <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <div className="text-xs text-gray-500">Họ tên</div>
                              <Text strong>{selectedReturn.customer.fullName}</Text>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <div className="text-xs text-gray-500">Số điện thoại</div>
                              <Text strong>{selectedReturn.customer.phone}</Text>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="space-y-3">
                      {selectedReturn.customer && (
                        <>
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <div className="text-xs text-gray-500">Email</div>
                              <Text strong>{selectedReturn.customer.email}</Text>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Trạng thái</div>
                          <div className="mt-1"><StatusBadge status={selectedReturn.status} /></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Loại</div>
                          <div className="mt-1">{getTypeBadge(selectedReturn.type)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Return Reason Card */}
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-gray-600" />
                    <Text strong style={{ fontSize: 20 }}>Lý do trả hàng</Text>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Lý do</div>
                      <Text>{selectedReturn.reason}</Text>
                    </div>
                    {selectedReturn.description && (
                      <div>
                        <div className="text-xs text-gray-500">Mô tả chi tiết</div>
                        <Text>{selectedReturn.description}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Return Items Card */}
              {(selectedReturn.returnItems ?? []).length > 0 && (
                <Card>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-gray-600" />
                      <Text strong style={{ fontSize: 20 }}>Sản phẩm</Text>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table
                        dataSource={selectedReturn.returnItems}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Sản phẩm',
                            key: 'product',
                            render: (_: unknown, item: any) => (
                              <Text strong>{item?.product?.name || 'N/A'}</Text>
                            ),
                          },
                          {
                            title: 'SL',
                            dataIndex: 'quantity',
                            width: 60,
                            align: 'center' as const,
                          },
                          {
                            title: 'Tình trạng',
                            key: 'condition',
                            render: (_: unknown, item: any) => getConditionLabel(item.condition),
                          },
                          {
                            title: 'Giá',
                            key: 'price',
                            align: 'right' as const,
                            render: (_: unknown, item: any) => formatCurrency(item?.product?.price),
                          },
                        ]}
                      />
                    </div>

                    {(selectedReturn.returnItems ?? []).some((item) => item.exchangeProduct) && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {(selectedReturn.returnItems ?? []).map(
                          (item) =>
                            item.exchangeProduct && (
                              <div key={item.id}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {item.product.name} → <Text strong>{item.exchangeProduct.name}</Text>
                                </Text>
                              </div>
                            )
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Refund Information Card */}
              {(selectedReturn.refundAmount || selectedReturn.refundMethod) && (
                <Card>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                      <Text strong style={{ fontSize: 20 }}>
                        {selectedReturn.status === 'COMPLETED' ? 'Hoàn tiền thực tế' : 'Dự kiến hoàn tiền'}
                      </Text>
                    </div>
                    <div className="space-y-3">
                      {selectedReturn.refundAmount && (
                        <div>
                          <div className="text-xs text-gray-500">
                            {selectedReturn.status === 'COMPLETED' ? 'Số tiền thực tế' : 'Số tiền dự kiến'}
                          </div>
                          <div className="text-3xl font-semibold text-cyan-700 mt-1">
                            {formatCurrency(selectedReturn.refundAmount)}
                          </div>
                        </div>
                      )}
                      {selectedReturn.refundMethod && (
                        <div className="border-t pt-3">
                          <div className="text-xs text-gray-500">Phương thức hoàn tiền</div>
                          <Text strong className="mt-1">
                            {selectedReturn.refundMethod === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt'}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Images Card */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <Card>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                      <Text strong style={{ fontSize: 20 }}>Hình ảnh ({selectedReturn.images.length})</Text>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedReturn.images.map((image) => (
                        <div key={image.id} className="text-center">
                          <img
                            src={image.imageUrl}
                            alt={image.imageType}
                            className="w-full h-28 object-cover rounded border"
                          />
                          <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>
                            {image.imageType === 'CUSTOMER_PRODUCT' || image.imageType === 'CUSTOMER_DEFECT'
                              ? 'KH'
                              : 'NV'}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Rejection Reason Card */}
              {selectedReturn.rejectionReason && (
                <Card style={{ background: '#fff1f0', border: '1px solid #ffa39e' }}>
                  <div className="p-5">
                    <Text strong style={{ color: '#cf1322', fontSize: 16 }}>Lý do từ chối</Text>
                    <Text className="block mt-2" type="danger">
                      {selectedReturn.rejectionReason}
                    </Text>
                  </div>
                </Card>
              )}

              {/* Completion Note Card */}
              {selectedReturn.completionNote && (
                <Card>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarDays className="h-5 w-5 text-gray-600" />
                      <Text strong style={{ fontSize: 20 }}>Ghi chú hoàn thành</Text>
                    </div>
                    <Text>{selectedReturn.completionNote}</Text>
                  </div>
                </Card>
              )}

              {/* Timeline Card */}
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-5 w-5 text-gray-600" />
                    <Text strong style={{ fontSize: 20 }}>Thời gian</Text>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarDays className="h-4 w-4" />
                      <span>Ngày tạo:</span>
                      <Text strong>{formatDate(selectedReturn.createdAt)}</Text>
                    </div>
                    {selectedReturn.approvedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircleOutlined className="h-4 w-4" />
                        <span>Ngày phê duyệt:</span>
                        <Text strong>{formatDate(selectedReturn.approvedAt)}</Text>
                      </div>
                    )}
                    {selectedReturn.completedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircleOutlined className="h-4 w-4" />
                        <span>Ngày hoàn thành:</span>
                        <Text strong>{formatDate(selectedReturn.completedAt)}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Action buttons */}
            <Divider className="mt-6 mb-4" />
            <div className="flex gap-2 flex-wrap justify-end">
              {selectedReturn.status === 'PENDING' && (
                <>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => setShowRejectModal(true)}>
                    Từ chối
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setShowApproveModal(true)}>
                    Phê duyệt
                  </Button>
                </>
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
            <Input value={getOrderCode(selectedReturn)} readOnly />
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
            <Input value={getOrderCode(selectedReturn)} readOnly />
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
    </motion.div>
  );
}