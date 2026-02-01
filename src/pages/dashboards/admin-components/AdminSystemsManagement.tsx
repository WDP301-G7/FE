import React from 'react';
import { Card, Typography, Table, Tag, Switch, Space, Button, Row, Col } from 'antd';
import { motion } from 'framer-motion';
import { 
  AppstoreOutlined, 
  CloudServerOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { mockFeatureToggles } from '@/mock-data/policies';

const { Title, Text } = Typography;

interface SystemModule {
  key: string;
  name: string;
  status: 'active' | 'maintenance' | 'error';
  icon: React.ReactNode;
  uptime: string;
  lastUpdate: string;
}

const AdminSystemsManagement: React.FC = () => {
  // System modules with more details
  const systemModules: SystemModule[] = [
    { 
      key: 'orders', 
      name: 'Quản Lý Đơn Hàng', 
      status: 'active', 
      icon: <AppstoreOutlined />,
      uptime: '99.9%',
      lastUpdate: '2 giờ trước',
    },
    { 
      key: 'products', 
      name: 'Danh Mục Sản Phẩm', 
      status: 'active', 
      icon: <AppstoreOutlined />,
      uptime: '99.8%',
      lastUpdate: '5 giờ trước',
    },
    { 
      key: 'prescriptions', 
      name: 'Xử Lý Đơn Thuốc', 
      status: 'active', 
      icon: <CloudServerOutlined />,
      uptime: '99.5%',
      lastUpdate: '1 giờ trước',
    },
    { 
      key: 'shipping', 
      name: 'Tích Hợp Vận Chuyển', 
      status: 'active', 
      icon: <CloudServerOutlined />,
      uptime: '99.7%',
      lastUpdate: '3 giờ trước',
    },
    { 
      key: 'analytics', 
      name: 'Bảng Phân Tích', 
      status: 'active', 
      icon: <CloudServerOutlined />,
      uptime: '99.6%',
      lastUpdate: '30 phút trước',
    },
    { 
      key: 'notifications', 
      name: 'Thông Báo Email', 
      status: 'maintenance', 
      icon: <CloudServerOutlined />,
      uptime: '95.2%',
      lastUpdate: '1 ngày trước',
    },
  ];

  // System health stats
  const systemStats = {
    totalModules: systemModules.length,
    activeModules: systemModules.filter(m => m.status === 'active').length,
    maintenanceModules: systemModules.filter(m => m.status === 'maintenance').length,
    errorModules: systemModules.filter(m => m.status === 'error').length,
  };

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
      filters: [
        { text: 'Core', value: 'Core' },
        { text: 'Integration', value: 'Integration' },
        { text: 'Analytics', value: 'Analytics' },
        { text: 'Notifications', value: 'Notifications' },
      ],
      onFilter: (value: any, record: any) => record.category === value,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />;
      case 'maintenance':
        return <WarningOutlined style={{ color: '#faad14', fontSize: '24px' }} />;
      case 'error':
        return <SyncOutlined spin style={{ color: '#ff4d4f', fontSize: '24px' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="green">HOẠT ĐỘNG</Tag>;
      case 'maintenance':
        return <Tag color="orange">BẢO TRÌ</Tag>;
      case 'error':
        return <Tag color="red">LỖI</Tag>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* System Health Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground">Tổng Modules</Text>
              <Title level={3} className="!mb-0 !text-foreground">{systemStats.totalModules}</Title>
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
              <Text className="text-muted-foreground">Hoạt Động</Text>
              <Title level={3} className="!mb-0 !text-green-600">{systemStats.activeModules}</Title>
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
              <Text className="text-muted-foreground">Bảo Trì</Text>
              <Title level={3} className="!mb-0 !text-orange-600">{systemStats.maintenanceModules}</Title>
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
              <Text className="text-muted-foreground">Lỗi</Text>
              <Title level={3} className="!mb-0 !text-red-600">{systemStats.errorModules}</Title>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* System Modules Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <div className="flex items-center justify-between mb-4">
            <Title level={4} className="!text-foreground !mb-0">
              Trạng Thái Các Module Hệ Thống
            </Title>
            <Button type="primary" icon={<SyncOutlined />}>
              Làm Mới
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {systemModules.map((module, index) => (
              <Col xs={24} md={12} lg={8} key={module.key}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <Space>
                        <div className="text-2xl text-primary">{module.icon}</div>
                        <div>
                          <Text strong className="block">{module.name}</Text>
                          <Text className="text-muted-foreground text-xs">
                            Uptime: {module.uptime}
                          </Text>
                        </div>
                      </Space>
                      {getStatusIcon(module.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusTag(module.status)}
                      <Text className="text-muted-foreground text-xs">
                        {module.lastUpdate}
                      </Text>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Card>
      </motion.div>

      {/* Feature Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Card className="dashboard-section">
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
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} tính năng`,
            }}
          />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminSystemsManagement;
