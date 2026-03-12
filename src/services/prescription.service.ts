import { api } from '@/lib/api';

export interface PrescriptionRequest {
  id: string;
  customerId: string;
  storeId: string;
  status: 'PENDING' | 'CONTACTING' | 'QUOTED' | 'ACCEPTED' | 'SCHEDULED' | 'EXPIRED' | 'LOST';
  consultationType: 'PHONE' | 'IN_STORE' | 'VIDEO';
  symptoms?: string;
  notes?: string;
  orderId?: string;
  appointmentDate?: string;
  createdAt: string;
  updatedAt: string;
  contactedAt?: string;
  closedAt?: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  store?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  images?: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }>;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    expiresAt?: string;
  };
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  prescription: {
    rightEyeSphere?: string;
    rightEyeCylinder?: string;
    rightEyeAxis?: number;
    leftEyeSphere?: string;
    leftEyeCylinder?: string;
    leftEyeAxis?: number;
    pupillaryDistance?: string;
    notes?: string;
  };
  expectedReadyDate: string;
  expiresAt: string;
  notes?: string;
}

export interface ScheduleAppointmentPayload {
  appointmentDate: string;
  appointmentNote?: string;
}

export interface CloseRequestPayload {
  reason: string;
}

export interface PrescriptionFilters {
  page?: number;
  limit?: number;
  status?: string;
  consultationType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class PrescriptionService {
  /**
   * Get list of prescription requests (for Operation/Admin)
   */
  async getPrescriptionRequests(filters?: PrescriptionFilters): Promise<PaginatedResponse<PrescriptionRequest>> {
    const response = await api.get('/prescription-requests', {
      params: filters,
    });
    
    // Handle different response structures (backend might wrap in { data: { data: [...], pagination: {...} } })
    const payload = response.data?.data ?? response.data;
    
    // Normalize response to ensure we always return proper structure
    const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const pagination = payload?.pagination ?? {
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
      total: 0,
      totalPages: 0,
    };
    
    return { data, pagination };
  }

  /**
   * Get single prescription request by ID
   */
  async getPrescriptionRequest(id: string): Promise<PrescriptionRequest> {
    const response = await api.get(`/prescription-requests/${id}`);
    return response.data?.data ?? response.data;
  }

  /**
   * Update status to CONTACTING (Operation starts consultation)
   */
  async startContact(id: string): Promise<PrescriptionRequest> {
    const response = await api.patch(`/prescription-requests/${id}/contact`);
    return response.data?.data ?? response.data;
  }

  /**
   * Create order (quote) for prescription request
   */
  async createOrder(id: string, payload: CreateOrderPayload): Promise<PrescriptionRequest> {
    const response = await api.post(
      `/prescription-requests/${id}/create-order`,
      payload
    );
    return response.data?.data ?? response.data;
  }

  /**
   * Schedule appointment for customer
   */
  async scheduleAppointment(id: string, payload: ScheduleAppointmentPayload): Promise<PrescriptionRequest> {
    const response = await api.patch(
      `/prescription-requests/${id}/schedule`,
      payload
    );
    return response.data?.data ?? response.data;
  }

  /**
   * Close/reject prescription request
   */
  async closeRequest(id: string, payload: CloseRequestPayload): Promise<PrescriptionRequest> {
    const response = await api.patch(
      `/prescription-requests/${id}/close`,
      payload
    );
    return response.data?.data ?? response.data;
  }

  /**
   * Get prescription request statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    contacting: number;
    quoted: number;
    accepted: number;
  }> {
    const response = await api.get('/prescription-requests/stats');
    return response.data?.data ?? response.data;
  }
}

export const prescriptionService = new PrescriptionService();
export default prescriptionService;
