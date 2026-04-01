import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
  subtitle?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor = 'bg-blue-100 dark:bg-blue-900/20',
  iconColor = 'text-blue-600 dark:text-blue-400',
  subtitle,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </p>
              <h3 className="text-3xl font-bold text-foreground mb-1">
                {value}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={cn(
                      'text-xs font-semibold flex items-center',
                      trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              )}
            </div>
            <div className={cn(
              'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
              iconBgColor
            )}>
              <Icon className={cn('h-6 w-6', iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
