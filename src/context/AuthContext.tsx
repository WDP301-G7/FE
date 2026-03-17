import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole, mockUsers } from '@/mock-data/users';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[] | string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // helper to normalize incoming role strings from server
  const normalizeRole = (role: string): UserRole => {
    const r = role.toLowerCase();
    // some backends might return "operation" instead of "operations"
    if (r === 'operation') return 'operations';
    // fallback casts - it's okay if value is unexpected, hasRole will reject later
    return r as UserRole;
  };

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
          role: normalizeRole(userData.role),
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
      role: normalizeRole(userData.role),
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

  const hasRole = useCallback((roles: UserRole | UserRole[] | string | string[]) => {
    if (!user) {
      console.log('❌ hasRole: no user');
      return false;
    }
    
    // Convert to array if single value
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    // Normalize both user role and check roles to uppercase for case-insensitive comparison
    const userRoleUpper = user.role.toUpperCase();
    const normalizedRoles = roleArray.map(r => r.toUpperCase());
    
    const result = normalizedRoles.includes(userRoleUpper);
    console.log('🔐 hasRole check:', {
      userRole: user.role,
      userRoleUpper,
      checkingRoles: roles,
      normalizedRoles,
      result
    });
    
    return result;
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
