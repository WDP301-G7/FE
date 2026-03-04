import api from '@/lib/api';

export interface ReturnItem {
  id: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'DEFECTIVE';
  exchangeProductId?: string;
  product: {
    id: string;
    name: string;
    price: string;
    images?: Array<{ imageUrl: string; isPrimary: boolean }>;
  };
  exchangeProduct?: {
    id: string;
    name: string;
    price: string;
    images?: Array<{ imageUrl: string; isPrimary: boolean }>;
  };
}

export interface ReturnImage {
  id: string;
  imageUrl: string;
  imageType: 'CUSTOMER_PROOF' | 'STAFF_RECEIVED';
  uploadedBy: string;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  type: 'RETURN' | 'EXCHANGE' | 'WARRANTY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  description?: string;
  refundAmount?: number;
  refundMethod?: 'BANK_TRANSFER' | 'CASH';
  priceDifference?: number;
  rejectionReason?: string;
  completionNote?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  refundedAt?: string;
  returnItems: ReturnItem[];
  images: ReturnImage[];
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface ReturnFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  customerId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ReturnService {
  private normalizeListResponse(
    payload: any,
    filters: ReturnFilters
  ): PaginatedResponse<ReturnRequest> {
    const fallbackPage = filters.page ?? 1;
    const fallbackLimit = filters.limit ?? 10;

    let data: ReturnRequest[] = [];
    let pagination = {
      page: fallbackPage,
      limit: fallbackLimit,
      total: 0,
      totalPages: 0,
    };

    if (!payload) {
      return { data, pagination };
    }

    if (Array.isArray(payload)) {
      data = payload;
    } else if (Array.isArray(payload.data)) {
      data = payload.data;
    } else if (Array.isArray(payload.items)) {
      data = payload.items;
    } else if (Array.isArray(payload.results)) {
      data = payload.results;
    }

    const pag =
      payload.pagination ||
      payload.pageInfo ||
      payload.meta?.pagination ||
      payload.meta;

    const hasPaginationHints =
      !!payload.pagination ||
      !!payload.pageInfo ||
      !!payload.meta?.pagination ||
      typeof payload.total !== 'undefined' ||
      typeof payload.totalElements !== 'undefined' ||
      typeof payload.totalItems !== 'undefined' ||
      typeof payload.page !== 'undefined' ||
      typeof payload.currentPage !== 'undefined' ||
      typeof payload.limit !== 'undefined' ||
      typeof payload.pageSize !== 'undefined';

    if (!hasPaginationHints) {
      const total = data.length;
      pagination = {
        page: fallbackPage,
        limit: total || fallbackLimit,
        total,
        totalPages: total > 0 ? 1 : 0,
      };
      return { data, pagination };
    }

    if (pag && typeof pag === 'object') {
      const total =
        pag.total ??
        pag.totalElements ??
        pag.totalItems ??
        payload.total ??
        data.length;
      const limit = pag.limit ?? pag.pageSize ?? payload.limit ?? fallbackLimit;
      const page = pag.page ?? pag.currentPage ?? payload.page ?? fallbackPage;
      const totalPages =
        pag.totalPages ??
        pag.totalPage ??
        Math.ceil((total || 0) / (limit || 1));

      pagination = {
        page,
        limit,
        total,
        totalPages,
      };
    } else {
      const total =
        payload.total ??
        payload.totalElements ??
        payload.totalItems ??
        data.length;
      const limit = payload.limit ?? payload.pageSize ?? fallbackLimit;
      const page = payload.page ?? payload.currentPage ?? fallbackPage;
      const totalPages =
        payload.totalPages ?? payload.totalPage ?? Math.ceil((total || 0) / (limit || 1));

      pagination = {
        page,
        limit,
        total,
        totalPages,
      };
    }

    return { data, pagination };
  }

  // Staff: Get approved returns waiting for processing
  async getApprovedReturns(filters: ReturnFilters = {}): Promise<PaginatedResponse<ReturnRequest>> {
    const params = new URLSearchParams();
    params.append('status', 'APPROVED');
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/returns?${params.toString()}`);
    const payload = response.data?.data ?? response.data;
    return this.normalizeListResponse(payload, filters);
  }

  // Get all returns with filters (Staff/Operation/Admin)
  async getReturns(filters: ReturnFilters = {}): Promise<PaginatedResponse<ReturnRequest>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.orderId) params.append('orderId', filters.orderId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/returns?${params.toString()}`);
    const payload = response.data?.data ?? response.data;
    return this.normalizeListResponse(payload, filters);
  }

  // Get return by ID
  async getReturnById(id: string): Promise<ReturnRequest> {
    const response = await api.get(`/returns/${id}`);
    return response.data.data;
  }

  // Staff: Upload images when receiving returned items
  async uploadReturnImages(returnId: string, images: File[]): Promise<{ images: ReturnImage[] }> {
    const formData = new FormData();
    formData.append('imageType', 'STAFF_RECEIVED');
    
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.post(`/returns/${returnId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  // Manager/Admin: Approve return request
  async approveReturn(returnId: string, note?: string): Promise<ReturnRequest> {
    const data = note ? { note } : {};
    const response = await api.put(`/returns/${returnId}/approve`, data);
    return response.data.data;
  }

  // Manager/Admin: Reject return request
  async rejectReturn(returnId: string, rejectionReason: string): Promise<ReturnRequest> {
    const response = await api.put(`/returns/${returnId}/reject`, { rejectionReason });
    return response.data.data;
  }

  // Manager/Admin: Cancel return request
  async cancelReturn(returnId: string): Promise<{ message: string }> {
    const response = await api.delete(`/returns/${returnId}`);
    return response.data.data;
  }

  // Staff: Complete return request
  async completeReturn(
    returnId: string,
    data: {
      refundAmount?: number;
      refundMethod?: 'BANK_TRANSFER' | 'CASH';
      completionNote?: string;
      images?: File[];
    }
  ): Promise<ReturnRequest> {
    const formData = new FormData();
    
    if (data.refundAmount !== undefined) {
      formData.append('refundAmount', data.refundAmount.toString());
    }
    if (data.refundMethod) {
      formData.append('refundMethod', data.refundMethod);
    }
    if (data.completionNote) {
      formData.append('completionNote', data.completionNote);
    }
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.put(`/returns/${returnId}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  // Get return statistics (Admin)
  async getReturnStats(): Promise<{
    totalReturns: number;
    totalExchanges: number;
    totalWarranties: number;
    pendingCount: number;
    approvedCount: number;
    completedCount: number;
    rejectedCount: number;
    totalRefundAmount: string;
    averageProcessingDays: number;
  }> {
    const response = await api.get('/returns/stats');
    return response.data.data;
  }
}

export const returnService = new ReturnService();
