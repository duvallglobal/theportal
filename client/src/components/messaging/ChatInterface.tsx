import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/lib/context/MessagingProvider';
import { Message } from '@/hooks/use-real-time-messaging';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  conversationId: number;
  recipientName: string;
  recipientAvatar?: string;
}

export function ChatInterface({ conversationId, recipientName, recipientAvatar }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, sendMessage, sendTypingIndicator, isTyping } = useMessaging();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationMessages = messages[conversationId] || [];
  const isRecipientTyping = isTyping[conversationId];

  // Scroll to bottom on new message
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || !user) {
      return;
    }

    // Handle file uploads if any
    let attachmentData = null;
    if (attachments.length > 0) {
      setIsUploading(true);
      try {
        // In a real implementation, you'd upload files to storage here
        // For now, we'll just include the filenames
        attachmentData = attachments.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        }));
      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsUploading(false);
      }
    }

    // Send the message
    const success = await sendMessage(conversationId, message, attachmentData);
    
    if (success) {
      setMessage('');
      setAttachments([]);
    }
  };

  // Handle text input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Send typing indicator
    sendTypingIndicator(conversationId, true);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  // Determine message grouping (for UI styling)
  const messageGrouping = (message: Message, index: number) => {
    const isCurrentUser = message.senderId === user?.id;
    const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
    const nextMessage = index < conversationMessages.length - 1 
      ? conversationMessages[index + 1] 
      : null;
    
    const isPrevSameSender = prevMessage && prevMessage.senderId === message.senderId;
    const isNextSameSender = nextMessage && nextMessage.senderId === message.senderId;
    
    return {
      isCurrentUser,
      isFirstInGroup: !isPrevSameSender,
      isLastInGroup: !isNextSameSender
    };
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={recipientAvatar} alt={recipientName} />
            <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{recipientName}</h3>
            {isRecipientTyping && (
              <p className="text-xs text-primary animate-pulse">Typing...</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-3">
          {conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </div>
          ) : (
            conversationMessages.map((msg, index) => {
              const { isCurrentUser, isFirstInGroup } = messageGrouping(msg, index);
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[80%]">
                    <div 
                      className={`
                        flex 
                        ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} 
                        items-end gap-2
                      `}
                    >
                      {isFirstInGroup && !isCurrentUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={recipientAvatar} alt={recipientName} />
                          <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div 
                        className={`
                          rounded-lg p-3 
                          ${isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                          }
                        `}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        
                        {/* Attachments if any */}
                        {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((attachment, i) => (
                              <div key={i} className="flex items-center gap-1 text-xs">
                                {attachment.type?.startsWith('image/') ? (
                                  <Image className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <span className="truncate max-w-[200px]">{attachment.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div 
                          className={`
                            text-xs mt-1 
                            ${isCurrentUser 
                              ? 'text-primary-foreground/70' 
                              : 'text-secondary-foreground/70'
                            }
                          `}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </div>
                      </div>
                      
                      {isFirstInGroup && isCurrentUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {getInitials(user?.fullName || '')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Message end marker for scrolling */}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1 bg-secondary rounded px-2 py-1"
              >
                {file.type.startsWith('image/') ? (
                  <Image className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                <span className="text-xs truncate max-w-[100px]">
                  {file.name}
                </span>
                <button 
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-3 sm:p-4 border-t">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 h-10 w-10"
            disabled={isUploading}
            aria-label="Attach files"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Textarea
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[2.5rem] max-h-32 flex-1 py-2"
            disabled={isUploading}
          />
          
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            className="shrink-0 h-10 w-10"
            disabled={(!message.trim() && attachments.length === 0) || isUploading}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}