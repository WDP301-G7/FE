import { api } from '@/lib/api';
import type { Order } from './order.service';

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page?: number;
  limit?: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  assignedTo?: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
}

export interface ConfirmOrderData {
  appointmentDate: string; // ISO string
  appointmentNote?: string;
  assignedStaffId?: string;
}

export interface CancelOrderData {
  reason: string;
}

export interface UpdateStatusData {
  status: string; // e.g. 'NEW', 'CONFIRMED', ...
}

export interface OrderStats {
  totalOrders: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipping: number;
  delivered: number;
  cancelled: number;
  [key: string]: number;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface PaginatedUsers {
  items: UserSummary[];
  total: number;
  page?: number;
  limit?: number;
}

class AdminService {
  /** Get all orders with optional filters (admin) */
  async getOrders(params?: GetOrdersParams): Promise<PaginatedOrders> {
    const response = await api.get<{ data: PaginatedOrders }>('/orders', { params });
    return response.data.data;
  }

  /** Get users (optionally filtered by role) */
  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<PaginatedUsers> {
    const response = await api.get<{ data: PaginatedUsers }>('/users', { params });
    return response.data.data;
  }

  /** Get orders assigned to the currently authenticated staff */
  async getAssignedOrders(): Promise<{ items: Order[] }> {
    const response = await api.get<{ data: { items: Order[] } }>('/orders/assigned');
    return response.data.data;
  }

  /** Get single order by id */
  async getOrder(id: string): Promise<Order> {
    const response = await api.get<{ data: Order }>(`/orders/${id}`);
    return response.data.data;
  }

  
  async confirmOrder(id: string, payload: ConfirmOrderData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`/orders/${id}/confirm`, payload);
    return response.data.data;
  }

  /** Cancel an order (admin) */
  async cancelOrder(id: string, payload: CancelOrderData): Promise<Order> {
    const response = await api.post<{ data: Order }>(`/orders/${id}/cancel`, payload);
    return response.data.data;
  }

  /** Force update order status (admin only) */
  async forceUpdateStatus(id: string, payload: UpdateStatusData): Promise<Order> {
    const response = await api.put<{ data: Order }>(`/orders/${id}/status`, payload);
    return response.data.data;
  }

  /** Get orders statistics */
  async getStats(): Promise<OrderStats> {
    const response = await api.get<{ data: OrderStats }>('/orders/stats');
    return response.data.data;
  }
}

export const adminService = new AdminService();
