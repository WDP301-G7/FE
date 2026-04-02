import React from 'react';
import { Row, Col, Card, Typography, Space, Button, Tabs } from 'antd';
import { motion } from 'framer-motion';
import {
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminOrdersManagement from './AdminOrdersManagement';
import AdminUsersManagement from './AdminUsersManagement';
import AdminStores from './AdminStoresManagement';
import {
  adminService,
  DashboardInventorySummary,
  DashboardOrderSummary,
  MembershipTier,
} from '@/services/admin.service';
import { useToast } from '@/hooks/use-toast';

const { Title, Text } = Typography;

type PieStat = {
  key: string;
  title: string;
  value: number;
  color: string;
};

const getPieTotal = (stats: PieStat[]) => stats.reduce((sum, stat) => sum + Math.max(0, stat.value), 0);
const getPieGradient = (stats: PieStat[]) => {
  const total = getPieTotal(stats);
  if (total <= 0) {
    return 'conic-gradient(#e5e7eb 0% 100%)';
  }

  let current = 0;
  const stops = stats.map((stat) => {
    const start = current;
    const end = current + (Math.max(0, stat.value) / total) * 100;
    current = end;
    return `${stat.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dashboardLoading, setDashboardLoading] = React.useState(false);
  const [membershipTiers, setMembershipTiers] = React.useState<MembershipTier[]>([]);
  const [orderSummary, setOrderSummary] = React.useState<DashboardOrderSummary>({
    totalOrders: 0,
    completed: 0,
    confirmed: 0,
    cancelled: 0,
  });
  const [inventorySummary, setInventorySummary] = React.useState<DashboardInventorySummary>({
    totalProducts: 0,
    lowStock: 0,
    totalReserved: 0,
    totalAvailable: 0,
  });

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setDashboardLoading(true);

      const [tiersData, orderSummaryData, inventorySummaryData] = await Promise.all([
        adminService.getMembershipTiers(),
        adminService.getDashboardOrderSummary(),
        adminService.getDashboardInventorySummary(),
      ]);

      setMembershipTiers(tiersData.sort((a, b) => Number(a.minSpend) - Number(b.minSpend)));
      setOrderSummary(orderSummaryData);
      setInventorySummary(inventorySummaryData);
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
      title: 'Quản Lý Cửa Hàng',
      description: 'Quản lý thông tin chi nhánh và cửa hàng',
      icon: <ShopOutlined className="text-2xl text-green-600" />,
      path: '/admin/stores',
    },
  ];

  const orderCircleStats = [
    {
      key: 'orders-total',
      title: 'Tổng đơn hàng',
      value: orderSummary.totalOrders,
      color: '#2563eb',
    },
    {
      key: 'orders-completed',
      title: 'Hoàn thành',
      value: orderSummary.completed,
      color: '#16a34a',
    },
    {
      key: 'orders-confirmed',
      title: 'Đã xác nhận',
      value: orderSummary.confirmed,
      color: '#0891b2',
    },
    {
      key: 'orders-cancelled',
      title: 'Bị hủy',
      value: orderSummary.cancelled,
      color: '#dc2626',
    },
  ] satisfies PieStat[];

  const inventoryCircleStats = [
    {
      key: 'inventory-total',
      title: 'Tổng sản phẩm',
      value: inventorySummary.totalProducts,
      color: '#334155',
    },
    {
      key: 'inventory-low-stock',
      title: 'Hàng Sắp hết',
      value: inventorySummary.lowStock,
      color: '#ea580c',
    },
    {
      key: 'inventory-reserved',
      title: 'Tổng Đặt trước',
      value: inventorySummary.totalReserved,
      color: '#2563eb',
    },
    {
      key: 'inventory-available',
      title: 'Tổng khả dụng',
      value: inventorySummary.totalAvailable,
      color: '#059669',
    },
  ] satisfies PieStat[];

  const orderTotal = getPieTotal(orderCircleStats);
  const inventoryTotal = getPieTotal(inventoryCircleStats);

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
                <Col xs={24} xl={12}>
                  <Card hoverable className="stat-card h-full overflow-hidden">
                    <Title level={5} className="!text-foreground !mb-4 text-center">
                      Chỉ số Đơn hàng
                    </Title>
                    <div className="flex flex-col items-center gap-6">
                      {/* Numbers + Percentages Above Circle */}
                      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {orderCircleStats.map((stat) => (
                          <div key={stat.key} className="text-center">
                            <Text className="text-muted-foreground text-xs block mb-1">
                              {stat.title}
                            </Text>
                            <Text strong className="text-lg">
                              {stat.value.toLocaleString('vi-VN')}
                            </Text>
                            <Text className="text-muted-foreground text-xs ml-1">
                              ({orderTotal > 0 ? ((stat.value / orderTotal) * 100).toFixed(1) : '0.0'}%)
                            </Text>
                          </div>
                        ))}
                      </div>

                      {/* Pie Circle */}
                      <div
                        className="w-[240px] h-[240px] rounded-full border border-border shrink-0"
                        style={{ background: getPieGradient(orderCircleStats) }}
                      />

                      {/* Legend Tags Below Circle */}
                      <div className="flex flex-wrap justify-center gap-3">
                        {orderCircleStats.map((stat) => (
                          <div key={stat.key} className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                            <Text className="text-sm">{stat.title}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} xl={12}>
                  <Card hoverable className="stat-card h-full overflow-hidden">
                    <Title level={5} className="!text-foreground !mb-4 text-center">
                      Chỉ số Tồn kho
                    </Title>
                    <div className="flex flex-col items-center gap-6">
                      {/* Numbers + Percentages Above Circle */}
                      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {inventoryCircleStats.map((stat) => (
                          <div key={stat.key} className="text-center">
                            <Text className="text-muted-foreground text-xs block mb-1">
                              {stat.title}
                            </Text>
                            <Text strong className="text-lg">
                              {stat.value.toLocaleString('vi-VN')}
                            </Text>
                            <Text className="text-muted-foreground text-xs ml-1">
                              ({inventoryTotal > 0 ? ((stat.value / inventoryTotal) * 100).toFixed(1) : '0.0'}%)
                            </Text>
                          </div>
                        ))}
                      </div>

                      {/* Pie Circle */}
                      <div
                        className="w-[240px] h-[240px] rounded-full border border-border shrink-0"
                        style={{ background: getPieGradient(inventoryCircleStats) }}
                      />

                      {/* Legend Tags Below Circle */}
                      <div className="flex flex-wrap justify-center gap-3">
                        {inventoryCircleStats.map((stat) => (
                          <div key={stat.key} className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                            <Text className="text-sm">{stat.title}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
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

        </>
      ),
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
      key: 'stores',
      label: (
        <span>
          <ShopOutlined /> Cửa Hàng
        </span>
      ),
      children: <AdminStores />,
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
