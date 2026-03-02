import React from 'react';
import { useAuth } from '@/context/AuthContext';
import ManagerDashboard from './dashboards/manager-components/ManagerDashboard';
import StaffDashboard from './dashboards/staff-components/StaffDashboard';
import OperationsDashboard from './dashboards/operations-components/OperationsDashboard';
import AdminDashboard from './dashboards/admin-components/AdminDashboard';

/**
 * Dashboard page that renders role-specific content
 * This component handles role-based rendering (RBAC at frontend level)
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Render the appropriate dashboard based on user role
  const role = user?.role?.toUpperCase();
  console.log('🔍 Dashboard routing - User role:', role, 'User:', user);
  
  switch (role) {
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'STAFF':
      return <StaffDashboard />;
    case 'OPERATION':
    case 'OPERATIONS':
      return <OperationsDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <StaffDashboard />;
  }
};

export default Dashboard;
