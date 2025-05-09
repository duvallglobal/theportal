import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, iconBgColor, trend, className }: StatCardProps) {
  return (
    <div className={cn("bg-background-card rounded-xl shadow-md p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-semibold text-white mt-2">{value}</h3>
          {trend && (
            <p 
              className={cn(
                "text-sm mt-1 flex items-center", 
                trend.direction === 'up' ? 'text-green-500' : 
                trend.direction === 'down' ? 'text-red-500' : 
                'text-yellow-500'
              )}
            >
              {trend.direction === 'up' && <span className="mr-1">↑</span>}
              {trend.direction === 'down' && <span className="mr-1">↓</span>}
              {trend.direction === 'neutral' && <span className="mr-1">→</span>}
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", iconBgColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
