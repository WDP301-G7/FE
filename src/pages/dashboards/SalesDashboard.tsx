import React from 'react';
import { Row, Col, Card, Typography, Statistic, Table, Tag, Button, Space, Badge } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mockOrders, orderTypeLabels, orderStatusLabels, orderStatusColors, Order } from '@/mock-data/orders';

const { Title, Text } = Typography;

const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter orders assigned to current user
  const myOrders = mockOrders.filter(o => o.assignedStaffId === user?.id);
  const pendingOrders = myOrders.filter(o => o.status === 'pending');
  const prescriptionOrders = myOrders.filter(o => o.type === 'prescription');
  const updateRequiredOrders = myOrders.filter(
    o => o.prescription?.status === 'update-required'
  );
  const todayOrders = myOrders.filter(o => {
    const orderDate = new Date(o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });

  const columns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <Button type="link" className="p-0" onClick={() => navigate(`/orders/${text}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: Order) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text className="text-muted-foreground text-xs">{record.productVariant}</Text>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: keyof typeof orderTypeLabels) => (
        <Tag color={type === 'prescription' ? 'purple' : type === 'pre-order' ? 'orange' : 'blue'}>
          {orderTypeLabels[type]}
        </Tag>
      ),
    },
    {
      title: 'Đơn Thuốc',
      key: 'prescription',
      render: (_: unknown, record: Order) => {
        if (!record.prescription) return <Text className="text-muted-foreground">Không có</Text>;
        const status = record.prescription.status;
        const colors: Record<string, string> = {
          pending: 'gold',
          verified: 'green',
          processing: 'blue',
          completed: 'green',
          'update-required': 'red',
        };
        return (
          <Tag color={colors[status]}>
            {status.replace('-', ' ').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof orderStatusColors) => (
        <Tag color={orderStatusColors[status]}>{orderStatusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Số Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Title level={2} className="!text-foreground !mb-1">
          Bảng Điều Khiển Bán Hàng
        </Title>
        <Text className="text-muted-foreground">
          Chào mừng trở lại, {user?.name}! Đây là các đơn hàng được giao cho bạn.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Đơn Hàng Của Tôi</span>}
              value={myOrders.length}
              prefix={<ShoppingCartOutlined className="text-primary mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Chờ Duyệt</span>}
              value={pendingOrders.length}
              prefix={<SyncOutlined className="text-warning mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Đơn Theo Đơn Thuốc</span>}
              value={prescriptionOrders.length}
              prefix={<FileTextOutlined className="text-info mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Badge count={updateRequiredOrders.length} offset={[10, 0]}>
              <Statistic
                title={<span className="text-muted-foreground">Cần Chú Ý</span>}
                value={updateRequiredOrders.length}
                prefix={<WarningOutlined className="text-destructive mr-2" />}
                valueStyle={{ color: 'hsl(var(--destructive))' }}
              />
            </Badge>
          </Card>
        </Col>
      </Row>

      {/* Alerts for orders needing attention */}
      {updateRequiredOrders.length > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-center gap-3">
            <WarningOutlined className="text-xl text-destructive" />
            <div>
              <Text strong className="text-destructive">
                {updateRequiredOrders.length} đơn hàng cần cập nhật đơn thuốc
              </Text>
              <br />
              <Text className="text-muted-foreground text-sm">
                Vui lòng liên hệ khách hàng để cập nhật thông tin đơn thuốc.
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="dashboard-section">
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="!text-foreground !mb-0">
            Đơn Hàng Được Giao
          </Title>
          <Button type="primary" onClick={() => navigate('/orders')}>
            Xem Tất Cả Đơn
          </Button>
        </div>
        <Table
          dataSource={myOrders}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default SalesDashboard;
