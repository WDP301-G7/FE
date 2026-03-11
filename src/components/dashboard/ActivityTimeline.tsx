import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  title?: string;
  className?: string;
  maxHeight?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  title = 'Recent Activity',
  className,
  maxHeight = '500px',
}) => {
  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label = date.toLocaleDateString();
    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <Card className={cn('border-border/50', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          {Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date} className="mb-6 last:mb-0">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background/95 backdrop-blur py-1">
                {date}
              </h4>
              <div className="space-y-4">
                {items.map((activity, idx) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-3 group"
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            'p-2 rounded-lg transition-transform group-hover:scale-110',
                            activity.iconBgColor || 'bg-primary/10'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              activity.iconColor || 'text-primary'
                            )}
                          />
                        </div>
                        {idx < items.length - 1 && (
                          <div className="absolute left-1/2 top-full h-4 w-px bg-border -translate-x-1/2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
