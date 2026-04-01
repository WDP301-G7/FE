import { api } from '@/lib/api';

export interface RegisterData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  address?: string;
}

export interface LoginData {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    role: string;
    status: string;
    address?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('Register API call with:', { ...data, password: '***' });
    const response = await api.post<{ data: AuthResponse }>('/auth/register', data);
    console.log('Register response:', response.data);
    return response.data.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    // Backend expects 'email' field, not 'username'
    const payload = {
      email: data.email || data.username,
      password: data.password,
    };
    console.log('Login payload:', { email: payload.email, password: '***' });
    const response = await api.post<{ data: AuthResponse }>('/auth/login', payload);
    console.log('Login response:', response.data);
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  }

  async getProfile(): Promise<AuthResponse['user']> {
    const response = await api.get<{ data: AuthResponse['user'] }>('/auth/profile');
    return response.data.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();
