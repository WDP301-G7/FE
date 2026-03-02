import { api } from '@/lib/api';

// Types for operations
export interface GetOrdersParams {
  status?: string;
  'from-date'?: string;
  'to-date'?: string;
  'staff-id'?: string;
  size?: number;
  page?: number;
}

export interface OrderDetails {
  id: string;
  createdDate: string;
  totalPrice: number;
  status: string;
  customerId?: string;
  staffId?: string;
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
  code: number;
  message: string;
  data: OrderDetails[];
  pageInfo?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

class OperationsService {

  

  // Get all orders with filters
  async getAllOrders(params?: GetOrdersParams): Promise<OrderDetails[]> {
    try {
      const response = await api.get<OrdersListResponse>('/orders', {
        params,
      });
      // backend sometimes wraps the array again under another `data` key
      let payload: any = response.data.data;
      if (payload && typeof payload === 'object' && 'data' in payload) {
        payload = payload.data;
      }
      return payload || [];
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

  // Mark order as ready
  async markOrderAsReady(id: string): Promise<OrderDetails> {
    try {
      const response = await api.post<OrderResponse>(`/orders/${id}/mark-ready`);
      return response.data.data;
    } catch (error) {
      console.error('Error marking order as ready:', error);
      throw error;
    }
  }

  
}

export const operationsService = new OperationsService();
