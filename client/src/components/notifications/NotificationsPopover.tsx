import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useRealTimeMessaging } from '@/hooks/use-real-time-messaging';
import { Bell, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface Notification {
  id: number;
  userId: number;
  type: string;
  content: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  // Listen for real-time events
  const { events } = useRealTimeMessaging();

  // Show toast and update state when a new real-time notification arrives
  useEffect(() => {
    if (events.length > 0) {
      // Get the latest event
      const latestEvent = events[events.length - 1];
      
      if (latestEvent.type === 'notification' || latestEvent.type === 'message' || latestEvent.type === 'appointment') {
        setHasNewNotifications(true);
        
        const messageContent = 
          latestEvent.type === 'message' 
            ? 'You have received a new message' 
            : latestEvent.type === 'appointment'
            ? 'Appointment update'
            : 'New notification';
        
        toast({
          title: latestEvent.type === 'message' ? 'New Message' : 'New Notification',
          description: messageContent,
          duration: 5000,
        });
        
        // Refresh the notifications list
        refetch();
      }
    }
  }, [events, toast, refetch]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      // Update the UI
      await refetch();
      
      // If all notifications are read, clear the new notification indicator
      const updatedNotifications = await refetch();
      const hasUnread = updatedNotifications.data.some(
        (n: Notification) => !n.isRead
      );
      
      if (!hasUnread) {
        setHasNewNotifications(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });
      
      await refetch();
      setHasNewNotifications(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate if there's a link
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
    
    setOpen(false);
  };

  // Count unread notifications
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {(unreadCount > 0 || hasNewNotifications) && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
                    >
                      {unreadCount > 0 ? unreadCount : '•'}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-lg flex justify-between items-center">
              Notifications
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'No new notifications'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No notifications
              </div>
            ) : (
              <ul className="divide-y">
                {notifications.map((notification: Notification) => (
                  <li
                    key={notification.id}
                    className={`py-3 px-4 hover:bg-accent/50 cursor-pointer ${
                      !notification.isRead ? 'bg-accent/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="border-t p-3 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/notifications');
                setOpen(false);
              }}
            >
              View all notifications
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}