import { api } from '@/lib/api';

// Types for operations
export interface GetOrdersParams {
  status?: string;
  'from-date'?: string;
  'to-date'?: string;
  'staff-id'?: string;
  limit?: number;
  size?: number;
  page?: number;
}

export interface OrderDetails {
  id: string;
  createdDate: string;
  createdAt?: string;
  updatedAt?: string;
  totalPrice: number;
  totalAmount?: string | number;
  status: string;
  paymentStatus?: string;
  orderType?: string;
  customerId?: string;
  staffId?: string;
  handledBy?: string | null;
  customer?: {
    id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  handler?: {
    id?: string;
    fullName?: string;
    role?: string;
  } | null;
  orderItems?: Array<{
    id: string;
    orderId?: string;
    productId?: string;
    quantity?: number;
    unitPrice?: string | number;
    itemStatus?: string;
    note?: string | null;
    product?: {
      id?: string;
      name?: string;
      type?: string;
      brand?: string;
      price?: string | number;
    };
  }>;
}

export interface ConfirmOrderRequest {
  appointmentDate: string;
  appointmentNotes: string;
  assignedStaffId: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate: string;
  appointmentNotes: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface OrderResponse {
  code: number;
  message: string;
  data: OrderDetails;
}

export interface OrdersListResponse {
  code?: number;
  statusCode?: number;
  message: string;
  data: OrderDetails[] | { data?: OrderDetails[]; meta?: { total?: number; page?: number; limit?: number; totalPages?: number } };
  pageInfo?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface GetOrdersResponse {
  orders: OrderDetails[];
  pageInfo?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// --- prescription request types ---
export interface GetPrescriptionRequestsParams {
  status?: string;
  storeId?: string;
  customerId?: string;
  handledBy?: string;
  page?: number;
  limit?: number;
}

export interface PrescriptionRequestSummary {
  id: string;
  createdDate: string;
  status: string;
  customerId?: string;
  storeId?: string;
  handledBy?: string;
}

export interface PrescriptionRequestDetails {
  id: string;
  createdDate: string;
  status: string;
  customerId?: string;
  storeId?: string;
  handledBy?: string;
  contactNotes?: string;
  // images uploaded by customer (prescription photos, etc.)
  images?: Array<{ id: string; imageUrl: string }>;
  // additional fields returned by API can be added here as needed
}

export interface PrescriptionRequestResponse {
  code: number;
  message: string;
  data: PrescriptionRequestDetails;
}

export interface PrescriptionRequestsListResponse {
  code: number;
  message: string;
  data: PrescriptionRequestSummary[];
  pageInfo?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface GetPrescriptionRequestsResponse {
  requests: PrescriptionRequestSummary[];
  pageInfo?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// --- order creation from prescription types ---
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PrescriptionData {
  rightEyeSphere?: number;
  rightEyeCylinder?: number;
  rightEyeAxis?: number;
  leftEyeSphere?: number;
  leftEyeCylinder?: number;
  leftEyeAxis?: number;
  pupillaryDistance?: number;
  notes?: string;
}

export interface CreateOrderFromPrescriptionRequest {
  orderItems: OrderItem[];
  prescriptionData: PrescriptionData;
  expectedReadyDate?: string;
  expiryDays?: number;
}

class OperationsService {



  // Get all orders with filters
  async getAllOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    try {
      const queryParams = {
        ...params,
        // Backend pagination contract uses `limit`; keep `size` as fallback compatibility.
        limit: params?.limit ?? params?.size,
      };

      const response = await api.get<OrdersListResponse>('/orders', {
        params: queryParams,
      });
      console.log('Raw API response:', response.data);

      // backend sometimes wraps the array again under another `data` key
      let payload: any = response.data.data;
      let meta: any = null;

      if (payload && typeof payload === 'object' && 'meta' in payload) {
        meta = (payload as any).meta;
      }

      if (payload && typeof payload === 'object' && 'data' in payload) {
        payload = payload.data;
      }

      const orders = Array.isArray(payload) ? payload : [];
      const pageInfo = response.data.pageInfo || (meta
        ? {
            page: Number(meta.page || params?.page || 1),
            size: Number(meta.limit || params?.limit || params?.size || 10),
            totalElements: Number(meta.total || orders.length),
            totalPages: Number(meta.totalPages || 1),
          }
        : undefined);

      console.log('Extracted orders count:', orders.length);
      console.log('PageInfo:', pageInfo);

      return {
        orders,
        pageInfo,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(id: string): Promise<OrderDetails> {
    try {
      const response = await api.get<OrderResponse>(`/orders/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  // Confirm order and set appointment
  async confirmOrder(id: string, data: ConfirmOrderRequest): Promise<OrderDetails> {
    try {
      const response = await api.post<OrderResponse>(`/orders/${id}/confirm`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  }

  // Update appointment for an order
  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<OrderDetails> {
    try {
      const response = await api.put<OrderResponse>(`/orders/${id}/appointment`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(id: string, data: CancelOrderRequest): Promise<OrderDetails> {
    try {
      const response = await api.post<OrderResponse>(`/orders/${id}/cancel`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Start processing order
  async startProcessing(id: string): Promise<OrderDetails> {
    try {
      const response = await api.post<OrderResponse>(`/orders/${id}/start-processing`);
      return response.data.data;
    } catch (error) {
      console.error('Error starting order processing:', error);
      throw error;
    }
  }


  // prescription-related endpoints

  // Fetch prescription requests list with optional filters/pagination
  async getPrescriptionRequests(
    params?: GetPrescriptionRequestsParams
  ): Promise<GetPrescriptionRequestsResponse> {
    try {
      const response = await api.get<PrescriptionRequestsListResponse>('/prescription-requests', {
        params,
      });
      let payload: any = response.data.data;
      if (payload && typeof payload === 'object' && 'data' in payload) {
        payload = payload.data;
      }
      const requests = Array.isArray(payload) ? payload : [];
      const pageInfo = response.data.pageInfo;
      return { requests, pageInfo };
    } catch (error) {
      console.error('Error fetching prescription requests:', error);
      throw error;
    }
  }

  // Get detail for a single prescription request
  async getPrescriptionRequestById(id: string): Promise<PrescriptionRequestDetails> {
    try {
      const response = await api.get<PrescriptionRequestResponse>(`/prescription-requests/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching prescription request by ID:', error);
      throw error;
    }
  }

  // Update contact status/notes after calling customer
  async updatePrescriptionContact(
    id: string,
    data: { status: string; contactNotes?: string }
  ): Promise<PrescriptionRequestDetails> {
    try {
      const response = await api.patch<PrescriptionRequestResponse>(
        `/prescription-requests/${id}/contact`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating prescription contact status:', error);
      throw error;
    }
  }

  // Create quotation order from prescription request
  async createOrderFromPrescription(
    id: string,
    data: CreateOrderFromPrescriptionRequest
  ): Promise<OrderDetails> {
    try {
      const response = await api.post<OrderResponse>(
        `/prescription-requests/${id}/create-order`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating order from prescription:', error);
      throw error;
    }
  }

  // Close prescription request (lost/rejected)
  async closePrescriptionRequest(
    id: string,
    data: { status: string; contactNotes?: string }
  ): Promise<PrescriptionRequestDetails> {
    try {
      const response = await api.patch<PrescriptionRequestResponse>(
        `/prescription-requests/${id}/close`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error closing prescription request:', error);
      throw error;
    }
  }

  
}











export const operationsService = new OperationsService();


