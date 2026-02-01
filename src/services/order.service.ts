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
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
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
}

export const orderService = new OrderService();
