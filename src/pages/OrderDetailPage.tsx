import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { orderService, Order } from '@/services/order.service';
import { useToast } from '@/hooks/use-toast';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        return;
      }

      setLoading(true);
      try {
        const detail = await orderService.getOrder(orderId);
        setOrder(detail);
      } catch (error: any) {
        toast({
          title: 'Khong the tai chi tiet don hang',
          description: error?.response?.data?.message || 'Vui long thu lai.',
          variant: 'destructive',
        });
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, toast]);

  const statusColor = useMemo(() => {
    switch (order?.status) {
      case 'NEW':
        return 'bg-slate-100 text-slate-700';
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'WAITING_CUSTOMER':
        return 'bg-amber-100 text-amber-700';
      case 'READY':
        return 'bg-cyan-100 text-cyan-700';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }, [order?.status]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);

  const formatDateTime = (value?: string) => {
    if (!value) {
      return 'N/A';
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    return d.toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Chi tiet don hang</h1>
          <p className="text-sm text-muted-foreground">Theo doi thong tin day du cua don hang.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lai
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Dang tai du lieu don hang...</CardContent>
        </Card>
      )}

      {!loading && !order && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Khong tim thay don hang.</CardContent>
        </Card>
      )}

      {!loading && order && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg">{order.orderNumber || order.id}</CardTitle>
                <Badge className={statusColor}>{order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Thong tin khach hang</p>
                <p className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" />{order.customerName || 'N/A'}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{order.customerEmail || 'N/A'}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{order.customerPhone || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Thong tin don hang</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Tao: {formatDateTime(order.createdAt)}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Cap nhat: {formatDateTime(order.updatedAt)}</p>
                <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-0.5" />{order.shippingAddress || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Danh sach san pham</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>San pham</TableHead>
                    <TableHead className="text-right">So luong</TableHead>
                    <TableHead className="text-right">Don gia</TableHead>
                    <TableHead className="text-right">Thanh tien</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 border-t pt-4 flex justify-end">
                <p className="text-base font-semibold">Tong cong: {formatCurrency(order.totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OrderDetailPage;
