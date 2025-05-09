import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  attachments?: any[];
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: number;
  lastMessageAt: string;
  lastMessage: string;
  unreadCount: number;
  participants: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
  }[];
}

export function useRealTimeMessaging() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [isTyping, setIsTyping] = useState<Record<number, boolean>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase real-time connection
  useEffect(() => {
    if (!user) return;

    // Fetch conversations
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data = await response.json();
        setConversations(data);
        
        // Initialize messages state with empty arrays for each conversation
        const initialMessages: Record<number, Message[]> = {};
        data.forEach((conversation: Conversation) => {
          initialMessages[conversation.id] = [];
        });
        setMessages(initialMessages);
        
        // Fetch messages for each conversation
        data.forEach((conversation: Conversation) => {
          fetchMessages(conversation.id);
        });
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations');
      }
    };
    
    fetchConversations();
    
    // Subscribe to real-time updates
    const setupRealtime = async () => {
      try {
        // Subscribe to new messages channel
        const messageSubscription = supabase
          .channel('messages')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          }, (payload) => {
            const newMessage = payload.new as Message;
            // Only process messages for conversations we're tracking
            if (messages[newMessage.conversationId]) {
              setMessages(prev => ({
                ...prev,
                [newMessage.conversationId]: [
                  ...prev[newMessage.conversationId],
                  newMessage
                ]
              }));
              
              // If the message is from someone else, mark typing as false
              if (newMessage.senderId !== user.id) {
                setIsTyping(prev => ({
                  ...prev,
                  [newMessage.conversationId]: false
                }));
              }
              
              // Invalidate conversations query to refresh the list
              queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            }
          })
          .subscribe();
        
        // Subscribe to typing indicators channel
        const typingSubscription = supabase
          .channel('typing')
          .on('broadcast', { event: 'typing' }, (payload) => {
            if (payload.conversationId && payload.senderId !== user.id) {
              setIsTyping(prev => ({
                ...prev,
                [payload.conversationId]: payload.isTyping
              }));
              
              // Clear typing indicator after a few seconds
              if (payload.isTyping) {
                setTimeout(() => {
                  setIsTyping(prev => ({
                    ...prev,
                    [payload.conversationId]: false
                  }));
                }, 3000);
              }
            }
          })
          .subscribe();
        
        setIsConnected(true);
        
        // Cleanup function
        return () => {
          supabase.removeChannel(messageSubscription);
          supabase.removeChannel(typingSubscription);
        };
      } catch (error) {
        console.error('Error setting up real-time:', error);
        setError('Failed to connect to real-time messaging');
        setIsConnected(false);
      }
    };
    
    setupRealtime();
  }, [user]);

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(prev => ({
        ...prev,
        [conversationId]: data
      }));
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    }
  };

  // Send a message
  const sendMessage = async (
    conversationId: number, 
    content: string,
    attachments?: any
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          attachments
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Send typing indicator
  const sendTypingIndicator = async (
    conversationId: number,
    isTyping: boolean
  ): Promise<boolean> => {
    if (!user || !isConnected) return false;
    
    try {
      await supabase
        .channel('typing')
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            conversationId,
            senderId: user.id,
            isTyping
          }
        });
      
      return true;
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      return false;
    }
  };

  // Mark message as read
  const markMessageAsRead = async (messageId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      // Update local state
      setMessages(prev => {
        const updatedMessages = { ...prev };
        
        // Find which conversation contains this message
        for (const conversationId in updatedMessages) {
          const conversationMessages = updatedMessages[conversationId];
          const messageIndex = conversationMessages.findIndex(msg => msg.id === messageId);
          
          if (messageIndex !== -1) {
            updatedMessages[conversationId] = [
              ...conversationMessages.slice(0, messageIndex),
              { ...conversationMessages[messageIndex], isRead: true },
              ...conversationMessages.slice(messageIndex + 1)
            ];
            break;
          }
        }
        
        return updatedMessages;
      });
      
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  };

  // Create a new conversation
  const createConversation = async (recipientId: number): Promise<number | null> => {
    if (!user) return null;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantIds: [user.id, recipientId]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const data = await response.json();
      
      // Refresh conversations
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  return {
    messages,
    isTyping,
    conversations,
    isConnected,
    error,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
    createConversation,
    fetchMessages
  };
}