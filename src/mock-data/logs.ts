export type LogAction = 
  | 'login'
  | 'logout'
  | 'order_created'
  | 'order_updated'
  | 'order_approved'
  | 'order_rejected'
  | 'product_created'
  | 'product_updated'
  | 'user_created'
  | 'user_updated'
  | 'settings_changed'
  | 'prescription_verified'
  | 'shipping_created';

export interface AuditLog {
  id: string;
  action: LogAction;
  userId: string;
  userName: string;
  userRole: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

export const mockLogs: AuditLog[] = [
  {
    id: 'log-001',
    action: 'login',
    userId: 'u5',
    userName: 'Jennifer Williams',
    userRole: 'manager',
    description: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    timestamp: '2025-01-18T08:00:00Z',
  },
  {
    id: 'log-002',
    action: 'order_approved',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userRole: 'sales',
    description: 'Approved order ORD-004',
    metadata: { orderId: 'ORD-004' },
    ipAddress: '192.168.1.101',
    timestamp: '2025-01-17T16:30:00Z',
  },
  {
    id: 'log-003',
    action: 'prescription_verified',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userRole: 'sales',
    description: 'Verified prescription for order ORD-002',
    metadata: { orderId: 'ORD-002', prescriptionId: 'rx-001' },
    ipAddress: '192.168.1.101',
    timestamp: '2025-01-16T14:45:00Z',
  },
  {
    id: 'log-004',
    action: 'product_updated',
    userId: 'u5',
    userName: 'Jennifer Williams',
    userRole: 'manager',
    description: 'Updated product: Classic Aviator',
    metadata: { productId: 'p1' },
    ipAddress: '192.168.1.100',
    timestamp: '2025-01-16T11:20:00Z',
  },
  {
    id: 'log-005',
    action: 'shipping_created',
    userId: 'u3',
    userName: 'Emily Rodriguez',
    userRole: 'operations',
    description: 'Created shipping label for ORD-004',
    metadata: { orderId: 'ORD-004', trackingNumber: 'TRK123456789' },
    ipAddress: '192.168.1.102',
    timestamp: '2025-01-17T08:00:00Z',
  },
  {
    id: 'log-006',
    action: 'settings_changed',
    userId: 'u6',
    userName: 'Robert Taylor',
    userRole: 'admin',
    description: 'Modified system security settings',
    metadata: { setting: 'session_timeout', oldValue: 30, newValue: 60 },
    ipAddress: '192.168.1.103',
    timestamp: '2025-01-15T10:00:00Z',
  },
  {
    id: 'log-007',
    action: 'user_created',
    userId: 'u5',
    userName: 'Jennifer Williams',
    userRole: 'manager',
    description: 'Created new user: Mike Chen',
    metadata: { newUserId: 'u2' },
    ipAddress: '192.168.1.100',
    timestamp: '2025-01-14T09:30:00Z',
  },
  {
    id: 'log-008',
    action: 'order_created',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userRole: 'sales',
    description: 'Created new order ORD-008',
    metadata: { orderId: 'ORD-008' },
    ipAddress: '192.168.1.101',
    timestamp: '2025-01-15T08:30:00Z',
  },
];

export const actionLabels: Record<LogAction, string> = {
  login: 'Login',
  logout: 'Logout',
  order_created: 'Order Created',
  order_updated: 'Order Updated',
  order_approved: 'Order Approved',
  order_rejected: 'Order Rejected',
  product_created: 'Product Created',
  product_updated: 'Product Updated',
  user_created: 'User Created',
  user_updated: 'User Updated',
  settings_changed: 'Settings Changed',
  prescription_verified: 'Prescription Verified',
  shipping_created: 'Shipping Created',
};
