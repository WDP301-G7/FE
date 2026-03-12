import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  SettingOutlined,
  FileProtectOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  EyeOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const { Sider } = Layout;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();

  const getMenuItems = (): MenuProps["items"] => {
    const items: MenuProps["items"] = [];

    // Dashboard
    items.push({
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    });

    // Staff + Manager
    if (hasRole(["STAFF", "staff", "MANAGER", "manager"])) {
      items.push({
        key: "/orders",
        icon: <ShoppingCartOutlined />,
        label: "Orders",
      });
    }

    // Operations
    if (hasRole(["OPERATIONS", "operations", "OPERATION", "operation"])) {
      items.push(
        {
          key: "/operations/orders",
          icon: <CalendarOutlined />,
          label: "Duyệt Đơn Hàng",
        },
        {
          key: "/operations/prescriptions",
          icon: <FileProtectOutlined />,
          label: "Đơn Thuốc",
        },
        {
          key: "/operations/returns",
          icon: <RetweetOutlined />,
          label: "Trả Hàng",
        },
        {
          key: "/operations/reviews",
          icon: <AppstoreOutlined />,
          label: "Quản Lý Đánh Giá",
        }
      );
    }

    // Admin
    if (hasRole(["ADMIN", "admin"])) {
      items.push(
        {
          key: "/admin/orders",
          icon: <ShoppingCartOutlined />,
          label: "Quản Lý Đơn Hàng",
        },
        {
          key: "/admin/approve-orders",
          icon: <CalendarOutlined />,
          label: "Duyệt Đơn",
        },
        {
          key: "/admin/stores",
          icon: <AppstoreOutlined />,
          label: "Quản Lý Cửa Hàng",
        },
        {
          key: "/admin/inventory",
          icon: <FileProtectOutlined />,
          label: "Quản Lý Kho Hàng",
        },
        {
          key: "/admin/users",
          icon: <TeamOutlined />,
          label: "Quản Lý Người Dùng",
        },
        {
          key: "/admin/systems",
          icon: <SettingOutlined />,
          label: "Quản Lý Hệ Thống",
        },
        {
          key: "/audit-logs",
          icon: <AuditOutlined />,
          label: "Audit Logs",
        },
        {
          key: "/permissions",
          icon: <SafetyCertificateOutlined />,
          label: "Permissions",
        }
      );
    }

    return items;
  };

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      collapsedWidth={80}
      className="min-h-screen bg-white border-r border-gray-200"
      trigger={null}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
        <EyeOutlined className="text-2xl text-indigo-600" />

        {!collapsed && (
          <span className="text-lg font-semibold text-gray-700">
            EyeCare Store
          </span>
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={handleMenuClick}
        className="mt-4 border-none sidebar-menu"
        style={{ background: "transparent" }}
      />
    </Sider>
  );
};

export default AppSidebar;