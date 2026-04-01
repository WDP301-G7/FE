import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'success' | 'active' | 'completed' | 'delivered' | 'approved' | 'paid'
  | 'warning' | 'pending' | 'processing' | 'in_progress' | 'low_stock'
  | 'error' | 'failed' | 'cancelled' | 'rejected' | 'out_of_stock'
  | 'info' | 'draft' | 'new' | 'inactive'
  | 'default';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const statusConfig: Record<StatusType, { variant: string; className: string }> = {
  // Success states
  success: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  active: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  completed: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  delivered: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  approved: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  paid: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  
  // Warning states
  warning: { variant: 'default', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  pending: { variant: 'default', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  processing: { variant: 'default', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  in_progress: { variant: 'default', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  low_stock: { variant: 'default', className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  
  // Error states
  error: { variant: 'default', className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  failed: { variant: 'default', className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  cancelled: { variant: 'default', className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  rejected: { variant: 'default', className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  out_of_stock: { variant: 'default', className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  
  // Info states
  info: { variant: 'default', className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  draft: { variant: 'default', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  new: { variant: 'default', className: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  inactive: { variant: 'default', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  
  // Default
  default: { variant: 'default', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className,
  size = 'default' 
}) => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_') as StatusType;
  const config = statusConfig[normalizedStatus] || statusConfig.default;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border capitalize',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};
