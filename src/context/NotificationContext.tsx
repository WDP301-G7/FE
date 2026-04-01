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

// Aggressive polling for realtime feel - 2 seconds is much better than 5 seconds
const POLLING_INTERVAL_MS = 2000;

const NOTIFICATION_EVENT_KEYS = [
  'notification',
  'notifications',
  'new_notification',
  'new-notification',
];

// Debug flag: check logs to diagnose realtime issues
const DEBUG_NOTIFICATIONS = true;

const isNotificationEventName = (eventName: string) => {
  const key = eventName.toLowerCase();
  return NOTIFICATION_EVENT_KEYS.some((token) => key.includes(token));
};

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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unreadRef = useRef(0);

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
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      unreadRef.current = count;
    } catch (error) {
      // Silent error handling
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() } : item))
    );
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1);
      unreadRef.current = next;
      return next;
    });

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      await Promise.all([fetchNotifications(), refreshUnreadCount()]);
    }
  }, [fetchNotifications, refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })));
    setUnreadCount(0);
    unreadRef.current = 0;

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      await Promise.all([fetchNotifications(), refreshUnreadCount()]);
    }
  }, [fetchNotifications, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !isEligibleRole) {
      setNotifications([]);
      setUnreadCount(0);
      unreadRef.current = 0;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
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
      query: {
        token,
        userId: user?.id || '',
        role: user?.role || '',
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
        setUnreadCount((prev) => {
          const next = prev + 1;
          unreadRef.current = next;
          return next;
        });
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
        title: candidate.title || 'Thông báo mới',
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
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        unreadRef.current = next;
        return next;
      });
    };

    const handleReadAll = () => {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })));
      setUnreadCount(0);
      unreadRef.current = 0;
    };

    const handleAnySocketEvent = (eventName: string, payload: unknown) => {
      if (!isNotificationEventName(eventName)) {
        return;
      }
      handleIncomingNotification(payload);
    };

    socket.on('connect', () => {
      setIsConnected(true);
      
      const joinPayload = { userId: user?.id, role: user?.role };
      // Send multiple join contracts because each backend names these differently.
      socket.emit('notifications:join', joinPayload);
      socket.emit('notification:join', joinPayload);
      socket.emit('join_notifications', joinPayload);
      socket.emit('join:notifications', joinPayload);
      socket.emit('join-room', `user:${user?.id}`);
      socket.emit('joinRoom', `user:${user?.id}`);

      // Fetch latest notifications immediately upon connection
      void fetchNotifications();
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
    socket.onAny(handleAnySocketEvent);

    socket.connect();
    socketRef.current = socket;

    const syncNotifications = async () => {
      try {
        const [latestUnread, result] = await Promise.all([
          notificationService.getUnreadCount(),
          notificationService.getNotifications({ page: 1, limit: 20 }),
        ]);

        // Cập nhật unread count nếu khác
        if (latestUnread !== unreadRef.current) {
          setUnreadCount(latestUnread);
          unreadRef.current = latestUnread;
        }

        // Luôn cập nhật notifications list từ polling
        setNotifications(result.items || []);
      } catch (error) {
        // Silent error handling
      }
    };

    pollingRef.current = setInterval(() => {
      void syncNotifications();
    }, POLLING_INTERVAL_MS);

    return () => {
      socket.off('notification', handleIncomingNotification);
      socket.off('notification:new', handleIncomingNotification);
      socket.off('notification:created', handleIncomingNotification);
      socket.off('notifications:new', handleIncomingNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notifications:read-all', handleReadAll);
      socket.offAny(handleAnySocketEvent);
      socket.disconnect();
      socketRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
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
