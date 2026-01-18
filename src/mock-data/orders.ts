export type OrderType = 'in-stock' | 'pre-order' | 'prescription';
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
export type PrescriptionStatus = 'pending' | 'verified' | 'processing' | 'completed' | 'update-required';

export interface Prescription {
  id: string;
  rightSphere: string;
  rightCylinder: string;
  rightAxis: string;
  leftSphere: string;
  leftCylinder: string;
  leftAxis: string;
  pd: string;
  status: PrescriptionStatus;
  uploadedAt: string;
  verifiedBy?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  productVariant: string;
  type: OrderType;
  status: OrderStatus;
  prescription?: Prescription;
  assignedStaffId?: string;
  assignedStaffName?: string;
  totalAmount: number;
  shippingAddress: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: 'c1',
    customerName: 'Alice Brown',
    customerEmail: 'alice.brown@email.com',
    productId: 'p1',
    productName: 'Classic Aviator',
    productVariant: 'Gold / Brown Lens',
    type: 'in-stock',
    status: 'pending',
    assignedStaffId: 'u1',
    assignedStaffName: 'Sarah Johnson',
    totalAmount: 249.99,
    shippingAddress: '123 Main St, New York, NY 10001',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'ORD-002',
    customerId: 'c2',
    customerName: 'Bob Wilson',
    customerEmail: 'bob.wilson@email.com',
    productId: 'p2',
    productName: 'Urban Rectangle',
    productVariant: 'Black / Clear Lens',
    type: 'prescription',
    status: 'processing',
    prescription: {
      id: 'rx-001',
      rightSphere: '-2.00',
      rightCylinder: '-0.50',
      rightAxis: '180',
      leftSphere: '-1.75',
      leftCylinder: '-0.75',
      leftAxis: '175',
      pd: '63',
      status: 'verified',
      uploadedAt: '2025-01-14T14:20:00Z',
      verifiedBy: 'Sarah Johnson',
    },
    assignedStaffId: 'u1',
    assignedStaffName: 'Sarah Johnson',
    totalAmount: 349.99,
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    createdAt: '2025-01-14T14:00:00Z',
    updatedAt: '2025-01-16T09:15:00Z',
  },
  {
    id: 'ORD-003',
    customerId: 'c3',
    customerName: 'Carol Davis',
    customerEmail: 'carol.davis@email.com',
    productId: 'p3',
    productName: 'Designer Cat Eye',
    productVariant: 'Tortoise / Gradient',
    type: 'pre-order',
    status: 'processing',
    assignedStaffId: 'u2',
    assignedStaffName: 'Mike Chen',
    totalAmount: 429.99,
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
    createdAt: '2025-01-13T11:45:00Z',
    updatedAt: '2025-01-15T16:30:00Z',
    notes: 'Expected arrival: Jan 25, 2025',
  },
  {
    id: 'ORD-004',
    customerId: 'c4',
    customerName: 'Daniel Lee',
    customerEmail: 'daniel.lee@email.com',
    productId: 'p4',
    productName: 'Sport Wrap',
    productVariant: 'Matte Black / Polarized',
    type: 'in-stock',
    status: 'shipped',
    assignedStaffId: 'u1',
    assignedStaffName: 'Sarah Johnson',
    totalAmount: 189.99,
    shippingAddress: '321 Elm St, Houston, TX 77001',
    trackingNumber: 'TRK123456789',
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-17T08:00:00Z',
  },
  {
    id: 'ORD-005',
    customerId: 'c5',
    customerName: 'Eva Martinez',
    customerEmail: 'eva.martinez@email.com',
    productId: 'p2',
    productName: 'Urban Rectangle',
    productVariant: 'Navy / Clear Lens',
    type: 'prescription',
    status: 'pending',
    prescription: {
      id: 'rx-002',
      rightSphere: '-3.25',
      rightCylinder: '-1.00',
      rightAxis: '90',
      leftSphere: '-3.00',
      leftCylinder: '-0.75',
      leftAxis: '85',
      pd: '61',
      status: 'update-required',
      uploadedAt: '2025-01-16T13:00:00Z',
    },
    assignedStaffId: 'u2',
    assignedStaffName: 'Mike Chen',
    totalAmount: 379.99,
    shippingAddress: '654 Cedar Ln, Phoenix, AZ 85001',
    createdAt: '2025-01-16T12:30:00Z',
    updatedAt: '2025-01-17T10:00:00Z',
    notes: 'Prescription needs update - expired',
  },
  {
    id: 'ORD-006',
    customerId: 'c6',
    customerName: 'Frank Thompson',
    customerEmail: 'frank.thompson@email.com',
    productId: 'p5',
    productName: 'Vintage Round',
    productVariant: 'Rose Gold / Pink Tint',
    type: 'in-stock',
    status: 'ready',
    assignedStaffId: 'u1',
    assignedStaffName: 'Sarah Johnson',
    totalAmount: 299.99,
    shippingAddress: '987 Birch Ave, Seattle, WA 98101',
    createdAt: '2025-01-11T15:20:00Z',
    updatedAt: '2025-01-16T14:00:00Z',
  },
  {
    id: 'ORD-007',
    customerId: 'c7',
    customerName: 'Grace Kim',
    customerEmail: 'grace.kim@email.com',
    productId: 'p1',
    productName: 'Classic Aviator',
    productVariant: 'Silver / Blue Mirror',
    type: 'in-stock',
    status: 'delivered',
    assignedStaffId: 'u2',
    assignedStaffName: 'Mike Chen',
    totalAmount: 269.99,
    shippingAddress: '147 Maple Dr, Boston, MA 02101',
    trackingNumber: 'TRK987654321',
    createdAt: '2025-01-08T10:00:00Z',
    updatedAt: '2025-01-14T12:00:00Z',
  },
  {
    id: 'ORD-008',
    customerId: 'c8',
    customerName: 'Henry Adams',
    customerEmail: 'henry.adams@email.com',
    productId: 'p6',
    productName: 'Executive Titanium',
    productVariant: 'Gunmetal / Progressive',
    type: 'prescription',
    status: 'processing',
    prescription: {
      id: 'rx-003',
      rightSphere: '+1.50',
      rightCylinder: '-0.25',
      rightAxis: '170',
      leftSphere: '+1.25',
      leftCylinder: '-0.50',
      leftAxis: '5',
      pd: '65',
      status: 'processing',
      uploadedAt: '2025-01-15T09:00:00Z',
      verifiedBy: 'Mike Chen',
    },
    assignedStaffId: 'u1',
    assignedStaffName: 'Sarah Johnson',
    totalAmount: 549.99,
    shippingAddress: '258 Oak St, Miami, FL 33101',
    createdAt: '2025-01-15T08:30:00Z',
    updatedAt: '2025-01-17T11:00:00Z',
  },
];

export const orderTypeLabels: Record<OrderType, string> = {
  'in-stock': 'In Stock',
  'pre-order': 'Pre-Order',
  'prescription': 'Prescription',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

export const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'gold',
  processing: 'blue',
  ready: 'cyan',
  shipped: 'geekblue',
  delivered: 'green',
  returned: 'orange',
  cancelled: 'red',
};

export const prescriptionStatusColors: Record<PrescriptionStatus, string> = {
  pending: 'gold',
  verified: 'green',
  processing: 'blue',
  completed: 'green',
  'update-required': 'red',
};
