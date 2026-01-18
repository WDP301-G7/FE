export type UserRole = 'sales' | 'operations' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  isActive: boolean;
}

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@eyewear.com',
    role: 'sales',
    department: 'Sales & Support',
    isActive: true,
  },
  {
    id: 'u2',
    name: 'Mike Chen',
    email: 'mike.chen@eyewear.com',
    role: 'sales',
    department: 'Sales & Support',
    isActive: true,
  },
  {
    id: 'u3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@eyewear.com',
    role: 'operations',
    department: 'Operations',
    isActive: true,
  },
  {
    id: 'u4',
    name: 'David Kim',
    email: 'david.kim@eyewear.com',
    role: 'operations',
    department: 'Operations',
    isActive: true,
  },
  {
    id: 'u5',
    name: 'Jennifer Williams',
    email: 'jennifer.williams@eyewear.com',
    role: 'manager',
    department: 'Management',
    isActive: true,
  },
  {
    id: 'u6',
    name: 'Robert Taylor',
    email: 'robert.taylor@eyewear.com',
    role: 'admin',
    department: 'IT Administration',
    isActive: true,
  },
];

export const roleLabels: Record<UserRole, string> = {
  sales: 'Sales / Support Staff',
  operations: 'Operations Staff',
  manager: 'Manager',
  admin: 'System Admin',
};

export const roleColors: Record<UserRole, string> = {
  sales: 'purple',
  operations: 'orange',
  manager: 'cyan',
  admin: 'default',
};
