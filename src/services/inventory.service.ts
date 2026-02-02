import { api } from '@/lib/api';

export interface Inventory {
  id: string;
  productId: string;
  storeId: string;
  quantity: number;
  reservedQuantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInventoryData {
  productId: string;
  storeId: string;
  quantity: number;
  reservedQuantity?: number;
}

export interface UpdateInventoryData {
  quantity?: number;
  reservedQuantity?: number;
}

class InventoryService {
  async getInventories(params?: { page?: number; limit?: number; productId?: string; storeId?: string; lowStock?: boolean }) {
    const response = await api.get<{ data: Inventory[]; pagination?: { total: number; page: number; limit: number } }>('/inventory', { params });
    return response.data;
  }

  async getInventory(id: string) {
    const response = await api.get<{ data: Inventory }>(`/inventory/${id}`);
    return response.data.data;
  }

  async createInventory(data: CreateInventoryData) {
    const response = await api.post<{ data: Inventory }>('/inventory', data);
    return response.data.data;
  }

  async updateInventory(id: string, data: UpdateInventoryData) {
    const response = await api.put<{ data: Inventory }>(`/inventory/${id}`, data);
    return response.data.data;
  }

  async deleteInventory(id: string) {
    await api.delete(`/inventory/${id}`);
  }

  // Product-specific endpoints
  async getInventoryByProduct(productId: string) {
    const response = await api.get<{ data: Inventory[] }>(`/inventory/product/${productId}`);
    return response.data.data;
  }

  async getProductAvailable(productId: string) {
    const response = await api.get<{ data: { available: number } }>(`/inventory/product/${productId}/available`);
    return response.data.data;
  }

  // Store-specific endpoints
  async getInventoryByStore(storeId: string) {
    const response = await api.get<{ data: Inventory[] }>(`/inventory/store/${storeId}`);
    return response.data.data;
  }

  // Adjust reserved quantity using standard CRUD (GET + PUT) so we don't rely on PATCH endpoints
  async adjustReserved(id: string, delta: number) {
    // Fetch current inventory, compute new reserved value and update via PUT
    const current = await this.getInventory(id);
    const newReserved = Math.max(0, current.reservedQuantity + delta);
    if (newReserved > current.quantity) {
      // Let caller handle or backend validation
      throw new Error('Reserved quantity cannot exceed total quantity');
    }
    const response = await api.put<{ data: Inventory }>(`/inventory/${id}`, { reservedQuantity: newReserved });
    return response.data.data;
  }

  async setReserved(id: string, reserved: number) {
    const current = await this.getInventory(id);
    const newReserved = Math.max(0, Math.min(reserved, current.quantity));
    const response = await api.put<{ data: Inventory }>(`/inventory/${id}`, { reservedQuantity: newReserved });
    return response.data.data;
  }
}

export const inventoryService = new InventoryService();
