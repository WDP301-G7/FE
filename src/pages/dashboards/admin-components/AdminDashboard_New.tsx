import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DashboardStatCard,
  ActivityTimeline,
  QuickActionButton,
  DashboardChart,
  SkeletonStats,
  SkeletonChart,
  StatusBadge,
  EnhancedTable,
  TableColumn,
  TableAction,
} from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Plus,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

// Mock data - Replace with actual API calls
const getMockStats = () => ({
  revenue: { value: '₫125,430,000', trend: { value: 12.5, isPositive: true } },
  orders: { value: '342', trend: { value: 8.2, isPositive: true } },
  customers: { value: '1,234', trend: { value: 5.4, isPositive: true } },
  products: { value: '456', trend: { value: -2.1, isPositive: false } },
});

const getMockChartData = () => [
  { day: 'Mon', revenue: 12000000, orders: 45 },
  { day: 'Tue', revenue: 15000000, orders: 52 },
  { day: 'Wed', revenue: 11000000, orders: 38 },
  { day: 'Thu', revenue: 18000000, orders: 65 },
  { day: 'Fri', revenue: 22000000, orders: 78 },
  { day: 'Sat', revenue: 28000000, orders: 95 },
  { day: 'Sun', revenue: 19000000, orders: 70 },
];

const getMockRecentOrders = () => [
  {
    id: 'ORD-001',
    customer: 'Nguyễn Văn A',
    total: '₫1,250,000',
    status: 'completed',
    date: '2026-03-06',
  },
  {
    id: 'ORD-002',
    customer: 'Trần Thị B',
    total: '₫850,000',
    status: 'pending',
    date: '2026-03-06',
  },
  {
    id: 'ORD-003',
    customer: 'Lê Văn C',
    total: '₫2,300,000',
    status: 'processing',
    date: '2026-03-05',
  },
  {
    id: 'ORD-004',
    customer: 'Phạm Thị D',
    total: '₫675,000',
    status: 'cancelled',
    date: '2026-03-05',
  },
];

const getMockActivities = () => [
  {
    id: '1',
    title: 'New product added',
    description: 'Gọng kính RAY-BAN RB2140 was added to inventory',
    timestamp: new Date('2026-03-06T10:30:00'),
    icon: Package,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: '2',
    title: 'Order placed',
    description: 'Order #ORD-001 placed by Nguyễn Văn A',
    timestamp: new Date('2026-03-06T09:15:00'),
    icon: ShoppingCart,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    id: '3',
    title: 'New customer registered',
    description: 'Trần Thị E registered as new customer',
    timestamp: new Date('2026-03-05T16:45:00'),
    icon: Users,
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    id: '4',
    title: 'Product updated',
    description: 'Price updated for Tròng kính Essilor',
    timestamp: new Date('2026-03-05T14:20:00'),
    icon: Edit,
    iconColor: 'text-orange-600',
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(getMockStats());
  const [chartData, setChartData] = useState(getMockChartData());
  const [recentOrders, setRecentOrders] = useState(getMockRecentOrders());
  const [activities, setActivities] = useState(getMockActivities());

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const orderColumns: TableColumn<{
    id: string;
    customer: string;
    total: string;
    status: string;
    date: string;
  }>[] = [
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'total', label: 'Total', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    { key: 'date', label: 'Date', sortable: true },
  ];

  const orderActions: TableAction<{
    id: string;
    customer: string;
    total: string;
    status: string;
    date: string;
  }>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (order) => navigate(`/admin/orders/${order.id}`),
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (order) => navigate(`/admin/orders/${order.id}/edit`),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (order) => console.log('Delete', order.id),
      variant: 'destructive',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickActionButton
            icon={Plus}
            label="Add Product"
            onClick={() => navigate('/admin/products')}
          />
          <QuickActionButton
            icon={ShoppingCart}
            label="Create Order"
            onClick={() => navigate('/admin/orders/create')}
            variant="outline"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <SkeletonStats count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard
            title="Total Revenue"
            value={stats.revenue.value}
            icon={DollarSign}
            trend={stats.revenue.trend}
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            iconColor="text-green-600 dark:text-green-400"
          />
          <DashboardStatCard
            title="Total Orders"
            value={stats.orders.value}
            icon={ShoppingCart}
            trend={stats.orders.trend}
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <DashboardStatCard
            title="Total Customers"
            value={stats.customers.value}
            icon={Users}
            trend={stats.customers.trend}
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <DashboardStatCard
            title="Total Products"
            value={stats.products.value}
            icon={Package}
            trend={stats.products.trend}
            iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            iconColor="text-orange-600 dark:text-orange-400"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <DashboardChart
              title="Revenue Trend"
              description="Last 7 days revenue performance"
              data={chartData}
              type="area"
              xKey="day"
              yKey="revenue"
              color="#10b981"
            />
            <DashboardChart
              title="Orders per Day"
              description="Last 7 days order volume"
              data={chartData}
              type="bar"
              xKey="day"
              yKey="orders"
              color="#3b82f6"
            />
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Orders - Takes 2 columns */}
        <div className="md:col-span-2">
          <EnhancedTable
            title="Recent Orders"
            description="Latest customer orders"
            data={recentOrders}
            columns={orderColumns}
            actions={orderActions}
            searchable
            searchPlaceholder="Search orders..."
            loading={loading}
            pageSize={5}
          />
        </div>

        {/* Activity Timeline - Takes 1 column */}
        <div>
          <ActivityTimeline
            activities={activities}
            title="Recent Activity"
            maxHeight="600px"
          />
        </div>
      </div>

      {/* Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>System Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Product Management</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Manage inventory and products
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">User Management</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Manage users and permissions
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              <p className="text-muted-foreground">
                Product management content goes here...
              </p>
            </TabsContent>
            <TabsContent value="users" className="mt-6">
              <p className="text-muted-foreground">
                User management content goes here...
              </p>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <p className="text-muted-foreground">
                System settings content goes here...
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;
