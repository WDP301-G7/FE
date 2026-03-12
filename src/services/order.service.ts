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
    const response = await api.get('/orders', { params });
    const payload = response.data?.data ?? response.data;
    
    // Handle both structures: direct array or { items, total }
    if (Array.isArray(payload)) {
      return { items: payload, total: payload.length, page: params?.page || 1, limit: params?.limit || 10 };
    } else if (payload && Array.isArray(payload.items)) {
      return { items: payload.items, total: payload.total || payload.items.length, page: params?.page || 1, limit: params?.limit || 10 };
    }
    return { items: [], total: 0, page: params?.page || 1, limit: params?.limit || 10 };
  }

  async getOrder(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data?.data ?? response.data;
  }

  async createOrder(data: CreateOrderData) {
    const response = await api.post('/orders', data);
    return response.data?.data ?? response.data;
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusData) {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data?.data ?? response.data;
  }

  async assignStaff(orderId: string, staffId: string) {
    const response = await api.patch(`/orders/${orderId}/assign`, { staffId });
    return response.data?.data ?? response.data;
  }

  async cancelOrder(id: string, reason?: string) {
    const response = await api.patch(`/orders/${id}/cancel`, { reason });
    return response.data?.data ?? response.data;
  }

  async getMyOrders(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get('/orders/my-orders', { params });
    const payload = response.data?.data ?? response.data;
    
    // Similar structure handling as getAssignedOrders
    if (Array.isArray(payload)) {
      return { items: payload, total: payload.length };
    } else if (payload && Array.isArray(payload.items)) {
      return { items: payload.items, total: payload.total || payload.items.length };
    }
    return { items: [], total: 0 };
  }

  // Get orders assigned to staff
  async getAssignedOrders(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }) {
    const response = await api.get('/orders/assigned', { params });
    
    // Backend trả về { data: [...orders] } - array trực tiếp, không có items wrapper
    const payload = response.data?.data ?? response.data;
    
    // Handle both structures: direct array or { items, total }
    let items: Order[] = [];
    let total = 0;
    
    if (Array.isArray(payload)) {
      // Backend trả về array trực tiếp
      items = payload;
      total = payload.length;
    } else if (payload && Array.isArray(payload.items)) {
      // Backend trả về { items: [...], total: X }
      items = payload.items;
      total = payload.total || items.length;
    }
    
    return { items, total, page: params?.page || 1, limit: params?.limit || 10 };
  }

  // Staff order processing workflow
  // PROCESSING → READY (làm xong)
  async markReady(id: string) {
    const response = await api.post(`/orders/${id}/mark-ready`);
    return response.data?.data ?? response.data;
  }

  // READY → COMPLETED (giao khách)
  async completeOrder(id: string) {
    const response = await api.post(`/orders/${id}/complete`);
    return response.data?.data ?? response.data;
  }

  // CONFIRMED → PROCESSING (bắt đầu làm)
  async startProcessing(id: string) {
    const response = await api.post(`/orders/${id}/start-processing`);
    return response.data?.data ?? response.data;
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

    const response = await api.patch(`/orders/${id}/complete-with-notes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? response.data;
  }

  // Verify customer by phone before delivery
  async verifyCustomer(orderId: string, phone: string) {
    const response = await api.get(`/orders/${orderId}/verify`, { params: { phone } });
    return response.data?.data ?? response.data;
  }

  // Get prescription details for an order
  async getOrderPrescription(orderId: string) {
    const response = await api.get(`/orders/${orderId}/prescription`);
    return response.data?.data ?? response.data;
  }

  // Get staff statistics
  async getStaffStats() {
    const response = await api.get('/orders/stats/staff');
    return response.data?.data ?? response.data;
  }
}

export const orderService = new OrderService();
