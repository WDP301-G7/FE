import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DashboardStatCard,
  ActivityTimeline,
  StatusBadge,
  EnhancedTable,
  TableColumn,
  TableAction,
  SkeletonStats,
} from '@/components/dashboard';
import { ClipboardList, CheckCircle, Clock, Package, Eye } from 'lucide-react';

const getMockStats = () => ({
  assigned: { value: '8', trend: { value: 2, isPositive: true } },
  completed: { value: '15', trend: { value: 20, isPositive: true } },
  pending: { value: '3', trend: { value: -25, isPositive: true } },
});

const getMockOrders = () => [
  { id: 'ORD-101', customer: 'Nguyễn Văn A', status: 'in_progress', total: '₫1,250,000', date: '2026-03-06' },
  { id: 'ORD-102', customer: 'Trần Thị B', status: 'pending', total: '₫850,000', date: '2026-03-06' },
];

const getMockActivities = () => [
  {
    id: '1',
    title: 'Order assigned',
    description: 'ORD-101 assigned to you',
    timestamp: new Date('2026-03-06T10:30:00'),
    icon: ClipboardList,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
];

const StaffDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(getMockStats());
  const [orders, setOrders] = useState(getMockOrders());
  const [activities, setActivities] = useState(getMockActivities());

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const columns: TableColumn<{
    id: string;
    customer: string;
    total: string;
    status: string;
    date: string;
  }>[] = [
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'total', label: 'Total', sortable: true },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
    { key: 'date', label: 'Date', sortable: true },
  ];

  const actions: TableAction<{
    id: string;
    customer: string;
    total: string;
    status: string;
    date: string;
  }>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (order) => console.log('View', order.id),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your assigned orders and tasks</p>
      </div>

      {loading ? (
        <SkeletonStats count={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardStatCard
            title="Assigned Orders"
            value={stats.assigned.value}
            icon={ClipboardList}
            trend={stats.assigned.trend}
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <DashboardStatCard
            title="Completed Today"
            value={stats.completed.value}
            icon={CheckCircle}
            trend={stats.completed.trend}
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            iconColor="text-green-600 dark:text-green-400"
          />
          <DashboardStatCard
            title="Pending"
            value={stats.pending.value}
            icon={Clock}
            trend={stats.pending.trend}
            iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            iconColor="text-orange-600 dark:text-orange-400"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <EnhancedTable
            title="My Orders"
            description="Orders assigned to you"
            data={orders}
            columns={columns}
            actions={actions}
            searchable
            loading={loading}
            pageSize={10}
          />
        </div>
        <div>
          <ActivityTimeline activities={activities} title="My Activity" maxHeight="600px" />
        </div>
      </div>
    </motion.div>
  );
};

export default StaffDashboard;
