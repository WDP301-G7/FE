import React from 'react';
import { Row, Col, Card, Typography, Statistic, Table, Tag, Progress } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockOrders, orderTypeLabels, orderStatusLabels, orderStatusColors } from '@/mock-data/orders';
import { mockProducts } from '@/mock-data/products';

const { Title, Text } = Typography;

const COLORS = ['#0891b2', '#f97316', '#8b5cf6'];

const ManagerDashboard: React.FC = () => {
  const totalOrders = mockOrders.length;
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
  const completedOrders = mockOrders.filter(o => o.status === 'delivered').length;

  const ordersByType = [
    { name: 'In Stock', value: mockOrders.filter(o => o.type === 'in-stock').length },
    { name: 'Pre-Order', value: mockOrders.filter(o => o.type === 'pre-order').length },
    { name: 'Prescription', value: mockOrders.filter(o => o.type === 'prescription').length },
  ];

  const ordersByStatus = [
    { status: 'Pending', count: mockOrders.filter(o => o.status === 'pending').length },
    { status: 'Processing', count: mockOrders.filter(o => o.status === 'processing').length },
    { status: 'Ready', count: mockOrders.filter(o => o.status === 'ready').length },
    { status: 'Shipped', count: mockOrders.filter(o => o.status === 'shipped').length },
    { status: 'Delivered', count: mockOrders.filter(o => o.status === 'delivered').length },
  ];

  const recentOrders = [...mockOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const topProducts = mockProducts.slice(0, 5).map(product => ({
    ...product,
    totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
  }));

  const orderColumns = [
    { title: 'Mã Đơn', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Khách Hàng', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (type: keyof typeof orderTypeLabels) => <Tag color={type === 'prescription' ? 'purple' : type === 'pre-order' ? 'orange' : 'blue'}>{orderTypeLabels[type]}</Tag> },
    { title: 'Số Tiền', dataIndex: 'totalAmount', key: 'totalAmount', render: (amount: number) => `$${amount.toFixed(2)}` },
    { title: 'Trạng Thái', dataIndex: 'status', key: 'status', render: (status: keyof typeof orderStatusColors) => <Tag color={orderStatusColors[status]}>{orderStatusLabels[status]}</Tag> },
  ];

  const productColumns = [
    { title: 'Sản Phẩm', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Danh Mục', dataIndex: 'category', key: 'category', render: (text: string) => <Tag>{text}</Tag> },
    { title: 'Giá', dataIndex: 'basePrice', key: 'basePrice', render: (price: number) => `$${price.toFixed(2)}` },
    { title: 'Tồn Kho', key: 'totalStock', render: (_: unknown, record: { totalStock: number }) => <Progress percent={Math.min((record.totalStock / 100) * 100, 100)} size="small" format={() => record.totalStock} status={record.totalStock < 20 ? 'exception' : 'normal'} /> },
  ];

  return (
    <div className="space-y-6">
      <div><Title level={2} className="!text-foreground !mb-1">Bảng Điều Khiển Quản Lý</Title><Text className="text-muted-foreground">Tổng quan hiệu suất kinh doanh</Text></div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><Card className="stat-card"><Statistic title="Tổng Đơn Hàng" value={totalOrders} prefix={<ShoppingCartOutlined className="text-primary mr-2" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="stat-card"><Statistic title="Doanh Thu" value={totalRevenue} precision={2} prefix="$" /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="stat-card"><Statistic title="Chờ Xử Lý" value={pendingOrders} prefix={<ClockCircleOutlined className="text-warning mr-2" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="stat-card"><Statistic title="Hoàn Thành" value={completedOrders} prefix={<CheckCircleOutlined className="text-success mr-2" />} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><Card className="dashboard-section"><Title level={4}>Đơn Hàng Theo Loại</Title><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={ordersByType} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>{ordersByType.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></Col>
        <Col xs={24} lg={12}><Card className="dashboard-section"><Title level={4}>Đơn Hàng Theo Trạng Thái</Title><ResponsiveContainer width="100%" height={250}><BarChart data={ordersByStatus}><XAxis dataKey="status" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><Card className="dashboard-section"><Title level={4}>Đơn Hàng Gần Đây</Title><Table dataSource={recentOrders} columns={orderColumns} rowKey="id" pagination={false} size="small" /></Card></Col>
        <Col xs={24} lg={12}><Card className="dashboard-section"><Title level={4}>Tồn Kho Sản Phẩm</Title><Table dataSource={topProducts} columns={productColumns} rowKey="id" pagination={false} size="small" /></Card></Col>
      </Row>
    </div>
  );
};

export default ManagerDashboard;
