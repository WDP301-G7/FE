import React from 'react';
import { Row, Col, Card, Typography, Tag, Space, Button, Tabs } from 'antd';
import { motion } from 'framer-motion';
import {
  SettingOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminOrdersManagement from './AdminOrdersManagement';
import AdminUsersManagement from './AdminUsersManagement';
import AdminSystemsManagement from './AdminSystemsManagement';
import { PrescriptionApprovalManagement } from './PrescriptionApprovalManagement';
import { adminService, MembershipTier, UsersStats } from '@/services/admin.service';
import { useToast } from '@/hooks/use-toast';

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dashboardLoading, setDashboardLoading] = React.useState(false);
  const [usersStats, setUsersStats] = React.useState<UsersStats | null>(null);
  const [membershipTiers, setMembershipTiers] = React.useState<MembershipTier[]>([]);
  const [lowStockCount, setLowStockCount] = React.useState(0);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setDashboardLoading(true);

      const [usersStatsData, tiersData, lowStockData] = await Promise.all([
        adminService.getUsersStats(),
        adminService.getMembershipTiers(),
        adminService.getLowStockCount(),
      ]);

      setUsersStats(usersStatsData);
      setMembershipTiers(tiersData.sort((a, b) => Number(a.minSpend) - Number(b.minSpend)));
      setLowStockCount(lowStockData);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải dữ liệu dashboard admin',
        variant: 'destructive',
      });
    } finally {
      setDashboardLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // System modules
  const systemModules = [
    { key: 'orders', name: 'Quản Lý Đơn Hàng', status: 'active', icon: <AppstoreOutlined /> },
    { key: 'products', name: 'Danh Mục Sản Phẩm', status: 'active', icon: <AppstoreOutlined /> },
    { key: 'prescriptions', name: 'Xử Lý Đơn Thuốc', status: 'active', icon: <CloudServerOutlined /> },
    { key: 'shipping', name: 'Tích Hợp Vận Chuyển', status: 'active', icon: <CloudServerOutlined /> },
    { key: 'analytics', name: 'Bảng Phân Tích', status: 'active', icon: <CloudServerOutlined /> },
    { key: 'notifications', name: 'Thông Báo Email', status: 'maintenance', icon: <CloudServerOutlined /> },
  ];

  const quickSettings = [
    {
      title: 'Quản Lý Người Dùng',
      description: 'Quản lý tài khoản và phân quyền',
      icon: <TeamOutlined className="text-2xl text-purple-600" />,
      path: '/admin/users',
    },
    {
      title: 'Quản Lý Đơn Hàng',
      description: 'Xem và quản lý tất cả đơn hàng',
      icon: <ShoppingOutlined className="text-2xl text-blue-600" />,
      path: '/admin/orders',
    },
    {
      title: 'Cấu Hình Hệ Thống',
      description: 'Quản lý cài đặt hệ thống toàn cục',
      icon: <SettingOutlined className="text-2xl text-primary" />,
      path: '/admin/systems',
    },
  ];

  const quickStats = [
    {
      key: 'customers',
      title: 'Số khách hàng đã đăng ký',
      value: usersStats?.byRole?.CUSTOMER ?? 0,
      valueClassName: '!text-foreground',
    },
    {
      key: 'low-stock',
      title: 'Sản phẩm sắp hết hàng',
      value: lowStockCount,
      valueClassName: '!text-orange-600',
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
              <Col xs={24} sm={12} lg={8} key={setting.title}>
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

          {/* Dashboard KPI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="dashboard-section mb-6" loading={dashboardLoading}>
              <Title level={4} className="!text-foreground !mb-4">
                Tổng Quan Nhanh
              </Title>
              <Row gutter={[16, 16]}>
                {quickStats.map((stat) => (
                  <Col xs={24} md={12} key={stat.key}>
                    <Card hoverable className="stat-card h-full">
                      <div className="text-center py-2">
                        <Text className="text-muted-foreground">{stat.title}</Text>
                        <Title level={3} className={`!mb-0 !mt-2 ${stat.valueClassName}`}>
                          {stat.value}
                        </Title>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </motion.div>

          {/* Membership Tier Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="dashboard-section mb-6" loading={dashboardLoading}>
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="!text-foreground !mb-0">
                  Widget Membership
                </Title>
                <Button onClick={() => navigate('/admin/membership')}>Chi tiết Membership</Button>
              </div>
              <Row gutter={[16, 16]}>
                {membershipTiers.length === 0 ? (
                  <Col span={24}>
                    <Text className="text-muted-foreground">Chưa có dữ liệu tier membership</Text>
                  </Col>
                ) : (
                  membershipTiers.map((tier) => (
                    <Col xs={24} sm={12} md={8} lg={8} key={tier.id}>
                      <Card className="h-full">
                        <Space direction="vertical" size={4}>
                          <Text strong>{tier.icon || '🏆'} {tier.name}</Text>
                          <Text className="text-muted-foreground text-xs">Khách theo tier</Text>
                          <Title level={4} className="!mb-0 !mt-1">
                            {tier._count?.users ?? 0}
                          </Title>
                        </Space>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card>
          </motion.div>

          {/* System Modules Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
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
