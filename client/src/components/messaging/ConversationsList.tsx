import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/lib/context/MessagingProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Loader2, MessageSquare, Search, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: number;
}

export function ConversationsList({
  onSelectConversation,
  selectedConversationId
}: ConversationsListProps) {
  const { user } = useAuth();
  const { conversations, isConnected, error } = useMessaging();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const isLoading = !conversations && !error;

  // Filter conversations based on search query
  const filteredConversations = conversations
    ? conversations.filter((conversation: Conversation) => {
        // Find the other participant (not the current user)
        const otherParticipant = conversation.participants.find(
          (participant) => participant.id !== user?.id
        );

        if (!otherParticipant) return false;

        // Match against name or username
        return (
          otherParticipant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive mb-2">Failed to load conversations</p>
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className="border rounded-lg shadow-sm h-full flex flex-col">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Messages</span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsNewConversationModalOpen(true)}
            title="New conversation"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        </CardTitle>
        <CardDescription>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Real-time active' : 'Offline mode'}
            </span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <ul className="divide-y">
            {filteredConversations.map((conversation: Conversation) => {
              // Find the other participant (not the current user)
              const otherParticipant = conversation.participants.find(
                (participant) => participant.id !== user?.id
              );

              if (!otherParticipant) return null;

              const isSelected = selectedConversationId === conversation.id;

              return (
                <li
                  key={conversation.id}
                  className={`hover:bg-accent/50 cursor-pointer ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-center p-3">
                    <Avatar className="h-10 w-10 mr-3">
                      {otherParticipant.avatarUrl ? (
                        <AvatarImage src={otherParticipant.avatarUrl} />
                      ) : (
                        <AvatarFallback>
                          {otherParticipant.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="font-medium truncate">{otherParticipant.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                            addSuffix: true
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}