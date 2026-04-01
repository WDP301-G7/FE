import React from 'react';
import OrderOperationsPage from '../operations-components/OrderOperationsPage';

const AdminOrdersManagement: React.FC = () => {
  return <OrderOperationsPage allowedRoles={['ADMIN', 'admin', 'OPERATIONS', 'operations']} />;
};

export default AdminOrdersManagement;
