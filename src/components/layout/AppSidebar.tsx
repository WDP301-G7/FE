import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  FileText,
  Shield,
  Activity,
  Calendar,
  Eye,
  RefreshCw,
  Store,
  BarChart3,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();

  // Define all menu items
  const allMenuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
    },
    // Staff & Manager
    {
      key: '/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
      label: 'Orders',
      roles: ['STAFF', 'staff', 'MANAGER', 'manager'],
    },
    {
      key: '/returns',
      icon: <RefreshCw className="h-5 w-5" />,
      label: 'Đổi/Trả Hàng',
      roles: ['STAFF', 'staff', 'MANAGER', 'manager'],
    },
    // Operations
    {
      key: '/operations/orders',
      icon: <Calendar className="h-5 w-5" />,
      label: 'Duyệt Đơn Hàng',
      roles: ['OPERATIONS', 'operations', 'OPERATION', 'operation'],
    },
    {
      key: '/operations/prescriptions',
      icon: <FileText className="h-5 w-5" />,
      label: 'Đơn Thuốc',
      roles: ['OPERATIONS', 'operations', 'OPERATION', 'operation'],
    },
    {
      key: '/operations/returns',
      icon: <RefreshCw className="h-5 w-5" />,
      label: 'Trả Hàng',
      roles: ['OPERATIONS', 'operations', 'OPERATION', 'operation'],
    },
    {
      key: '/operations/inventory',
      icon: <ClipboardList className="h-5 w-5" />,
      label: 'Quản Lý Kho',
      roles: ['OPERATIONS', 'operations', 'OPERATION', 'operation'],
    },
    {
      key: '/operations/stores',
      icon: <Store className="h-5 w-5" />,
      label: 'Cửa Hàng',
      roles: ['OPERATIONS', 'operations', 'OPERATION', 'operation'],
    },
    // Admin
    {
      key: '/admin/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
      label: 'Quản Lý Đơn Hàng',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/admin/stores',
      icon: <Store className="h-5 w-5" />,
      label: 'Quản Lý Cửa Hàng',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/admin/inventory',
      icon: <ClipboardList className="h-5 w-5" />,
      label: 'Quản Lý Kho Hàng',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/admin/products',
      icon: <Package className="h-5 w-5" />,
      label: 'Quản Lý Sản Phẩm',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      label: 'Quản Lý Người Dùng',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/admin/systems',
      icon: <Settings className="h-5 w-5" />,
      label: 'Quản Lý Hệ Thống',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/audit-logs',
      icon: <Activity className="h-5 w-5" />,
      label: 'Audit Logs',
      roles: ['admin', 'ADMIN'],
    },
    {
      key: '/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Analytics',
      roles: ['admin', 'ADMIN', 'MANAGER', 'manager'],
    },
    {
      key: '/permissions',
      icon: <Shield className="h-5 w-5" />,
      label: 'Permissions',
      roles: ['admin', 'ADMIN'],
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter((item) => {
    if (!item.roles) return true; // Show to all if no roles specified
    return hasRole(item.roles);
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col border-r border-border bg-card h-screen"
    >
      {/* Logo Header */}
      <div className="flex items-center justify-center h-16 border-b border-border px-4">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">
                EyeCare Store
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2 bg-primary/10 rounded-lg"
            >
              <Eye className="h-5 w-5 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              variant={isActive(item.key) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 transition-all duration-200',
                isActive(item.key)
                  ? 'bg-primary/10 text-primary hover:bg-primary/15 border-l-2 border-primary'
                  : 'hover:bg-muted border-l-2 border-transparent',
                collapsed && 'justify-center'
              )}
              onClick={() => navigate(item.key)}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse Button */}
      <div className="p-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onCollapse(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
