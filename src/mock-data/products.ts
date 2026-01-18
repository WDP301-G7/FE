export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  variants: ProductVariant[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Classic Aviator',
    category: 'Sunglasses',
    description: 'Timeless aviator design with premium metal frame and UV400 protection.',
    basePrice: 249.99,
    variants: [
      { id: 'v1-1', color: 'Gold', size: 'Medium', price: 249.99, stock: 25, sku: 'AVI-GLD-M' },
      { id: 'v1-2', color: 'Gold', size: 'Large', price: 249.99, stock: 18, sku: 'AVI-GLD-L' },
      { id: 'v1-3', color: 'Silver', size: 'Medium', price: 269.99, stock: 30, sku: 'AVI-SLV-M' },
      { id: 'v1-4', color: 'Silver', size: 'Large', price: 269.99, stock: 22, sku: 'AVI-SLV-L' },
    ],
    images: ['/placeholder.svg'],
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Urban Rectangle',
    category: 'Eyeglasses',
    description: 'Modern rectangular frames perfect for everyday professional wear.',
    basePrice: 299.99,
    variants: [
      { id: 'v2-1', color: 'Black', size: 'Small', price: 299.99, stock: 40, sku: 'URB-BLK-S' },
      { id: 'v2-2', color: 'Black', size: 'Medium', price: 299.99, stock: 55, sku: 'URB-BLK-M' },
      { id: 'v2-3', color: 'Navy', size: 'Medium', price: 319.99, stock: 28, sku: 'URB-NVY-M' },
      { id: 'v2-4', color: 'Tortoise', size: 'Medium', price: 329.99, stock: 35, sku: 'URB-TRT-M' },
    ],
    images: ['/placeholder.svg'],
    isActive: true,
    createdAt: '2024-07-15T00:00:00Z',
    updatedAt: '2025-01-12T00:00:00Z',
  },
  {
    id: 'p3',
    name: 'Designer Cat Eye',
    category: 'Sunglasses',
    description: 'Elegant cat-eye frames with gradient lenses for a sophisticated look.',
    basePrice: 399.99,
    variants: [
      { id: 'v3-1', color: 'Tortoise', size: 'Small', price: 399.99, stock: 15, sku: 'CAT-TRT-S' },
      { id: 'v3-2', color: 'Black', size: 'Small', price: 399.99, stock: 20, sku: 'CAT-BLK-S' },
      { id: 'v3-3', color: 'Burgundy', size: 'Medium', price: 429.99, stock: 12, sku: 'CAT-BRG-M' },
    ],
    images: ['/placeholder.svg'],
    isActive: true,
    createdAt: '2024-08-20T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
  {
    id: 'p4',
    name: 'Sport Wrap',
    category: 'Sports',
    description: 'Performance eyewear with wraparound design for active lifestyles.',
    basePrice: 179.99,
    variants: [
      { id: 'v4-1', color: 'Matte Black', size: 'Universal', price: 179.99, stock: 60, sku: 'SPT-MBK-U' },
      { id: 'v4-2', color: 'White', size: 'Universal', price: 179.99, stock: 45, sku: 'SPT-WHT-U' },
      { id: 'v4-3', color: 'Red', size: 'Universal', price: 189.99, stock: 30, sku: 'SPT-RED-U' },
    ],
    images: ['/placeholder.svg'],
    isActive: true,
    createdAt: '2024-09-10T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: 'p5',
    name: 'Vintage Round',
    category: 'Eyeglasses',
    description: 'Retro-inspired round frames with modern comfort features.',
    basePrice: 279.99,
    variants: [
      { id: 'v5-1', color: 'Rose Gold', size: 'Small', price: 299.99, stock: 22, sku: 'VNT-RSG-S' },
      { id: 'v5-2', color: 'Gold', size: 'Small', price: 279.99, stock: 18, sku: 'VNT-GLD-S' },
      { id: 'v5-3', color: 'Silver', size: 'Medium', price: 289.99, stock: 25, sku: 'VNT-SLV-M' },
    ],
    images: ['/placeholder.svg'],
    isActive: true,
    createdAt: '2024-10-05T00:00:00Z',
    updatedAt: '2025-01-14T00:00:00Z',
  },
  {
    id: 'p6',
    name: 'Executive Titanium',
    category: 'Eyeglasses',
    description: 'Premium titanium frames with flex hinges for ultimate durability.',
    basePrice: 499.99,
    variants: [
      { id: 'v6-1', color: 'Gunmetal', size: 'Medium', price: 499.99, stock: 10, sku: 'EXE-GNM-M' },
      { id: 'v6-2', color: 'Gunmetal', size: 'Large', price: 499.99, stock: 8, sku: 'EXE-GNM-L' },
      { id: 'v6-3', color: 'Black', size: 'Medium', price: 549.99, stock: 12, sku: 'EXE-BLK-M' },
    ],
    images: ['/placeholder.svg'],
    isActive: true,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2025-01-16T00:00:00Z',
  },
];

export const productCategories = ['Sunglasses', 'Eyeglasses', 'Sports', 'Reading', 'Kids'];
