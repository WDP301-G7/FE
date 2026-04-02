import { api } from '@/lib/api';

// ============ USER TYPES ============

export type UserRole = 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN' | 'OPERATION';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDetail extends User {
  totalContributions?: number;
  tasksCompleted?: number;
  joinedDate?: string;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  address?: string;
  avatar?: File; // binary file for avatar upload
  role: UserRole;
  status: UserStatus;
  storeId?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  address?: string;
  avatar?: File;
  role?: UserRole;
  status?: UserStatus;
  storeId?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  storeId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export type PaginatedUsers = PaginatedResponse<User>;

// ============ USER SERVICE ============

class UserService {
  /**
   * Get users list with optional filters and pagination
   * GET /users
   */
  async getUsers(params?: GetUsersParams): Promise<PaginatedUsers> {
    try {
      const response = await api.get('/users', { params });
      
      // Handle different response structures
      const data = (response.data as Record<string, unknown>)?.data || response.data;
      
      // Ensure items is always an array
      // Backend may return 'users' or 'items' array
      const items = Array.isArray(data) 
        ? data 
        : Array.isArray((data as Record<string, unknown>)?.users)
          ? (data as Record<string, unknown>).users
          : Array.isArray((data as Record<string, unknown>)?.items) 
            ? (data as Record<string, unknown>).items 
            : [];
      
      // Map avatar field - backend might return avatarUrl, imageUrl, or avatar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedItems = (items as any[]).map((item: any) => ({
        ...item,
        avatar: item.avatar || item.avatarUrl || item.imageUrl || item.image || null,
      }));
      
      const total = typeof data === 'object' && data !== null && 'total' in data 
        ? (data as Record<string, unknown>).total as number
        : 0;
      
      const page = typeof data === 'object' && data !== null && 'page' in data
        ? (data as Record<string, unknown>).page as number
        : params?.page || 1;
        
      const limit = typeof data === 'object' && data !== null && 'limit' in data
        ? (data as Record<string, unknown>).limit as number
        : params?.limit || 10;
      
      const result = {
        items: mappedItems as User[],
        total,
        page,
        limit,
      };
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('❌ Error response:', error);
      throw error;
    }
  }

  /**
   * Get single user by ID
   * GET /users/{id}
   */
  async getUser(id: string): Promise<UserDetail> {
    try {
      const response = await api.get(`/users/${id}`);
      const rawData = (response.data as Record<string, unknown>)?.data || response.data;
      const data = rawData as Record<string, unknown>;
      
      // Map avatar field
      return {
        ...data,
        avatar: (data.avatar || data.avatarUrl || data.imageUrl || data.image || null) as string | null,
      } as UserDetail;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new user (JSON request - avatar upload not supported on create)
   * POST /users
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    try {
      // Backend expect JSON body, not FormData
      const requestBody = {
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        status: payload.status,
        ...(payload.phone && { phone: payload.phone }),
        ...(payload.address && { address: payload.address }),
        ...(payload.storeId && { storeId: payload.storeId }),
      };
      
      const response = await api.post('/users', requestBody);
      
      const rawData = (response.data as Record<string, unknown>)?.data || response.data;
      const data = rawData as Record<string, unknown>;
      
      // Map avatar field
      return {
        ...data,
        avatar: (data.avatar || data.avatarUrl || data.imageUrl || data.image || null) as string | null,
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user profile (multipart/form-data with avatar upload)
   * PUT /users/{id}
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    try {
      const formData = new FormData();
      
      // Add text fields only if provided
      if (payload.fullName) formData.append('fullName', payload.fullName);
      if (payload.phone) formData.append('phone', payload.phone);
      if (payload.address) formData.append('address', payload.address);
      if (payload.role) formData.append('role', payload.role);
      if (payload.status) formData.append('status', payload.status);
      if (payload.storeId) formData.append('storeId', payload.storeId);
      
      // Add avatar file if provided
      if (payload.avatar) {
        formData.append('avatar', payload.avatar);
      }
      
      const response = await api.put(`/users/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const rawData = (response.data as Record<string, unknown>)?.data || response.data;
      const data = rawData as Record<string, unknown>;
      
      // Map avatar field
      return {
        ...data,
        avatar: (data.avatar || data.avatarUrl || data.imageUrl || data.image || null) as string | null,
      } as User;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   * DELETE /users/{id}
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Filter users excluding a specific role
   */
  async getUsersExcludingRole(excludeRole: UserRole, params?: Omit<GetUsersParams, 'role'>): Promise<PaginatedUsers> {
    const response = await this.getUsers(params);
    return {
      ...response,
      items: response.items.filter(user => user.role !== excludeRole),
      total: response.items.filter(user => user.role !== excludeRole).length,
    };
  }
}

export const userService = new UserService();
export default userService;
