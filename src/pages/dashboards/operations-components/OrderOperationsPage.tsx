import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { operationsService, OrderDetails, GetOrdersParams } from '@/services/operations.service';
import { adminService } from '@/services/admin.service';
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
} from 'antd';
import { motion } from 'framer-motion';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
}

const OrderOperationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  if (!hasRole(['operations'])) {
    return <Navigate to="/dashboard" replace />;
  }
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const loadStaffs = async () => {
      try {
        let res = await adminService.getUsers({ page: 1, limit: 100, role: 'STAFF' });
        let users =
          (res as any).users ||
          (res as any).items ||
          (res as any).data ||
          (Array.isArray(res) ? res : []);
        if (!users || users.length === 0) {
          res = await adminService.getUsers({ page: 1, limit: 100 });
          users =
            (res as any).users ||
            (res as any).items ||
            (res as any).data ||
            (Array.isArray(res) ? res : []);
        }
        setStaffList(
          users.map((u: any) => ({ id: u.id, fullName: u.fullName, email: u.email }))
        );
      } catch {
        setStaffList([]);
      }
    };
    loadStaffs();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && orders.length > 0) {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        setIsDetailOpen(true);
        // Clear query param
        setSearchParams({});
      }
    }
  }, [searchParams, orders, setSearchParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: GetOrdersParams = { page: currentPage, limit: pageSize };
      if (statusFilter && statusFilter !== '__all') params.status = statusFilter;
      const response = await operationsService.getAllOrders(params);
      setOrders(response.orders || []);
      setTotalItems(response.pageInfo?.totalElements || response.orders.length);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Tải dữ liệu đơn hàng thất bại',
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
    setAppointmentDate(
      order.createdDate ? new Date(order.createdDate).toISOString().slice(0, 16) : ''
    );
    setAppointmentNotes('');
    setAssignedStaffId('');
    setIsConfirmOpen(true);
  };

  const submitConfirm = async () => {
    if (!selectedOrder || !appointmentDate || !assignedStaffId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const isoDate = new Date(appointmentDate + ':00.000Z').toISOString();
      await operationsService.confirmOrder(selectedOrder.id, {
        appointmentDate: isoDate,
        appointmentNotes,
        assignedStaffId,
      });
      toast({ title: 'Thành công', description: 'Xác nhận đơn và đặt lịch hẹn thành công' });
      setIsConfirmOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Xác nhận đơn thất bại',
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
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do hủy đơn',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await operationsService.cancelOrder(selectedOrder.id, { reason: cancelReason });
      toast({ title: 'Thành công', description: 'Hủy đơn hàng thành công' });
      setIsCancelOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Hủy đơn thất bại',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount || 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Derived stats
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (val: string) => <Text strong style={{ fontSize: 12 }}>{val}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: any) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => <Text>{formatDate(val)}</Text>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: OrderDetails) => (
        <Text>{record.customer?.fullName || 'N/A'}</Text>
      ),
    },
    {
      title: 'Nhân viên',
      dataIndex: 'staffId',
      key: 'staffId',
      render: (val: string) => <Text>{val || 'Chưa phân công'}</Text>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: OrderDetails) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openDetails(record)}
          >
            Xem
          </Button>
          {record.status === 'CONFIRMED' && (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => openConfirm(record)}
              >
                Xác nhận
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                size="small"
                danger
                onClick={() => openCancel(record)}
              >
                Hủy
              </Button>
            </>
          )}
        </Space>
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn hàng', value: totalItems },
          { label: 'Hoàn thành', value: completedCount },
          { label: 'Đã xác nhận', value: confirmedCount },
          { label: 'Bị hủy', value: cancelledCount },
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
                <Title level={3} className="!mb-0 !text-foreground">
                  {stat.value}
                </Title>
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
            <Title level={4} className="!text-foreground !mb-0">
              Quản lý đơn hàng
            </Title>
            <Space wrap>
              <Select
                style={{ width: 200 }}
                value={statusFilter || '__all'}
                onChange={(v) => setStatusFilter(v === '__all' ? '' : v)}
              >
                <Option value="__all">Tất cả trạng thái</Option>
                <Option value="PENDING">Pending</Option>
                <Option value="CONFIRMED">Confirmed</Option>
                <Option value="WAITING_CUSTOMER">Waiting</Option>
                <Option value="READY">Ready</Option>
                <Option value="CANCELLED">Cancelled</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => { setCurrentPage(1); loadOrders(); }}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <Table
            dataSource={orders}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết đơn hàng"
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={
          <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
        }
        destroyOnClose
      >
        {selectedOrder && (
          <div className="space-y-3 py-2">
            {[
              { label: 'Mã đơn hàng', value: selectedOrder.id },
              { label: 'Tổng giá', value: formatCurrency(selectedOrder.totalAmount) },
              { label: 'Ngày tạo', value: formatDate(selectedOrder.createdAt) },
              { label: 'Khách hàng', value: selectedOrder.customer?.fullName || 'N/A' },
              { label: 'Nhân viên', value: selectedOrder.staffId || 'Chưa phân công' },
            ].map(({ label, value }) => (
              <div key={label}>
                <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                <div><Text strong>{value}</Text></div>
              </div>
            ))}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái</Text>
              <div><StatusBadge status={selectedOrder.status} /></div>
            </div>
          </div>
        )}

        {selectedOrder?.orderItems?.length > 0 && (
          <div className="mb-4">
            <Text strong>Danh sách sản phẩm</Text>

            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {selectedOrder.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 border rounded-md bg-white"
                >
                  <div>
                    <Text strong>{item.product?.name}</Text>
                    <div className="text-xs text-gray-500">
                      {item.product?.brand}
                    </div>
                  </div>

                  <div className="text-right">
                    <div>Số lượng: {item.quantity}</div>
                    <div>{formatCurrency(item.unitPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        title="Đặt lịch hẹn"
        open={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        footer={null}
        destroyOnClose
      >
        {selectedOrder && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-2">
            <div className="flex justify-between">
              <Text strong>Mã đơn:</Text>
              <Text>{selectedOrder.id}</Text>
            </div>

            <div className="flex justify-between">
              <Text strong>Khách hàng:</Text>
              <Text>{selectedOrder.customer?.fullName}</Text>
            </div>

            <div className="flex justify-between">
              <Text strong>Trạng thái thanh toán:</Text>
              <Tag color={selectedOrder.paymentStatus === 'PAID' ? 'green' : 'orange'}>
                {selectedOrder.paymentStatus}
              </Tag>
            </div>

            <div className="flex justify-between">
              <Text strong>Loại đơn:</Text>
              <Text>{selectedOrder.orderType}</Text>
            </div>

            <div className="flex justify-between">
              <Text strong>Tổng tiền:</Text>
              <Text strong>{formatCurrency(selectedOrder.totalAmount)}</Text>
            </div>

            {/* Cảnh báo */}
            {selectedOrder.paymentStatus === 'UNPAID' && (
              <Tag color="red">⚠️ Đơn chưa thanh toán</Tag>
            )}
          </div>
        )}

        {selectedOrder?.orderItems?.length > 0 && (
          <div className="mb-4">
            <Text strong>Danh sách sản phẩm</Text>

            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {selectedOrder.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 border rounded-md bg-white"
                >
                  <div>
                    <Text strong>{item.product?.name}</Text>
                    <div className="text-xs text-gray-500">
                      {item.product?.brand}
                    </div>
                  </div>

                  <div className="text-right">
                    <div>Số lượng: {item.quantity}</div>
                    <div>{formatCurrency(item.unitPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Ngày & Giờ Hẹn" required>
            <Input
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Ghi chú về cuộc hẹn">
            <TextArea
              placeholder="Nhập ghi chú cho cuộc hẹn"
              value={appointmentNotes}
              onChange={(e) => setAppointmentNotes(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Chọn nhân viên" required>
            <Select
              placeholder="Chọn nhân viên"
              value={assignedStaffId || undefined}
              onChange={setAssignedStaffId}
              style={{ width: '100%' }}
            >
              {staffList.map((staff) => (
                <Option key={staff.id} value={staff.id}>
                  {staff.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsConfirmOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={submitConfirm} loading={loading}>
              Xác nhận đơn
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Hủy Đơn Hàng"
        open={isCancelOpen}
        onCancel={() => setIsCancelOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Lý do Hủy" required>
            <TextArea
              placeholder="Vui lòng cung cấp lý do hủy đơn hàng này"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCancelOpen(false)}>Đóng</Button>
            <Button danger onClick={submitCancel} loading={loading}>
              Xác nhận hủy
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default OrderOperationsPage; 