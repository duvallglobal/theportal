import { useState, useEffect } from 'react';
import { ConversationsList } from '@/components/messaging/ConversationsList';
import { ChatInterface } from '@/components/messaging/ChatInterface';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/lib/context/MessagingProvider';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  const { conversations, error, isConnected } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Check if we're in mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check on mount and window resize
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Reset mobile view when conversation changes
  useEffect(() => {
    if (selectedConversation && isMobileView) {
      setShowMobileChat(true);
    }
  }, [selectedConversation, isMobileView]);
  
  // Get the other participant (not the current user)
  const recipient = selectedConversation
    ? selectedConversation.participants.find(p => p.id !== user?.id)
    : null;

  // Handle back button in mobile view
  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
      <div className="container px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-[calc(100vh-200px)]">
              {/* Conversations List - Left Column (hidden in mobile when chat is shown) */}
              {(!isMobileView || (isMobileView && !showMobileChat)) && (
                <div className="md:col-span-1 h-full border-r">
                  <div className="p-4 border-b">
                    <h2 className="font-medium">Conversations</h2>
                    {isConnected ? (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-xs text-muted-foreground">Offline</span>
                      </div>
                    )}
                  </div>
                  <div className="h-[calc(100%-65px)] overflow-auto">
                    <ConversationsList 
                      onSelectConversation={setSelectedConversation}
                      selectedConversationId={selectedConversation?.id}
                    />
                  </div>
                </div>
              )}
              
              {/* Chat Interface - Right Column (full width in mobile) */}
              {(!isMobileView || (isMobileView && showMobileChat)) && (
                <div className={`${isMobileView ? 'col-span-1' : 'md:col-span-2'} h-full`}>
                  {selectedConversation && recipient ? (
                    <div className="flex flex-col h-full">
                      {/* Mobile back button */}
                      {isMobileView && showMobileChat && (
                        <Button 
                          variant="ghost" 
                          onClick={handleBackToList}
                          className="flex items-center m-2 w-fit"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Back to conversations
                        </Button>
                      )}
                      
                      <ChatInterface 
                        conversationId={selectedConversation.id}
                        recipientName={recipient.fullName}
                        recipientAvatar={recipient.avatarUrl}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                      <h3 className="text-lg font-medium">No conversation selected</h3>
                      {conversations && conversations.length > 0 ? (
                        <p className="text-muted-foreground text-center max-w-xs mt-1">
                          Select a conversation from the list to start messaging
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-center max-w-xs mt-1">
                          You don't have any conversations yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}