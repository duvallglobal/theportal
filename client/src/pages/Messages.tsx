import { useState } from 'react';
import { SidebarLayout } from '@/components/layouts/SidebarLayout';
import { ConversationsList } from '@/components/messaging/ConversationsList';
import { ChatInterface } from '@/components/messaging/ChatInterface';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/lib/context/MessagingProvider';
import { MessageSquare } from 'lucide-react';

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

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Get the other participant (not the current user)
  const recipient = selectedConversation
    ? selectedConversation.participants.find(p => p.id !== user?.id)
    : null;

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List - Left Column */}
          <div className="md:col-span-1 h-full">
            <ConversationsList 
              onSelectConversation={setSelectedConversation}
              selectedConversationId={selectedConversation?.id}
            />
          </div>
          
          {/* Chat Interface - Right Column */}
          <div className="md:col-span-2 h-full">
            {selectedConversation && recipient ? (
              <ChatInterface 
                conversationId={selectedConversation.id}
                recipientName={recipient.fullName}
                recipientAvatar={recipient.avatarUrl}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg border border-dashed">
                <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium">Select a conversation</h3>
                <p className="text-muted-foreground text-center max-w-xs mt-1">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}