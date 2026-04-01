import { api } from '@/lib/api';

export interface NotificationItem {
  id: string;
  userId?: string;
  type?: string;
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationListResponse {
  data?: NotificationItem[];
  items?: NotificationItem[];
  total?: number;
  page?: number;
  limit?: number;
}

class NotificationService {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const response = await api.get('/notifications', { params });
    const payload: NotificationListResponse | NotificationItem[] = response.data?.data ?? response.data;

    if (Array.isArray(payload)) {
      return {
        items: payload,
        total: payload.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }

    const items = payload?.items || payload?.data || [];

    return {
      items,
      total: payload?.total || items.length,
      page: payload?.page || params?.page || 1,
      limit: payload?.limit || params?.limit || 20,
    };
  }

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    const payload = response.data?.data ?? response.data;
    return Number(payload?.count || 0);
  }

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data?.data ?? response.data;
  }

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data?.data ?? response.data;
  }
}

export const notificationService = new NotificationService();
