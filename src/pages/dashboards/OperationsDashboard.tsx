import React from 'react';
import { Row, Col, Card, Typography, Statistic, Table, Tag, Button, Space, Steps } from 'antd';
import { motion } from 'framer-motion';
import {
  InboxOutlined,
  CarOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { mockOrders, orderTypeLabels, orderStatusLabels, orderStatusColors, Order } from '@/mock-data/orders';

const { Title, Text } = Typography;

const OperationsDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Filter orders for operations
  const processingOrders = mockOrders.filter(o => 
    o.status === 'processing' || o.status === 'ready'
  );
  const prescriptionProcessing = mockOrders.filter(
    o => o.type === 'prescription' && o.prescription?.status === 'processing'
  );
  const preOrders = mockOrders.filter(o => o.type === 'pre-order');
  const readyToShip = mockOrders.filter(o => o.status === 'ready');
  const shippedOrders = mockOrders.filter(o => o.status === 'shipped');

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
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof orderStatusColors) => (
        <Tag color={orderStatusColors[status]}>{orderStatusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Mã Vận Đơn',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      render: (text: string | undefined) => 
        text ? <Tag color="geekblue">{text}</Tag> : <Text className="text-muted-foreground">—</Text>,
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
            Xử Lý
          </Button>
        </Space>
      ),
    },
  ];

  // Order workflow steps
  const workflowSteps = [
    { title: 'Chờ Xử Lý', count: mockOrders.filter(o => o.status === 'pending').length },
    { title: 'Đang Xử Lý', count: processingOrders.length },
    { title: 'Sẵn Sàng', count: readyToShip.length },
    { title: 'Đã Giao', count: shippedOrders.length },
    { title: 'Hoàn Thành', count: mockOrders.filter(o => o.status === 'delivered').length },
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Title level={2} className="!text-foreground !mb-1">
          Bảng Điều Khiển Vận Hành
        </Title>
        <Text className="text-muted-foreground">
          Quản lý xử lý đơn hàng, vận chuyển và theo dõi giao hàng
        </Text>
      </motion.div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Chờ Xử Lý</span>}
              value={processingOrders.length}
              prefix={<InboxOutlined className="text-primary mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Đơn Thuốc Đang Xử Lý</span>}
              value={prescriptionProcessing.length}
              prefix={<FileSearchOutlined className="text-info mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Đơn Đặt Trước Chờ</span>}
              value={preOrders.filter(o => o.status !== 'delivered').length}
              prefix={<RocketOutlined className="text-warning mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="stat-card">
            <Statistic
              title={<span className="text-muted-foreground">Sẵn Sàng Giao Hàng</span>}
              value={readyToShip.length}
              prefix={<CarOutlined className="text-success mr-2" />}
              valueStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Workflow Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="dashboard-section">
        <Title level={4} className="!text-foreground !mb-6">
          Quy Trình Xử Lý Đơn Hàng
        </Title>
        <Steps
          current={-1}
          items={workflowSteps.map((step, index) => ({
            title: step.title,
            description: (
              <span className="text-lg font-semibold text-primary">
                {step.count} đơn
              </span>
            ),
            icon: index === 0 ? <InboxOutlined /> : 
                  index === 1 ? <FileSearchOutlined /> : 
                  index === 2 ? <CheckCircleOutlined /> : 
                  index === 3 ? <CarOutlined /> : 
                  <CheckCircleOutlined />,
          }))}
        />
      </Card>
      </motion.div>

      {/* Processing Queue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className="dashboard-section">
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="!text-foreground !mb-0">
            Đơn Hàng Chờ Xử Lý
          </Title>
          <Button type="primary" onClick={() => navigate('/orders')}>
            Xem Tất Cả Đơn
          </Button>
        </div>
        <Table
          dataSource={processingOrders}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
      </motion.div>

      {/* Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="dashboard-section text-center">
            <InboxOutlined className="text-4xl text-primary mb-3" />
            <Title level={5} className="!text-foreground">
              Xử Lý Đơn Thuốc
            </Title>
            <Text className="text-muted-foreground text-sm">
              Đánh dấu đơn thuốc đã hoàn thành
            </Text>
            <Button type="primary" className="mt-4" block>
              Xem Đơn Thuốc
            </Button>
          </Card>
          </motion.div>
        </Col>

        <Col xs={24} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="dashboard-section text-center">
            <CarOutlined className="text-4xl text-success mb-3" />
            <Title level={5} className="!text-foreground">
              Tạo Vận Đơn
            </Title>
            <Text className="text-muted-foreground text-sm">
              Tạo nhãn vận chuyển
            </Text>
            <Button type="primary" className="mt-4" block>
              Tạo Nhãn
            </Button>
          </Card>
          </motion.div>
        </Col>

        <Col xs={24} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.5 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <Card className="dashboard-section text-center">
            <RocketOutlined className="text-4xl text-warning mb-3" />
            <Title level={5} className="!text-foreground">
              Hàng Đặt Trước Về
            </Title>
            <Text className="text-muted-foreground text-sm">
              Đánh dấu sản phẩm đã nhận
            </Text>
            <Button type="primary" className="mt-4" block>
              Xem Hàng Đặt Trước
            </Button>
          </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default OperationsDashboard;
