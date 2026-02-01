import { api } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  images?: ProductImage[];
  primaryImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  productId: string;
}

export interface CreateProductData {
  categoryId: string;
  name: string;
  description?: string;
  type: 'FRAME' | 'LENS' | 'ACCESSORY';
  price: number;
  isPreorder?: boolean;
  leadTimeDays?: number;
  sku: string;
  brand?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

class ProductService {
  async getProducts(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get<{ data: { items: Product[]; total: number; page: number; limit: number } }>('/products', { params });
    console.log('Products API response:', response.data);
    return response.data.data;
  }

  async getProduct(id: string) {
    const response = await api.get<{ data: Product }>(`/products/${id}`);
    return response.data.data;
  }

  async createProduct(data: CreateProductData) {
    const response = await api.post<{ data: Product }>('/products', data);
    return response.data.data;
  }

  async updateProduct(id: string, data: UpdateProductData) {
    const response = await api.put<{ data: Product }>(`/products/${id}`, data);
    return response.data.data;
  }

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  }

  // Product Images
  async getProductImages(productId: string) {
    const response = await api.get<{ data: ProductImage[] }>(`/products/${productId}/images`);
    return response.data.data;
  }

  async uploadProductImages(productId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await api.post<{ data: ProductImage[] }>(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const response = await api.put<{ data: ProductImage }>(`/products/${productId}/images/${imageId}/primary`);
    return response.data.data;
  }

  async deleteProductImage(productId: string, imageId: string) {
    await api.delete(`/products/${productId}/images/${imageId}`);
  }
}

export const productService = new ProductService();
