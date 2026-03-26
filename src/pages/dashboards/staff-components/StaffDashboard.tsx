import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyAssignedOrders } from './MyAssignedOrders';
import { ReturnManagement } from './ReturnManagement';
import { LayoutDashboard, ClipboardList, Clock, ShoppingCart, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { orderService } from '@/services/order.service';
import { useToast } from '@/hooks/use-toast';

interface StaffStats {
  pending: number;
  processing: number;
  totalCompleted: number;
}

const StaffDashboard: React.FC = () => {
  console.log('✅ StaffDashboard component loaded');
  const { toast } = useToast();
  const [stats, setStats] = useState<StaffStats>({
    pending: 0,
    processing: 0,
    totalCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all assigned orders and calculate stats from actual data
      const allOrders = await orderService.getAssignedOrders({ limit: 1000 });
      console.log('📊 All assigned orders loaded:', allOrders.items.length);
      
      // Count by status
      const pending = allOrders.items.filter((order: any) => 
        order.status === 'CONFIRMED' || order.status === 'WAITING_CUSTOMER'
      ).length;
      
      const processing = allOrders.items.filter((order: any) => 
        order.status === 'PROCESSING' || order.status === 'READY'
      ).length;
      
      const totalCompleted = allOrders.items.filter((order: any) => 
        order.status === 'COMPLETED'
      ).length;
      
      console.log('📊 Calculated stats:', { pending, processing, totalCompleted });
      
      setStats({
        pending,
        processing,
        totalCompleted,
      });
    } catch (error: any) {
      console.error('❌ Failed to load staff stats:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);


  
  return (
    <motion.div 
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Trang Điều Khiển Staff</h1>
        <p className="text-muted-foreground">Xử lý và quản lý đơn hàng của khách hàng</p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ClipboardList className="h-4 w-4 mr-2" />
            My Orders
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RefreshCw className="h-4 w-4 mr-2" />
            Đổi/Trả hàng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-cyan-700">Chờ làm</CardTitle>
                <Clock className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-700">
                  {loading ? '...' : stats.pending}
                </div>
                <p className="text-xs text-cyan-600">Đơn đã xác nhận & chờ làm</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Đang Làm</CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  {loading ? '...' : stats.processing}
                </div>
                <p className="text-xs text-purple-600">Đang xử lý & sẵn sàng</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Tổng đơn đã hoàn thành</CardTitle>
                <span className="text-2xl">✅</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {loading ? '...' : stats.totalCompleted}
                </div>
                <p className="text-xs text-green-600">Tất cả đơn đã giao thành công</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card>
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
              <CardDescription>Hiệu suất của bạn hôm nay</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Phân tích hiệu suất đang phát triển...</p>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="orders">
          <MyAssignedOrders />
        </TabsContent>

        <TabsContent value="returns">
          <ReturnManagement />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default StaffDashboard;
