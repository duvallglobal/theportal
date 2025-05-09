import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: ReactNode;
  iconBgColor: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
  className?: string;
}

export function RecentActivityCard({ activities, className }: RecentActivityCardProps) {
  return (
    <div className={cn("bg-background-card rounded-xl shadow-md p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <a href="#" className="text-sm text-primary hover:text-primary-light">View All</a>
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No recent activities</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className={cn("p-2 rounded-lg mr-4", activity.iconBgColor)}>
                {activity.icon}
              </div>
              <div>
                <p className="text-white font-medium">{activity.title}</p>
                <p className="text-gray-400 text-sm">{activity.description}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
