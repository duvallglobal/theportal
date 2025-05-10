import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { useMessaging } from '@/lib/context/MessagingProvider';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Notification {
  id: number;
  recipientId: number;
  title: string;
  content: string; // This is the message field
  type: string;
  isRead: boolean;
  link?: string; // This is used instead of entityId/entityType
  createdAt: string;
}

export function NotificationsPopover() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up polling for notifications (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  // Mark notification as read
  const handleNotificationClick = async (notification: Notification) => {
    // Only process if it's unread
    if (notification.isRead) {
      navigateToEntity(notification);
      return;
    }
    
    try {
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => prev - 1);
      
      // Navigate to the entity
      navigateToEntity(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Navigate to the entity associated with the notification
  const navigateToEntity = (notification: Notification) => {
    setOpen(false);
    
    // If notification has a specific link, use that
    if (notification.link) {
      navigate(notification.link);
      return;
    }
    
    // Otherwise navigate based on type
    switch (notification.type) {
      case 'message':
        navigate(`/messages`);
        break;
      case 'appointment':
        navigate(`/appointments`);
        break;
      case 'content':
        navigate(`/content`);
        break;
      case 'verification':
        navigate(`/profile?tab=verification`);
        break;
      case 'billing':
        navigate(`/billing`);
        break;
      default:
        // Just close the popover if we don't know where to navigate
        break;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'appointment':
        return '📅';
      case 'content':
        return '📸';
      case 'verification':
        return '🔐';
      case 'billing':
        return '💰';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center px-1 translate-x-1/4 -translate-y-1/4">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border p-3 flex items-center justify-between">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
              <p>No notifications</p>
              <p className="text-sm mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  className={`hover:bg-accent/50 cursor-pointer p-3 ${
                    !notification.isRead ? 'bg-accent/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl" aria-hidden="true">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}