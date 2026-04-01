import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { operationsService } from '@/services/operations.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  Star,
  FileText,
  Clock3,
  PackageCheck,
  Ban,
  ArrowRight,
} from 'lucide-react';

interface OperationsStats {
  waiting: number;
  completed: number;
  cancelled: number;
}

const OperationsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OperationsStats>({
    waiting: 0,
    completed: 0,
    cancelled: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await operationsService.getAllOrders({ page: 1, limit: 1000 });
      const orders = response.orders || [];

      const waiting = orders.filter((order) =>
        ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'WAITING_CUSTOMER', 'PROCESSING', 'READY'].includes(order.status)
      ).length;

      const completed = orders.filter((order) => order.status === 'COMPLETED').length;
      const cancelled = orders.filter((order) => order.status === 'CANCELLED').length;

      setStats({ waiting, completed, cancelled });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải thống kê vận hành',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const actionCards = [
    {
      key: 'orders',
      title: 'Duyệt đơn hàng',
      desc: 'Kiểm tra, phân công và cập nhật trạng thái đơn hàng',
      icon: ClipboardCheck,
      accent: 'border-l-blue-500 from-blue-50 to-white',
      iconClass: 'text-blue-600',
      path: '/operations/orders',
    },
    {
      key: 'prescriptions',
      title: 'Đơn thuốc',
      desc: 'Xử lý yêu cầu đơn thuốc và tạo đơn kính',
      icon: FileText,
      accent: 'border-l-cyan-500 from-cyan-50 to-white',
      iconClass: 'text-cyan-600',
      path: '/operations/prescriptions',
    },
    {
      key: 'stores',
      title: 'Quản lý cửa hàng',
      desc: 'Theo dõi thông tin cửa hàng và vận hành chi nhánh',
      icon: Store,
      accent: 'border-l-green-500 from-green-50 to-white',
      iconClass: 'text-green-600',
      path: '/operations/stores',
    },
    {
      key: 'reviews',
      title: 'Quản lý đánh giá',
      desc: 'Theo dõi phản hồi của khách hàng và duyệt đánh giá',
      icon: Star,
      accent: 'border-l-violet-500 from-violet-50 to-white',
      iconClass: 'text-violet-600',
      path: '/operations/reviews',
    },
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Trang điều khiển vận hành</h1>
        <p className="text-muted-foreground">Điều phối đơn hàng, đơn thuốc, cửa hàng và đánh giá</p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="modules">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Chức năng
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
                <CardTitle className="text-sm font-medium text-cyan-700">Đơn đang xử lý</CardTitle>
                <Clock3 className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-700">{loading ? '...' : stats.waiting}</div>
                <p className="text-xs text-cyan-600">Gồm các trạng thái chờ xử lý đến sẵn sàng</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Đơn hoàn thành</CardTitle>
                <PackageCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{loading ? '...' : stats.completed}</div>
                <p className="text-xs text-green-600">Tổng số đơn đã giao thành công</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700">Đơn bị hủy</CardTitle>
                <Ban className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{loading ? '...' : stats.cancelled}</div>
                <p className="text-xs text-red-600">Cần theo dõi nguyên nhân hủy đơn</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <motion.div
            className="grid gap-4 md:grid-cols-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {actionCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.key}
                  type="button"
                  className={`text-left border-l-4 rounded-lg p-4 bg-gradient-to-br shadow-sm hover:shadow-md transition ${item.accent}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-5 w-5 ${item.iconClass}`} />
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default OperationsDashboard;
