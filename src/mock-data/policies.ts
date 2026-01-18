export interface Policy {
  id: string;
  name: string;
  type: 'return' | 'warranty' | 'shipping';
  description: string;
  conditions: string[];
  duration: string;
  isActive: boolean;
  updatedAt: string;
}

export const mockPolicies: Policy[] = [
  {
    id: 'pol-001',
    name: 'Standard Return Policy',
    type: 'return',
    description: 'Return policy for regular eyewear purchases',
    conditions: [
      'Item must be in original condition',
      'Original packaging required',
      'Receipt or order confirmation required',
      'Prescription lenses are non-returnable',
    ],
    duration: '30 days',
    isActive: true,
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pol-002',
    name: 'Extended Warranty',
    type: 'warranty',
    description: 'Extended warranty coverage for premium frames',
    conditions: [
      'Covers manufacturing defects',
      'Includes frame adjustments',
      'One free lens replacement',
      'Does not cover accidental damage',
    ],
    duration: '2 years',
    isActive: true,
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pol-003',
    name: 'Basic Warranty',
    type: 'warranty',
    description: 'Standard warranty for all products',
    conditions: [
      'Covers manufacturing defects only',
      'Free adjustments for 6 months',
      'Does not cover scratches or damage',
    ],
    duration: '1 year',
    isActive: true,
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pol-004',
    name: 'Free Shipping',
    type: 'shipping',
    description: 'Free shipping for orders over $200',
    conditions: [
      'Orders must exceed $200',
      'Continental US only',
      'Standard shipping (5-7 business days)',
    ],
    duration: 'Ongoing',
    isActive: true,
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

export interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  category: string;
}

export const mockFeatureToggles: FeatureToggle[] = [
  {
    id: 'ft-001',
    name: 'Virtual Try-On',
    description: 'Allow customers to virtually try on frames using AR technology',
    isEnabled: true,
    category: 'Customer Experience',
  },
  {
    id: 'ft-002',
    name: 'Express Delivery',
    description: 'Enable same-day delivery option for select areas',
    isEnabled: false,
    category: 'Shipping',
  },
  {
    id: 'ft-003',
    name: 'Prescription Upload',
    description: 'Allow customers to upload prescription images directly',
    isEnabled: true,
    category: 'Orders',
  },
  {
    id: 'ft-004',
    name: 'Loyalty Program',
    description: 'Enable points-based loyalty rewards system',
    isEnabled: true,
    category: 'Marketing',
  },
  {
    id: 'ft-005',
    name: 'Live Chat Support',
    description: 'Enable real-time chat support for customers',
    isEnabled: false,
    category: 'Customer Experience',
  },
];
