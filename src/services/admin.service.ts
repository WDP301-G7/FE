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

// ============ MEMBERSHIP TYPES ============

export interface MembershipTier {
  id: string;
  name: string;
  minSpend: number;
  maxSpend?: number | null;
  discountPercent: number;
  warrantyMonths: number; // Thời hạn bảo hành (tháng)
  returnDays: number; // Thời hạn trả hàng (ngày)
  exchangeDays: number; // Thời hạn đổi hàng (ngày)
  description?: string;
  benefits?: string[];
  color?: string; // For UI display
  icon?: string; // For UI display (🥉 🥈 🥇)
  sortOrder?: number; // Thứ tự hiển thị
  periodDays?: number; // Số ngày 1 kỳ đánh giá
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    users: number;
  };
}

export interface CreateMembershipTierPayload {
  name: string;
  minSpend: number;
  maxSpend?: number | null;
  discountPercent: number;
  warrantyMonths: number;
  returnDays: number;
  exchangeDays: number;
  description?: string;
  benefits?: string[];
  color?: string;
  icon?: string;
  sortOrder?: number;
  periodDays?: number;
}

export interface UpdateMembershipTierPayload {
  name?: string;
  minSpend?: number;
  maxSpend?: number | null;
  discountPercent?: number;
  warrantyMonths?: number;
  returnDays?: number;
  exchangeDays?: number;
  description?: string;
  benefits?: string[];
  color?: string;
  icon?: string;
  sortOrder?: number;
  periodDays?: number;
}

export interface UserMembership {
  userId: string;
  currentTier: MembershipTier;
  accumulatedSpending: number;
  nextTier?: MembershipTier | null;
  spendingToNextTier?: number;
  discountPercent: number;
  joinedDate?: string;
  lastUpdated?: string;
}

export interface AdjustPointsPayload {
  amount: number; // Positive to add, negative to subtract
  reason: string; // Explanation for the adjustment
  note?: string; // Optional additional notes
}

export interface PointsHistoryEntry {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  note?: string;
  adjustedBy?: string; // Staff/Admin who made the adjustment
  createdAt: string;
}

export interface PaginatedPointsHistory {
  items: PointsHistoryEntry[];
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

  // ============ MEMBERSHIP TIER MANAGEMENT ============
  
  /** Get all membership tiers */
  async getMembershipTiers(): Promise<MembershipTier[]> {
    const response = await api.get<{ data: MembershipTier[] }>('/membership/tiers');
    return response.data.data;
  }

  /** Get single membership tier by ID */
  async getMembershipTier(id: string): Promise<MembershipTier> {
    const response = await api.get<{ data: MembershipTier }>(`/membership/tiers/${id}`);
    return response.data.data;
  }

  /** Create new membership tier (admin only) */
  async createMembershipTier(payload: CreateMembershipTierPayload): Promise<MembershipTier> {
    const response = await api.post<{ data: MembershipTier }>('/membership/tiers', payload);
    return response.data.data;
  }

  /** Update membership tier (admin only) */
  async updateMembershipTier(id: string, payload: UpdateMembershipTierPayload): Promise<MembershipTier> {
    const response = await api.put<{ data: MembershipTier }>(`/membership/tiers/${id}`, payload);
    return response.data.data;
  }

  /** Delete membership tier (admin only) */
  async deleteMembershipTier(id: string): Promise<void> {
    await api.delete(`/membership/tiers/${id}`);
  }

  // ============ USER POINTS MANAGEMENT ============

  /** Get user's membership details including points */
  async getUserMembership(userId: string): Promise<UserMembership> {
    const response = await api.get<{ data: UserMembership }>(`/users/${userId}/membership`);
    return response.data.data;
  }

  /** Manually adjust user's accumulated points (admin only) */
  async adjustUserPoints(userId: string, payload: AdjustPointsPayload): Promise<UserMembership> {
    const response = await api.post<{ data: UserMembership }>(`/users/${userId}/membership/adjust-points`, payload);
    return response.data.data;
  }

  /** Get user's points history */
  async getUserPointsHistory(userId: string, params?: { page?: number; limit?: number }): Promise<PaginatedPointsHistory> {
    const response = await api.get<{ data: PaginatedPointsHistory }>(`/membership/history`, { 
      params: { 
        ...params, 
        userId 
      } 
    });
    return response.data.data;
  }
}

export const adminService = new AdminService();
