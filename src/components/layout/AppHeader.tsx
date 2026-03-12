import React from 'react';
import { Layout, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { roleLabels } from '@/mock-data/users';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'sales':
        return 'role-badge role-badge-sales';
      case 'operations':
        return 'role-badge role-badge-operations';
      case 'manager':
        return 'role-badge role-badge-manager';
      case 'admin':
        return 'role-badge role-badge-admin';
      default:
        return 'role-badge';
    }
  };

  return (
    <Header className="flex items-center justify-between px-8 pt-2 bg-card border-b border-border h-16">
      <div className="flex items-center gap-4">
        <Text className="text-lg font-semibold text-foreground hidden md:block ">
          EyeCare Store Management System
        </Text>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <BellOutlined className="text-xl text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <Avatar
              size={36}
              icon={<UserOutlined />}
              className="bg-primary"
            />
            <div className="hidden md:flex flex-col items-start">
              <Text className="text-sm font-medium text-foreground">
                {user?.name}
              </Text>
              <span className={getRoleBadgeClass(user?.role || '')}>
                {user?.role && roleLabels[user.role]}
              </span>
            </div>
          </button>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AppHeader;
