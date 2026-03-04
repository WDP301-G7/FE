import { api } from '@/lib/api';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'NEW' | 'CONFIRMED' | 'WAITING_CUSTOMER' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  shippingAddress: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  notes?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: { productId: string; quantity: number }[];
  shippingAddress: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  notes?: string;
}

export interface UpdateOrderStatusData {
  status: Order['status'];
  notes?: string;
}

class OrderService {
  async getOrders(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }) {
    const response = await api.get<{ data: { items: Order[]; total: number; page: number; limit: number } }>('/orders', { params });
    return response.data.data;
  }

  async getOrder(id: string) {
    const response = await api.get<{ data: Order }>(`/orders/${id}`);
    return response.data.data;
  }

  async createOrder(data: CreateOrderData) {
    const response = await api.post<{ data: Order }>('/orders', data);
    return response.data.data;
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusData) {
    const response = await api.patch<{ data: Order }>(`/orders/${id}/status`, data);
    return response.data.data;
  }

  async assignStaff(orderId: string, staffId: string) {
    const response = await api.patch<{ data: Order }>(`/orders/${orderId}/assign`, { staffId });
    return response.data.data;
  }

  async cancelOrder(id: string, reason?: string) {
    const response = await api.patch<{ data: Order }>(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  }

  async getMyOrders(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get<{ data: { items: Order[]; total: number } }>('/orders/my-orders', { params });
    return response.data.data;
  }

  // Get orders assigned to staff
  async getAssignedOrders(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }) {
    const response = await api.get<{ data: { items: Order[]; total: number; page: number; limit: number } }>('/orders/assigned', { params });
    return response.data.data;
  }

  // Staff order processing workflow
  // PROCESSING → READY (làm xong)
  async markReady(id: string) {
    const response = await api.post<{ data: Order }>(`/orders/${id}/mark-ready`);
    return response.data.data;
  }

  // READY → COMPLETED (giao khách)
  async completeOrder(id: string) {
    const response = await api.post<{ data: Order }>(`/orders/${id}/complete`);
    return response.data.data;
  }

  // CONFIRMED → PROCESSING (bắt đầu làm)
  async startProcessing(id: string) {
    const response = await api.post<{ data: Order }>(`/orders/${id}/start-processing`);
    return response.data.data;
  }

  // Complete order with notes and optional images
  async completeOrderWithNotes(id: string, data: { completionNote?: string; images?: File[] }) {
    const formData = new FormData();
    if (data.completionNote) {
      formData.append('completionNote', data.completionNote);
    }
    if (data.images) {
      data.images.forEach(image => {
        formData.append('images', image);
      });
    }

    const response = await api.patch<{ data: Order }>(`/orders/${id}/complete-with-notes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  // Verify customer by phone before delivery
  async verifyCustomer(orderId: string, phone: string) {
    const response = await api.get<{ 
      data: { 
        verified: boolean; 
        customer: { 
          id: string; 
          fullName: string; 
          email: string; 
          phone: string; 
        };
        order: Order;
      } 
    }>(`/orders/${orderId}/verify`, { params: { phone } });
    return response.data.data;
  }

  // Get prescription details for an order
  async getOrderPrescription(orderId: string) {
    const response = await api.get<{ 
      data: { 
        order: Order;
        prescription: {
          rightEyeSphere?: string;
          rightEyeCylinder?: string;
          rightEyeAxis?: number;
          leftEyeSphere?: string;
          leftEyeCylinder?: string;
          leftEyeAxis?: number;
          pupillaryDistance?: string;
          notes?: string;
          prescriptionImageUrl?: string;
        } | null;
      } 
    }>(`/orders/${orderId}/prescription`);
    return response.data.data;
  }

  // Get staff statistics
  async getStaffStats() {
    const response = await api.get<{ 
      data: {
        pendingCount: number;
        processingCount: number;
        completedToday: number;
        readyCount: number;
        totalAssigned: number;
      }
    }>('/orders/stats/staff');
    return response.data.data;
  }
}

export const orderService = new OrderService();
