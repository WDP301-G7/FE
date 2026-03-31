import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, Typography, Table, Tag, Button, Space, Input } from 'antd';
import { motion } from 'framer-motion';
import { SearchOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { mockOrders, Order, OrderStatus } from '@/mock-data/orders';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;

const AdminOrdersManagement: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(['ADMIN','admin', 'OPERATIONS','operations'])) {
    return <Navigate to="/dashboard" replace />;
  }
  // Get recent orders
  const recentOrders = [...mockOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // Order statistics
  const orderStats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === 'pending').length,
    processing: mockOrders.filter(o => o.status === 'processing').length,
    shipped: mockOrders.filter(o => o.status === 'shipped').length,
  };

  const orderColumns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Khách Hàng',
      key: 'customer',
      render: (_: unknown, record: Order) => (
        <div>
          <Text>{record.customerName}</Text>
          <br />
          <Text className="text-muted-foreground text-xs">{record.customerEmail}</Text>
        </div>
      ),
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: Order) => (
        <div>
          <Text>{text}</Text>
          <br />
          <Text className="text-muted-foreground text-xs">{record.productVariant}</Text>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          'in-stock': { text: 'Có Sẵn', color: 'green' },
          'pre-order': { text: 'Đặt Trước', color: 'blue' },
          'prescription': { text: 'Đơn Thuốc', color: 'orange' },
        };
        return <Tag color={typeMap[type]?.color}>{typeMap[type]?.text}</Tag>;
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => <StatusBadge status={status} />,
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground">Tổng Đơn Hàng</Text>
              <Title level={3} className="!mb-0 !text-foreground">{orderStats.total}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground">Chờ Xử Lý</Text>
              <Title level={3} className="!mb-0 !text-foreground">{orderStats.pending}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground">Đang Xử Lý</Text>
              <Title level={3} className="!mb-0 !text-foreground">{orderStats.processing}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground">Đã Gửi</Text>
              <Title level={3} className="!mb-0 !text-foreground">{orderStats.shipped}</Title>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <div className="flex items-center justify-between mb-4">
            <Title level={4} className="!text-foreground !mb-0">
              Quản Lý Đơn Hàng
            </Title>
            <Space>
              <Input
                placeholder="Tìm kiếm đơn hàng..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
              />
              <Button icon={<FilterOutlined />}>Lọc</Button>
              <Button type="primary" icon={<PlusOutlined />}>
                Tạo Đơn Mới
              </Button>
            </Space>
          </div>
          <Table
            dataSource={recentOrders}
            columns={orderColumns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminOrdersManagement;
