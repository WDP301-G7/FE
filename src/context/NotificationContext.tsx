import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { notificationService, NotificationItem } from '@/services/notification.service';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  isConnected: boolean;
  fetchNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, '')
    : 'http://localhost:3000');

const RELEVANT_ROLES = new Set(['admin', 'operations', 'operation', 'staff', 'sales']);

const normalizeNotification = (payload: unknown): NotificationItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const message = typeof data.message === 'string' ? data.message : '';

  if (!message) {
    return null;
  }

  return {
    id: String(data.id || crypto.randomUUID()),
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    type: typeof data.type === 'string' ? data.type : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    message,
    data: typeof data.data === 'object' && data.data !== null ? (data.data as Record<string, unknown>) : undefined,
    isRead: Boolean(data.isRead),
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    readAt: typeof data.readAt === 'string' ? data.readAt : null,
  };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const isEligibleRole = useMemo(() => {
    const role = user?.role?.toLowerCase();
    return !!role && RELEVANT_ROLES.has(role);
  }, [user?.role]);

  const fetchNotifications = useCallback(async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({ page: 1, limit: 20, ...params });
      setNotifications(result.items || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      await Promise.all([fetchNotifications(), refreshUnreadCount()]);
    }
  }, [fetchNotifications, refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      await Promise.all([fetchNotifications(), refreshUnreadCount()]);
    }
  }, [fetchNotifications, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !isEligibleRole) {
      setNotifications([]);
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    void Promise.all([fetchNotifications(), refreshUnreadCount()]);

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      auth: {
        token,
        authorization: `Bearer ${token}`,
      },
    });

    const upsertNotification = (notification: NotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notification.id);
        if (exists) {
          return prev.map((item) => (item.id === notification.id ? { ...item, ...notification } : item));
        }
        return [notification, ...prev].slice(0, 50);
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleIncomingNotification = (payload: unknown) => {
      const candidate =
        normalizeNotification((payload as Record<string, unknown>)?.notification) ||
        normalizeNotification((payload as Record<string, unknown>)?.data) ||
        normalizeNotification(payload);

      if (!candidate) {
        return;
      }

      upsertNotification(candidate);

      toast({
        title: candidate.title || 'Thong bao moi',
        description: candidate.message,
      });
    };

    const handleNotificationRead = (payload: unknown) => {
      const id = typeof (payload as Record<string, unknown>)?.id === 'string'
        ? ((payload as Record<string, unknown>).id as string)
        : undefined;

      if (!id) {
        return;
      }

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleReadAll = () => {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })));
      setUnreadCount(0);
    };

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('notifications:join', { userId: user?.id, role: user?.role });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification', handleIncomingNotification);
    socket.on('notification:new', handleIncomingNotification);
    socket.on('notification:created', handleIncomingNotification);
    socket.on('notifications:new', handleIncomingNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notifications:read-all', handleReadAll);

    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.off('notification', handleIncomingNotification);
      socket.off('notification:new', handleIncomingNotification);
      socket.off('notification:created', handleIncomingNotification);
      socket.off('notifications:new', handleIncomingNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notifications:read-all', handleReadAll);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, isEligibleRole, fetchNotifications, refreshUnreadCount, user?.id, user?.role]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      isConnected,
      fetchNotifications,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, loading, isConnected, fetchNotifications, refreshUnreadCount, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
