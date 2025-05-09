import React, { useState, useRef, useEffect } from 'react';
import { useRealTimeMessaging, Message } from '@/hooks/use-real-time-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, SendHorizontal, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  conversationId: number;
  recipientId: number;
  recipientName: string;
  recipientAvatarUrl?: string;
}

export function ChatInterface({ 
  conversationId,
  recipientId, 
  recipientName,
  recipientAvatarUrl
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    markAsRead,
    refreshMessages
  } = useRealTimeMessaging({ conversationId });

  // Handle scrolling to the bottom on new messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when visible
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => !msg.is_read && msg.sender_id.toString() !== user?.id.toString()
    );
    
    unreadMessages.forEach(message => {
      markAsRead(parseInt(message.id));
    });
  }, [messages, markAsRead, user?.id]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;
    
    await sendMessage(messageText, recipientId);
    setMessageText('');
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive">Failed to load messages</p>
        <Button onClick={refreshMessages} className="mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full border rounded-lg shadow-sm">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2">
          <Avatar>
            {recipientAvatarUrl ? (
              <AvatarImage src={recipientAvatarUrl} alt={recipientName} />
            ) : (
              <AvatarFallback>{recipientName.substring(0, 2).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <span>{recipientName}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message: Message) => {
            const isFromUser = message.sender_id.toString() === user?.id.toString();
            return (
              <div 
                key={message.id}
                className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isFromUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="mb-1">{message.content}</div>
                  <div className="flex items-center justify-end gap-1 text-xs opacity-70">
                    <span>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {isFromUser && message.is_read && (
                      <CheckCheck className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <div className="flex w-full gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[50px] resize-none"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!messageText.trim()}
            className="self-end"
          >
            <SendHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}