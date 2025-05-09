import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  sender_id: number;
  recipient_id: number;
  conversation_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface RealTimeEvent {
  type: 'message' | 'notification' | 'status' | 'typing' | 'read' | 'appointment';
  payload: any;
}

interface UseRealTimeMessagingProps {
  conversationId?: number;
}

export function useRealTimeMessaging({ conversationId }: UseRealTimeMessagingProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/messages/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching messages'));
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId]);

  // Send a message
  const sendMessage = useCallback(async (content: string, recipientId: number) => {
    if (!user) return null;
    
    try {
      const messageData = {
        content,
        recipientId,
        conversationId: conversationId || null
      };
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const newMessage = await response.json();
      
      // Insert into Supabase for real-time delivery
      await supabase
        .from('messages')
        .insert([{
          id: newMessage.id,
          sender_id: user.id,
          recipient_id: recipientId,
          conversation_id: conversationId || null,
          content,
          is_read: false
        }]);
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, conversationId, toast]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      // Update the local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId.toString() ? { ...msg, is_read: true } : msg
        )
      );
      
      // Update Supabase for real-time sync
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
        
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to all messages where the user is the recipient
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, 
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Add to messages if in the current conversation
          if (conversationId && newMessage.conversation_id === conversationId) {
            setMessages(prevMessages => [...prevMessages, newMessage]);
          }
          
          // Add to events for notifications
          setEvents(prev => [...prev, { 
            type: 'message', 
            payload: newMessage 
          }]);
          
          // Show toast notification
          toast({
            title: 'New Message',
            description: 'You have received a new message',
          });
        }
      )
      .subscribe();
    
    // Subscribe to appointment notifications
    const appointmentSubscription = supabase
      .channel('public:appointments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `client_id=eq.${user.id}`
        }, 
        (payload) => {
          // Add to events for notifications
          setEvents(prev => [...prev, { 
            type: 'appointment', 
            payload: payload.new
          }]);
          
          // Show toast notification
          toast({
            title: 'Appointment Update',
            description: 'Your appointment has been updated',
          });
        }
      )
      .subscribe();

    // Fetch messages for the conversation
    if (conversationId) {
      fetchMessages();
    }

    // Cleanup
    return () => {
      subscription.unsubscribe();
      appointmentSubscription.unsubscribe();
    };
  }, [user, conversationId, fetchMessages, toast]);

  return {
    messages,
    isLoading,
    error,
    events,
    sendMessage,
    markAsRead,
    refreshMessages: fetchMessages,
  };
}