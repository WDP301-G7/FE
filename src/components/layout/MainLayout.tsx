import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout className="min-h-screen">
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AppHeader />
        <Content className="p-6 bg-background overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
