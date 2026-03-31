import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationItem } from '@/services/notification.service';
import { Bell, CheckCheck, Circle, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getRoleBadgeColor = (role: string) => {
    const normalizedRole = role?.toLowerCase();
    switch (normalizedRole) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'manager':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'operations':
      case 'operation':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'staff':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatNotificationTime = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const selectedDataPreview = useMemo(() => {
    if (!selectedNotification?.data) {
      return '';
    }

    try {
      return JSON.stringify(selectedNotification.data, null, 2);
    } catch {
      return String(selectedNotification.data);
    }
  }, [selectedNotification]);

  const extractOrderIdFromNotification = (notification?: NotificationItem | null) => {
    if (!notification?.data || typeof notification.data !== 'object') {
      return null;
    }

    const data = notification.data as Record<string, unknown>;

    const directOrderId =
      typeof data.orderId === 'string' ? data.orderId :
      typeof data.order_id === 'string' ? data.order_id :
      typeof data.orderID === 'string' ? data.orderID :
      null;

    if (directOrderId) {
      return directOrderId;
    }

    const nestedOrder = (typeof data.order === 'object' && data.order !== null)
      ? (data.order as Record<string, unknown>)
      : null;

    if (!nestedOrder) {
      return null;
    }

    if (typeof nestedOrder.id === 'string') {
      return nestedOrder.id;
    }

    if (typeof nestedOrder.orderId === 'string') {
      return nestedOrder.orderId;
    }

    return null;
  };

  const handleGoToOrderDetail = (notification?: NotificationItem | null) => {
    const orderId = extractOrderIdFromNotification(notification);
    if (!orderId) {
      return;
    }

    setSelectedNotification(null);

    // Navigate based on user role
    const role = user?.role?.toLowerCase();
    let targetPath = '/orders';

    if (role === 'operations' || role === 'operation') {
      targetPath = '/operations/orders';
    } else if (role === 'admin') {
      targetPath = '/admin/orders';
    }

    navigate(`${targetPath}?orderId=${encodeURIComponent(orderId)}`);
  };

  const selectedOrderId = useMemo(() => extractOrderIdFromNotification(selectedNotification), [selectedNotification]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
        {/* Left section - Logo or Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">EyeCare Store</h1>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="relative rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => {
                  void fetchNotifications({ page: 1, limit: 20 });
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] leading-[14px] font-semibold border-2 border-background flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {!isConnected && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-background"
                    title="Realtime disconnected"
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] p-0">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Thông báo</span>
                  <span className="text-xs text-muted-foreground">
                    {unreadCount} Chưa đọc
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    void markAllAsRead();
                  }}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Đánh dấu đọc hết
                </Button>
              </div>

              <ScrollArea className="max-h-96">
                <div className="py-1">
                  {loading && (
                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                      Dang tai thong bao...
                    </div>
                  )}

                  {!loading && notifications.length === 0 && (
                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                      Không có thông báo nào
                    </div>
                  )}

                  {!loading &&
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="items-start gap-3 px-3 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedNotification(notification);
                          if (!notification.isRead) {
                            void markAsRead(notification.id);
                          }
                        }}
                      >
                        <Circle
                          className={cn(
                            'h-2.5 w-2.5 mt-1.5 shrink-0',
                            notification.isRead
                              ? 'fill-muted-foreground/20 text-muted-foreground/20'
                              : 'fill-cyan-500 text-cyan-500'
                          )}
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="text-sm font-medium leading-tight break-words">
                            {notification.title || 'Thong bao he thong'}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 gap-3 rounded-full pl-2 pr-3 hover:bg-muted"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">
                    {user?.name}
                  </span>
                  <Badge
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-4 font-medium',
                      getRoleBadgeColor(user?.role || '')
                    )}
                  >
                    {user?.role}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/users/${user?.id}`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </header>

      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title || 'Thong bao he thong'}</DialogTitle>
            <DialogDescription>
              {selectedNotification ? formatNotificationTime(selectedNotification.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground mb-1">Trạng thái</p>
                  <p className="font-medium">
                    {selectedNotification.isRead ? 'Da doc' : 'Chua doc'}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground mb-1">Loại</p>
                  <p className="font-medium break-all">{selectedNotification.type || 'N/A'}</p>
                </div>
                <div className="rounded-md border p-3 sm:col-span-2">
                  <p className="text-muted-foreground mb-1">Mã thông báo</p>
                  <p className="font-medium break-all">{selectedNotification.id}</p>
                </div>
              </div>

              {selectedDataPreview && (
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Dữ liệu đính kèm</p>
                  <ScrollArea className="max-h-48">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {selectedDataPreview}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNotification(null)}>
              Đóng
            </Button>
            <Button
              onClick={() => handleGoToOrderDetail(selectedNotification)}
              disabled={!selectedOrderId}
            >
              Chi tiết đơn hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppHeader;
