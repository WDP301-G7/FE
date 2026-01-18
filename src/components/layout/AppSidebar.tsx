import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  SettingOutlined,
  FileProtectOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const { Sider } = Layout;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole } = useAuth();

  // Define menu items based on user role
  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [];

    // Dashboard - available to all
    items.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    });

    // Orders - available to all
    items.push({
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
    });

    // Products - Manager only
    if (hasRole(['manager'])) {
      items.push({
        key: '/products',
        icon: <AppstoreOutlined />,
        label: 'Products',
      });
    }

    // Policies - Manager only
    if (hasRole(['manager'])) {
      items.push({
        key: '/policies',
        icon: <FileProtectOutlined />,
        label: 'Policies',
      });
    }

    // Users - Manager and Admin
    if (hasRole(['manager', 'admin'])) {
      items.push({
        key: '/users',
        icon: <TeamOutlined />,
        label: 'Users',
      });
    }

    // System Settings - Admin only
    if (hasRole(['admin'])) {
      items.push({
        key: 'system',
        icon: <SettingOutlined />,
        label: 'System',
        children: [
          {
            key: '/system-settings',
            icon: <SettingOutlined />,
            label: 'Settings',
          },
          {
            key: '/audit-logs',
            icon: <AuditOutlined />,
            label: 'Audit Logs',
          },
          {
            key: '/permissions',
            icon: <SafetyCertificateOutlined />,
            label: 'Permissions',
          },
        ],
      });
    }

    return items;
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      collapsedWidth={80}
      className="min-h-screen"
      theme="dark"
    >
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <EyeOutlined className="text-2xl text-sidebar-primary" />
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">
              VisionHub
            </span>
          )}
        </div>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={handleMenuClick}
        className="mt-2"
      />
    </Sider>
  );
};

export default AppSidebar;
