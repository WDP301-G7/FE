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
    return response.data.data;
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
    return response.data.data;
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

  // Staff: Complete return request
  async completeReturn(
    returnId: string,
    data: {
      refundAmount?: number;
      refundMethod?: 'BANK_TRANSFER' | 'CASH';
      completionNote?: string;
    }
  ): Promise<ReturnRequest> {
    const response = await api.put(`/returns/${returnId}/complete`, data);
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
