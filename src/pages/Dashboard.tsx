import React from 'react';
import { useAuth } from '@/context/AuthContext';
import ManagerDashboard from './dashboards/ManagerDashboard';
import SalesDashboard from './dashboards/SalesDashboard';
import OperationsDashboard from './dashboards/OperationsDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

/**
 * Dashboard page that renders role-specific content
 * This component handles role-based rendering (RBAC at frontend level)
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Render the appropriate dashboard based on user role
  switch (user?.role) {
    case 'manager':
      return <ManagerDashboard />;
    case 'sales':
      return <SalesDashboard />;
    case 'operations':
      return <OperationsDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <SalesDashboard />;
  }
};

export default Dashboard;
