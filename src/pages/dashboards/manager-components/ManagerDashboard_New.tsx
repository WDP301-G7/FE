import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DashboardStatCard,
  DashboardChart,
  SkeletonStats,
  SkeletonChart,
} from '@/components/dashboard';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';

const getMockStats = () => ({
  revenue: { value: '₫125,430,000', trend: { value: 12.5, isPositive: true } },
  orders: { value: '342', trend: { value: 8.2, isPositive: true } },
  averageOrder: { value: '₫367,000', trend: { value: 5.4, isPositive: true } },
  customers: { value: '1,234', trend: { value: 3.2, isPositive: true } },
});

const getMockChartData = () => [
  { day: 'Mon', revenue: 12000000 },
  { day: 'Tue', revenue: 15000000 },
  { day: 'Wed', revenue: 11000000 },
  { day: 'Thu', revenue: 18000000 },
  { day: 'Fri', revenue: 22000000 },
  { day: 'Sat', revenue: 28000000 },
  { day: 'Sun', revenue: 19000000 },
];

const ManagerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(getMockStats());
  const [chartData, setChartData] = useState(getMockChartData());

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of store performance and metrics</p>
      </div>

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
            title="Average Order"
            value={stats.averageOrder.value}
            icon={TrendingUp}
            trend={stats.averageOrder.trend}
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <DashboardStatCard
            title="Total Customers"
            value={stats.customers.value}
            icon={Users}
            trend={stats.customers.trend}
            iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            iconColor="text-orange-600 dark:text-orange-400"
          />
        </div>
      )}

      {loading ? (
        <SkeletonChart />
      ) : (
        <DashboardChart
          title="Revenue Overview"
          description="Last 7 days performance"
          data={chartData}
          type="area"
          xKey="day"
          yKey="revenue"
          color="#10b981"
        />
      )}
    </motion.div>
  );
};

export default ManagerDashboard;
