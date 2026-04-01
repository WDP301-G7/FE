import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { operationsService, OrderDetails, GetOrdersParams } from '@/services/operations.service';
import { adminService } from '@/services/admin.service';
import { productService } from '@/services/product.service';
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
  SearchOutlined,
} from '@ant-design/icons';
import { User, Phone, Mail, Package, DollarSign, CalendarDays } from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
}

const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiUrl.replace('/api', '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

// const OrderOperationsPage: React.FC = () => {
// interface OrderOperationsPageProps {
//   allowedRoles?: string[];
// }

const OrderOperationsPage: React.FC<OrderOperationsPageProps> = ({
  allowedRoles = ['operations'],
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  if (!hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [orderTypeLocalFilter, setOrderTypeLocalFilter] = useState<string>('');
  const [staffLocalFilter, setStaffLocalFilter] = useState<string>('');
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
  const [productImages, setProductImages] = useState<Record<string, string>>({});

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
        loadProductImages(targetOrder);
        // Clear query param
        setSearchParams({});
      }
    }
  }, [searchParams, orders, setSearchParams]);

  useEffect(() => {
    if (isDetailOpen && selectedOrder) {
      loadProductImages(selectedOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetailOpen, selectedOrder]);

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
    loadProductImages(order);
  };

  const loadProductImages = async (order: OrderDetails) => {
    const items = order.orderItems || [];
    const missingProductIds = Array.from(
      new Set(
        items
          .map((item) => item.productId || item.product?.id)
          .filter((id): id is string => Boolean(id))
          .filter((id) => !productImages[id])
      )
    );

    if (missingProductIds.length === 0) return;

    try {
      const imageMap: Record<string, string> = {};

      await Promise.all(
        missingProductIds.map(async (productId) => {
          try {
            const product = await productService.getProduct(productId);
            if (product.images?.length) {
              const primary = product.images.find((img) => img.isPrimary) || product.images[0];
              if (primary?.imageUrl) {
                imageMap[productId] = primary.imageUrl;
              }
            } else if (product.primaryImage) {
              imageMap[productId] = product.primaryImage;
            }
          } catch {
            // Ignore per-product image loading errors.
          }
        })
      );

      if (Object.keys(imageMap).length > 0) {
        setProductImages((prev) => ({ ...prev, ...imageMap }));
      }
    } catch {
      // Ignore image preloading failures to keep modal usable.
    }
  };

  const getOrderItemImageUrl = (item: any) => {
    const productId = item?.productId || item?.product?.id;
    const cached = productId ? productImages[productId] : '';

    const directUrl =
      cached ||
      item?.product?.imageUrl ||
      item?.product?.image ||
      item?.product?.primaryImage ||
      item?.productImage ||
      item?.imageUrl ||
      item?.image ||
      item?.product?.images?.[0]?.imageUrl ||
      item?.product?.images?.[0]?.url;

    return getFullImageUrl(directUrl);
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
    if (!selectedOrder || !assignedStaffId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    const inStock = isInStockOrder(selectedOrder.orderType);
    if (!inStock && !appointmentDate) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ngày & giờ hẹn',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const isoDate = inStock
        ? new Date().toISOString()
        : new Date(appointmentDate + ':00.000Z').toISOString();
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

  const getAssignedStaffName = (order: OrderDetails) => {
    const directName =
      order.handler?.fullName ||
      (order.handler as any)?.fullname ||
      (order.handler as any)?.name;

    if (directName) return directName;

    const staffId = order.handler?.id || order.handledBy || order.staffId;
    if (!staffId) return 'Chưa phân công';

    const staff = staffList.find((item) => item.id === staffId);
    return staff?.fullName || String(staffId);
  };

  const getCustomerInfo = (order: OrderDetails) => ({
    name: order.customer?.fullName || 'N/A',
    email: order.customer?.email || 'N/A',
    phone: order.customer?.phone || 'N/A',
  });

  const getOrderTypeTag = (orderType?: string) => {
    if (!orderType) return <Tag>Không xác định</Tag>;

    const normalized = String(orderType).toUpperCase().replace(/[-\s]/g, '_');

    if (normalized.includes('PRESCRIPTION')) {
      return <Tag color="purple">Đơn thuốc</Tag>;
    }
    if (normalized.includes('PRE_ORDER') || normalized.includes('PREORDER')) {
      return <Tag color="gold">Đặt trước</Tag>;
    }
    if (normalized.includes('IN_STOCK') || normalized.includes('INSTOCK')) {
      return <Tag color="green">Có sẵn</Tag>;
    }

    return <Tag color="blue">{String(orderType)}</Tag>;
  };

  const getOrderTypeLabel = (orderType?: string) => {
    if (!orderType) return 'Không xác định';
    const normalized = String(orderType).toUpperCase().replace(/[-\s]/g, '_');

    if (normalized.includes('PRESCRIPTION')) return 'Đơn thuốc';
    if (normalized.includes('PRE_ORDER') || normalized.includes('PREORDER')) return 'Đặt trước';
    if (normalized.includes('IN_STOCK') || normalized.includes('INSTOCK')) return 'Có sẵn';

    return String(orderType);
  };

  const isInStockOrder = (orderType?: string) => {
    if (!orderType) return false;
    const normalized = String(orderType).toUpperCase().replace(/[-\s]/g, '_');
    return normalized.includes('IN_STOCK') || normalized.includes('INSTOCK');
  };

  const getStatusLabel = (status?: string) => {
    const key = String(status || '').toUpperCase();
    const labels: Record<string, string> = {
      NEW: 'Mới',
      PENDING: 'Chờ xác nhận',
      PENDING_PAYMENT: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      WAITING_CUSTOMER: 'Đang chuẩn bị',
      PROCESSING: 'Đang xử lý',
      READY: 'Sẵn sàng giao',
      READY_FOR_PICKUP: 'Sẵn sàng giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return labels[key] || status || 'Không xác định';
  };

  const orderTypeOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((item) => {
      if (item.orderType) set.add(String(item.orderType));
    });
    return Array.from(set);
  }, [orders]);

  const staffOptions = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((item) => {
      const id = item.handler?.id || item.handledBy || item.staffId;
      const name = getAssignedStaffName(item);
      if (id) map.set(String(id), name);
    });
    return Array.from(map.entries());
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      if (orderTypeLocalFilter && String(order.orderType || '') !== orderTypeLocalFilter) {
        return false;
      }

      if (staffLocalFilter) {
        const currentStaffId = order.handler?.id || order.handledBy || order.staffId;
        if (String(currentStaffId || '') !== staffLocalFilter) {
          return false;
        }
      }

      if (!kw) return true;

      const customer = getCustomerInfo(order);
      const text = [
        order.id,
        customer.name,
        customer.email,
        customer.phone,
        getAssignedStaffName(order),
        order.orderType,
        order.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(kw);
    });
  }, [orders, keyword, orderTypeLocalFilter, staffLocalFilter]);

  const hasLocalFilters = Boolean(keyword.trim() || orderTypeLocalFilter || staffLocalFilter);

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
      render: (val: string) => <StatusBadge status={val} label={getStatusLabel(val)} />,
    },
    {
      title: 'Loại đơn',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (val: string) => getOrderTypeTag(val),
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
      key: 'staff',
      render: (_: unknown, record: OrderDetails) => <Text>{getAssignedStaffName(record)}</Text>,
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
                <Option value="PENDING_PAYMENT">Chờ thanh toán</Option>
                <Option value="CONFIRMED">Đã xác nhận</Option>
                <Option value="WAITING_CUSTOMER">Đang chuẩn bị</Option>
                <Option value="READY">Sẵn sàng giao</Option>
                <Option value="CANCELLED">Đã hủy</Option>
              </Select>
              <Input
                style={{ width: 220 }}
                prefix={<SearchOutlined />}
                placeholder="Tìm theo mã đơn/khách hàng..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
              <Select
                style={{ width: 180 }}
                value={orderTypeLocalFilter || '__all'}
                onChange={(v) => setOrderTypeLocalFilter(v === '__all' ? '' : v)}
              >
                <Option value="__all">Tất cả loại đơn</Option>
                {orderTypeOptions.map((type) => (
                  <Option key={type} value={type}>{getOrderTypeLabel(type)}</Option>
                ))}
              </Select>
              <Select
                style={{ width: 220 }}
                value={staffLocalFilter || '__all'}
                onChange={(v) => setStaffLocalFilter(v === '__all' ? '' : v)}
              >
                <Option value="__all">Tất cả nhân viên</Option>
                {staffOptions.map(([id, name]) => (
                  <Option key={id} value={id}>{name}</Option>
                ))}
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => { setCurrentPage(1); loadOrders(); }}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                onClick={() => {
                  setKeyword('');
                  setOrderTypeLocalFilter('');
                  setStaffLocalFilter('');
                }}
              >
                Xóa lọc cục bộ
              </Button>
            </Space>
          </div>

          <Table
            dataSource={filteredOrders}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: hasLocalFilters ? filteredOrders.length : totalItems,
              showSizeChanger: true,
              showTotal: (total) => hasLocalFilters
                ? `Hiển thị ${total} đơn (lọc trong trang hiện tại)`
                : `Tổng ${total} đơn hàng`,
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
        title={null}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null}
        width={960}
        destroyOnClose
      >
        {selectedOrder && (
          <div className="py-2">
            <div className="mb-4">
              <Title level={3} className="!mb-1">Chi tiết đơn hàng</Title>
              <Text type="secondary">Đơn hàng #{selectedOrder.id}</Text>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-gray-600" />
                    <Text strong style={{ fontSize: 20 }}>Thông tin khách hàng</Text>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Họ tên</div>
                          <Text strong>{getCustomerInfo(selectedOrder).name}</Text>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Số điện thoại</div>
                          <Text strong>{getCustomerInfo(selectedOrder).phone}</Text>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <Text strong>{getCustomerInfo(selectedOrder).email}</Text>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Trạng thái</div>
                          <div className="mt-1"><StatusBadge status={selectedOrder.status} label={getStatusLabel(selectedOrder.status)} /></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Loại đơn</div>
                          <div className="mt-1">{getOrderTypeTag(selectedOrder.orderType)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-gray-600" />
                    <Text strong style={{ fontSize: 20 }}>Sản phẩm</Text>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table
                      dataSource={selectedOrder.orderItems || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Hình',
                          key: 'image',
                          width: 70,
                          render: (_: unknown, item: any) => (
                            <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                              {getOrderItemImageUrl(item) ? (
                                <img
                                  src={getOrderItemImageUrl(item)}
                                  alt={item?.product?.name || 'product'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          ),
                        },
                        {
                          title: 'Sản phẩm',
                          key: 'product',
                          render: (_: unknown, item: any) => (
                            <Text strong>{item?.product?.name || 'N/A'}</Text>
                          ),
                        },
                        { title: 'SL', dataIndex: 'quantity', width: 70, align: 'center' as const },
                        {
                          title: 'Giá',
                          key: 'unitPrice',
                          align: 'right' as const,
                          render: (_: unknown, item: any) => formatCurrency(item?.unitPrice),
                        },
                        {
                          title: 'Tổng',
                          key: 'lineTotal',
                          align: 'right' as const,
                          render: (_: unknown, item: any) =>
                            formatCurrency((item?.quantity || 0) * Number(item?.unitPrice || 0)),
                        },
                      ]}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t">
                    <div className="flex items-center gap-2 text-gray-500">
                      <DollarSign className="h-4 w-4" />
                      <span>Tổng cộng</span>
                    </div>
                    <div className="text-3xl font-semibold text-cyan-700">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-5 w-5 text-gray-600" />
                    <Text strong style={{ fontSize: 20 }}>Thời gian</Text>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    <span>Ngày tạo:</span>
                    <Text strong>{new Date(selectedOrder.createdAt || '').toLocaleString('vi-VN')}</Text>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <User className="h-4 w-4" />
                    <span>Nhân viên:</span>
                    <Text strong>{getAssignedStaffName(selectedOrder)}</Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        title={selectedOrder && isInStockOrder(selectedOrder.orderType) ? 'Xác nhận đơn hàng' : 'Đặt lịch hẹn'}
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
              {getOrderTypeTag(selectedOrder.orderType)}
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
          {selectedOrder && !isInStockOrder(selectedOrder.orderType) && (
            <>
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
            </>
          )}
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