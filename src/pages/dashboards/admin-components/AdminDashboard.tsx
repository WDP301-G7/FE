import React, { useState } from 'react';
import { Row, Col, Card, Typography, Table, Tag, Switch, Space, Button, Divider, Tabs } from 'antd';
import { motion } from 'framer-motion';
import {
  SettingOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  LockOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { mockLogs, actionLabels, AuditLog } from '@/mock-data/logs';
import { mockFeatureToggles, FeatureToggle } from '@/mock-data/policies';
import AdminOrdersManagement from './AdminOrdersManagement';
import AdminUsersManagement from './AdminUsersManagement';
import AdminSystemsManagement from './AdminSystemsManagement';
import { PrescriptionApprovalManagement } from './PrescriptionApprovalManagement';

const { Title, Text, Paragraph } = Typography;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Recent activity logs
  const recentLogs = [...mockLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // System modules
  const systemModules = [
    { key: 'orders', name: 'Quản Lý Đơn Hàng', status: 'active', icon: <AppstoreOutlined /> },
    { key: 'products', name: 'Danh Mục Sản Phẩm', status: 'active', icon: <AppstoreOutlined /> },
    { key: 'prescriptions', name: 'Xử Lý Đơn Thuốc', status: 'active', icon: <CloudServerOutlined /> },
    { key: 'shipping', name: 'Tích Hợp Vận Chuyển', status: 'active', icon: <CloudServerOutlined /> },
    { key: 'analytics', name: 'Bảng Phân Tích', status: 'active', icon: <CloudServerOutlined /> },
    { key: 'notifications', name: 'Thông Báo Email', status: 'maintenance', icon: <CloudServerOutlined /> },
  ];

  const logColumns = [
    {
      title: 'Hành Động',
      dataIndex: 'action',
      key: 'action',
      render: (action: keyof typeof actionLabels) => (
        <Tag color="blue">{actionLabels[action]}</Tag>
      ),
    },
    {
      title: 'Người Dùng',
      key: 'user',
      render: (_: unknown, record: AuditLog) => (
        <div>
          <Text>{record.userName}</Text>
          <br />
          <Text className="text-muted-foreground text-xs">{record.userRole}</Text>
        </div>
      ),
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Địa Chỉ IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (text: string) => <Text className="text-muted-foreground">{text}</Text>,
    },
    {
      title: 'Thời Gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ];

  const featureColumns = [
    {
      title: 'Tính Năng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Danh Mục',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text className="text-muted-foreground text-sm">{text}</Text>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (isEnabled: boolean) => <Switch checked={isEnabled} />,
    },
  ];

  const quickSettings = [
    {
      title: 'Cấu Hình Hệ Thống',
      description: 'Quản lý cài đặt hệ thống toàn cục',
      icon: <SettingOutlined className="text-2xl text-primary" />,
      path: '/system-settings',
    },
    {
      title: 'Tổng Quan Phân Quyền',
      description: 'Xem kiểm soát truy cập theo vai trò',
      icon: <SafetyCertificateOutlined className="text-2xl text-success" />,
      path: '/permissions',
    },
    {
      title: 'Nhật Ký Kiểm Toán',
      description: 'Xem lại lịch sử hoạt động hệ thống',
      icon: <AuditOutlined className="text-2xl text-info" />,
      path: '/audit-logs',
    },
    {
      title: 'Cài Đặt Bảo Mật',
      description: 'Cấu hình chính sách bảo mật',
      icon: <LockOutlined className="text-2xl text-warning" />,
      path: '/system-settings',
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <SettingOutlined /> Tổng Quan
        </span>
      ),
      children: (
        <>
          {/* Quick Access Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            {quickSettings.map((setting, index) => (
              <Col xs={24} sm={12} lg={6} key={setting.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card
                    hoverable
                    className="stat-card cursor-pointer"
                    onClick={() => navigate(setting.path)}
                  >
                    <div className="text-center">
                      <div className="mb-3">{setting.icon}</div>
                      <Title level={5} className="!text-foreground !mb-1">
                        {setting.title}
                      </Title>
                      <Text className="text-muted-foreground text-sm">
                        {setting.description}
                      </Text>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>

          {/* System Modules Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="dashboard-section mb-6">
              <Title level={4} className="!text-foreground !mb-4">
                Trạng Thái Các Module Hệ Thống
              </Title>
              <Row gutter={[16, 16]}>
                {systemModules.map((module) => (
                  <Col xs={24} sm={12} md={8} key={module.key}>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <Space>
                        {module.icon}
                        <Text strong>{module.name}</Text>
                      </Space>
                      <Tag color={module.status === 'active' ? 'green' : 'orange'}>
                        {module.status.toUpperCase()}
                      </Tag>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </motion.div>

          {/* Feature Toggles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card className="dashboard-section mb-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="!text-foreground !mb-0">
                  Bật/Tắt Tính Năng
                </Title>
                <Button type="primary">Lưu Thay Đổi</Button>
              </div>
              <Table
                dataSource={mockFeatureToggles}
                columns={featureColumns}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Card className="dashboard-section">
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="!text-foreground !mb-0">
                  Hoạt Động Hệ Thống Gần Đây
                </Title>
                <Button onClick={() => navigate('/audit-logs')}>Xem Tất Cả Nhật Ký</Button>
              </div>
              <Table
                dataSource={recentLogs}
                columns={logColumns}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          </motion.div>
        </>
      ),
    },
    {
      key: 'prescriptions',
      label: (
        <span>
          <FileTextOutlined /> Duyệt Đơn Tư Vấn
        </span>
      ),
      children: <PrescriptionApprovalManagement />,
    },
    {
      key: 'orders',
      label: (
        <span>
          <ShoppingOutlined /> Đơn Hàng
        </span>
      ),
      children: <AdminOrdersManagement />,
    },
    {
      key: 'users',
      label: (
        <span>
          <TeamOutlined /> Người Dùng
        </span>
      ),
      children: <AdminUsersManagement />,
    },
    {
      key: 'systems',
      label: (
        <span>
          <DatabaseOutlined /> Hệ Thống
        </span>
      ),
      children: <AdminSystemsManagement />,
    },
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
          Quản Trị Hệ Thống
        </Title>
        <Text className="text-muted-foreground">
          Quản lý cấu hình hệ thống, phân quyền và cài đặt bảo mật
        </Text>
      </motion.div>

      {/* Tabs for different sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <Tabs defaultActiveKey="overview" items={tabItems} />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
