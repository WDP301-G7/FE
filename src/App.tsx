import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import { MyAssignedOrders } from "@/pages/dashboards/staff-components/MyAssignedOrders";
import { ReturnManagement } from "@/pages/dashboards/staff-components/ReturnManagement";
import ReturnPage from "@/pages/dashboards/operations-components/ReturnPage";
import AdminOrdersManagement from "@/pages/dashboards/admin-components/AdminOrdersManagement";
import AdminUsersManagement from "@/pages/dashboards/admin-components/AdminUsersManagement";
import AdminSystemsManagement from "@/pages/dashboards/admin-components/AdminSystemsManagement";
import { AdminProductManagement } from "@/pages/dashboards/admin-components/AdminProductManagement";
import { AdminReviews } from "@/pages/dashboards/admin-components/AdminReviews";
import AdminStoresManagement from "@/pages/dashboards/admin-components/AdminStoresManagement";

// operations role pages
import OperationsOrderOps from "@/pages/dashboards/operations-components/OrderOperationsPage";
import OperationsStores from "@/pages/dashboards/operations-components/StoresManagement";
import OperationsInventory from "@/pages/dashboards/operations-components/InventoryManagement";
import PrescriptionRequestsPage from "@/pages/dashboards/operations-components/PrescriptionRequestsPage";
import NotFound from "./pages/NotFound";

import ReviewManagementPage from "./pages/dashboards/operations-components/ReviewManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0891b2',
          borderRadius: 8,
        },
      }}
    >
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<MyAssignedOrders />} />
                <Route path="returns" element={<ReturnManagement />} />
                <Route path="admin/orders" element={<AdminOrdersManagement />} />
                <Route path="admin/users" element={<AdminUsersManagement />} />
                <Route path="admin/systems" element={<AdminSystemsManagement />} />
                <Route path="admin/stores" element={<AdminStoresManagement />} />
                

                {/* operations-specific routes */}
                <Route path="operations/orders" element={<OperationsOrderOps />} />
                <Route path="operations/prescriptions" element={<PrescriptionRequestsPage />} />
                <Route path="operations/stores" element={<OperationsStores />} />
                <Route path="operations/inventory" element={<OperationsInventory />} />
                <Route path="operations/returns" element={<ReturnPage />} />
                <Route path="operations/reviews" element={<ReviewManagementPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
