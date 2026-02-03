import { api } from '@/lib/api';

export interface Store {
  id: string;
  name: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStoreData {
  name: string;
  address?: string;
}

export interface UpdateStoreData extends Partial<CreateStoreData> {}

class StoreService {
  async getStores(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get<{ data: Store[]; pagination?: { total: number; page: number; limit: number } }>('/stores', { params });
    return response.data;
  }

  async getStore(id: string) {
    const response = await api.get<{ data: Store }>(`/stores/${id}`);
    return response.data.data;
  }

  async createStore(data: CreateStoreData) {
    const response = await api.post<{ data: Store }>('/stores', data);
    return response.data.data;
  }

  async updateStore(id: string, data: UpdateStoreData) {
    const response = await api.put<{ data: Store }>(`/stores/${id}`, data);
    return response.data.data;
  }

  async deleteStore(id: string) {
    await api.delete(`/stores/${id}`);
  }
}

export const storeService = new StoreService();
