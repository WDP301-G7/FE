import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="p-4 bg-muted/50 rounded-full mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};
