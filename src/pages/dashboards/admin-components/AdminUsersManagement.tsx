import React, { useState } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Input, Avatar, Switch } from 'antd';
import { motion } from 'framer-motion';
import { SearchOutlined, PlusOutlined, FilterOutlined, UserOutlined } from '@ant-design/icons';
import { mockUsers, User, roleLabels, roleColors } from '@/mock-data/users';

const { Title, Text } = Typography;

const AdminUsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);

  const handleToggleActive = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  // User statistics
  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    sales: users.filter(u => u.role === 'sales').length,
    operations: users.filter(u => u.role === 'operations').length,
    managers: users.filter(u => u.role === 'manager').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  const userColumns = [
    {
      title: 'Người Dùng',
      key: 'user',
      render: (_: unknown, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text className="text-muted-foreground text-xs">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai Trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: User['role']) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
      filters: [
        { text: 'Sales', value: 'sales' },
        { text: 'Operations', value: 'operations' },
        { text: 'Manager', value: 'manager' },
        { text: 'Admin', value: 'admin' },
      ],
      onFilter: (value: any, record: User) => record.role === value,
    },
    {
      title: 'Phòng Ban',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: User) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record.id)}
          checkedChildren="Hoạt Động"
          unCheckedChildren="Tắt"
        />
      ),
      filters: [
        { text: 'Hoạt Động', value: true },
        { text: 'Không Hoạt Động', value: false },
      ],
      onFilter: (value: any, record: User) => record.isActive === value,
    },
    {
      title: 'Hành Động',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" size="small">Chỉnh Sửa</Button>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground text-sm">Tổng</Text>
              <Title level={4} className="!mb-0 !text-foreground">{userStats.total}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground text-sm">Hoạt Động</Text>
              <Title level={4} className="!mb-0 !text-green-600">{userStats.active}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground text-sm">Sales</Text>
              <Title level={4} className="!mb-0 !text-purple-600">{userStats.sales}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground text-sm">Operations</Text>
              <Title level={4} className="!mb-0 !text-orange-600">{userStats.operations}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground text-sm">Managers</Text>
              <Title level={4} className="!mb-0 !text-cyan-600">{userStats.managers}</Title>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <Card className="stat-card">
            <div className="space-y-2">
              <Text className="text-muted-foreground text-sm">Admins</Text>
              <Title level={4} className="!mb-0 !text-gray-600">{userStats.admins}</Title>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <div className="flex items-center justify-between mb-4">
            <Title level={4} className="!text-foreground !mb-0">
              Quản Lý Người Dùng
            </Title>
            <Space>
              <Input
                placeholder="Tìm kiếm người dùng..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
              />
              <Button icon={<FilterOutlined />}>Lọc</Button>
              <Button type="primary" icon={<PlusOutlined />}>
                Thêm Người Dùng
              </Button>
            </Space>
          </div>
          <Table
            dataSource={users}
            columns={userColumns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} người dùng`,
            }}
          />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminUsersManagement;
