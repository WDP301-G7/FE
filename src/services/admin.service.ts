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

export interface UsersStats {
  totalUsers: number;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
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

// Backend currently returns membership status using tier/totalSpent fields.
// Keep a raw type and normalize to UserMembership so UI can stay consistent.
interface RawUserMembershipResponse {
  userId?: string;
  currentTier?: MembershipTier | null;
  accumulatedSpending?: number;
  spendingToNextTier?: number;
  joinedDate?: string;
  lastUpdated?: string;

  tier?: string | null;
  tierId?: string | null;
  totalSpent?: number;
  spendInPeriod?: number;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  nextTier?: string | null;
  nextTierId?: string | null;
  amountToNextTier?: number | null;
  discountPercent?: number;
  warrantyMonths?: number;
  returnDays?: number;
  exchangeDays?: number;
}

const getTierIconByName = (tierName?: string | null): string => {
  const name = (tierName || '').toLowerCase();
  if (name.includes('gold')) return '🥇';
  if (name.includes('silver')) return '🥈';
  if (name.includes('bronze')) return '🥉';
  if (!name || name === '-') return '';
  return '🏆';
};

const getTierDisplayName = (tierName?: string | null): string => {
  if (!tierName || tierName.trim() === '-' || tierName.trim() === '') {
    return 'Chưa có hạng';
  }
  return tierName;
};

const getTierColorByName = (tierName?: string | null): string => {
  const name = (tierName || '').toLowerCase();
  if (name.includes('gold')) return '#f59e0b';
  if (name.includes('silver')) return '#94a3b8';
  if (name.includes('bronze')) return '#b45309';
  return '#64748b';
};

export interface AdjustPointsPayload {
  amount: number; // Positive to add, negative to subtract
  reason: string; // Explanation for the adjustment
  note?: string; // Optional additional notes
}

export interface PointsHistoryEntry {
  id: string;
  userId: string;
  amount?: number;
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

export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSystemSettingPayload {
  value: string | number | boolean | Record<string, unknown> | unknown[];
  description?: string;
}

interface RawPointsHistoryEntry {
  id: string;
  userId: string;
  amount?: number;
  reason?: string;
  note?: string;
  adjustedBy?: string;
  createdAt?: string;
  changedAt?: string;
}

interface RawPaginatedPointsHistory {
  items?: RawPointsHistoryEntry[];
  total?: number;
  page?: number;
  limit?: number;
  data?: RawPointsHistoryEntry[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

class AdminService {
  private normalizeUserMembership(userId: string, raw: RawUserMembershipResponse): UserMembership {
    const normalizedCurrentTier: MembershipTier = raw.currentTier
      ? {
          ...raw.currentTier,
          name: getTierDisplayName(raw.currentTier.name),
          icon: raw.currentTier.icon || getTierIconByName(raw.currentTier.name),
          color: raw.currentTier.color || getTierColorByName(raw.currentTier.name),
        }
      : {
          id: raw.tierId || 'no-tier',
          name: getTierDisplayName(raw.tier),
          minSpend: 0,
          maxSpend: null,
          discountPercent: Number(raw.discountPercent ?? 0),
          warrantyMonths: Number(raw.warrantyMonths ?? 0),
          returnDays: Number(raw.returnDays ?? 0),
          exchangeDays: Number(raw.exchangeDays ?? 0),
          color: getTierColorByName(raw.tier),
          icon: getTierIconByName(raw.tier),
        };

    const normalizedNextTier: MembershipTier | null = raw.nextTier || raw.nextTierId
      ? {
          id: raw.nextTierId || `next-${(raw.nextTier || 'tier').toLowerCase().replace(/\s+/g, '-')}`,
          name: raw.nextTier || '-',
          minSpend: 0,
          maxSpend: null,
          discountPercent: 0,
          warrantyMonths: 0,
          returnDays: 0,
          exchangeDays: 0,
          color: getTierColorByName(raw.nextTier),
          icon: getTierIconByName(raw.nextTier),
        }
      : null;

    return {
      userId: raw.userId || userId,
      currentTier: normalizedCurrentTier,
      accumulatedSpending: Number(raw.accumulatedSpending ?? raw.totalSpent ?? 0),
      nextTier: normalizedNextTier,
      spendingToNextTier:
        raw.spendingToNextTier != null
          ? Number(raw.spendingToNextTier)
          : raw.amountToNextTier != null
            ? Number(raw.amountToNextTier)
            : undefined,
      discountPercent: Number(raw.discountPercent ?? normalizedCurrentTier.discountPercent ?? 0),
      joinedDate: raw.joinedDate || raw.periodStartDate || undefined,
      lastUpdated: raw.lastUpdated || raw.periodEndDate || undefined,
    };
  }

  private normalizePointsHistory(raw: RawPaginatedPointsHistory): PaginatedPointsHistory {
    const rawItems = raw.items || raw.data || [];
    const normalizedItems: PointsHistoryEntry[] = rawItems.map((item) => ({
      id: item.id,
      userId: item.userId,
      amount: item.amount != null ? Number(item.amount) : undefined,
      reason: item.reason || 'N/A',
      note: item.note,
      adjustedBy: item.adjustedBy,
      createdAt: item.createdAt || item.changedAt || new Date().toISOString(),
    }));

    return {
      items: normalizedItems,
      total: Number(raw.total ?? raw.meta?.total ?? normalizedItems.length),
      page: raw.page ?? raw.meta?.page,
      limit: raw.limit ?? raw.meta?.limit,
    };
  }

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

  /** Get users statistics */
  async getUsersStats(): Promise<UsersStats> {
    const response = await api.get<{ data: UsersStats }>('/users/stats');
    return response.data.data;
  }

  /** Get low stock inventory count */
  async getLowStockCount(): Promise<number> {
    const response = await api.get<{
      data: {
        data?: unknown[];
        pagination?: { total?: number };
      };
    }>('/inventory', {
      params: {
        lowStock: true,
        page: 1,
        limit: 1,
      },
    });

    return Number(response.data.data?.pagination?.total ?? 0);
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
    const response = await api.get<{ data: RawUserMembershipResponse }>(`/membership/users/${userId}/membership`);
    return this.normalizeUserMembership(userId, response.data.data);
  }

  /** Manually adjust user's accumulated points (admin only) */
  async adjustUserPoints(userId: string, payload: AdjustPointsPayload): Promise<UserMembership> {
    const response = await api.post<{ data: RawUserMembershipResponse }>(`/membership/users/${userId}/membership/adjust-points`, payload);
    return this.normalizeUserMembership(userId, response.data.data);
  }

  /** Get user's points history */
  async getUserPointsHistory(userId: string, params?: { page?: number; limit?: number }): Promise<PaginatedPointsHistory> {
    const response = await api.get<{ data: RawPaginatedPointsHistory }>(`/membership/history`, {
      params: { 
        ...params, 
        userId 
      } 
    });
    return this.normalizePointsHistory(response.data.data);
  }

  // ============ SYSTEM SETTINGS MANAGEMENT ============

  /** Get all system settings (admin) */
  async getSystemSettings(): Promise<SystemSetting[]> {
    const response = await api.get<{ data: SystemSetting[] }>('/settings');
    return response.data.data;
  }

  /** Update one system setting by key (admin) */
  async updateSystemSetting(key: string, payload: UpdateSystemSettingPayload): Promise<SystemSetting> {
    const response = await api.patch<{ data: SystemSetting }>(`/settings/${encodeURIComponent(key)}`, payload);
    return response.data.data;
  }
}

export const adminService = new AdminService();
