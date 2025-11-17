/**
 * Stats Card Component
 *
 * Displays a single statistic with icon and optional trend
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Props
// ============================================================================

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading,
  className,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              {description && <Skeleton className="h-3 w-40" />}
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendIsPositive = trend && trend.value > 0;
  const trendIsNegative = trend && trend.value < 0;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            {/* Value */}
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    trendIsPositive && 'text-green-600',
                    trendIsNegative && 'text-red-600'
                  )}
                >
                  {trendIsPositive && '+'}
                  {trend.value}% {trend.label}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
