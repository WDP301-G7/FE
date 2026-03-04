import { api } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  category?: string | { id: string; name: string };
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  images?: ProductImage[];
  primaryImage?: string;
  type?: 'FRAME' | 'LENS' | 'ACCESSORY';
  sku?: string;
  brand?: string;
  isPreorder?: boolean;
  leadTimeDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  imageType: 'TWO_D' | 'THREE_D' | 'DETAIL';
  isPrimary: boolean;
  productId?: string;
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

  async createProduct(data: CreateProductData, images?: File[]) {
    const formData = new FormData();
    
    // Append product data
    formData.append('categoryId', data.categoryId);
    formData.append('name', data.name);
    formData.append('type', data.type);
    formData.append('price', data.price.toString());
    formData.append('sku', data.sku);
    
    if (data.description) formData.append('description', data.description);
    if (data.brand) formData.append('brand', data.brand);
    if (data.isPreorder !== undefined) formData.append('isPreorder', data.isPreorder.toString());
    if (data.leadTimeDays) formData.append('leadTimeDays', data.leadTimeDays.toString());
    
    // Append images
    if (images && images.length > 0) {
      images.forEach((file, index) => {
        formData.append('images', file);
        // Image types: 2D (standard photo), 3D (3D view), DETAIL (close-up)
        formData.append('imageTypes', '2D');
      });
      // Set first image as primary
      formData.append('primaryIndex', '0');
    }
    
    console.log('📤 Creating product with FormData:');
    console.log('Total fields:', Array.from(formData.entries()).length);
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ✓ ${key}: File(${value.name}, ${(value.size / 1024).toFixed(2)}KB, type: ${value.type})`);
      } else {
        console.log(`  ✓ ${key}: ${value}`);
      }
    }
    
    const response = await api.post<{ data: Product }>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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
