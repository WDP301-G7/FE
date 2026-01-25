import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole, mockUsers } from '@/mock-data/users';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Map API user to frontend User type
        const mappedUser: User = {
          id: userData.id,
          name: userData.fullName,
          email: userData.email,
          role: userData.role.toLowerCase() as UserRole,
          avatar: userData.avatarUrl,
          department: userData.role,
          isActive: userData.status === 'ACTIVE',
        };
        setUser(mappedUser);
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = useCallback((userData: any) => {
    // Map API user data to frontend User type
    const mappedUser: User = {
      id: userData.id,
      name: userData.fullName,
      email: userData.email,
      role: userData.role.toLowerCase() as UserRole,
      avatar: userData.avatarUrl,
      department: userData.role,
      isActive: userData.status === 'ACTIVE',
    };
    setUser(mappedUser);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
