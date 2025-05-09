import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/lib/context/MessagingProvider';
import { MessageSquare, ChevronLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationsList } from '@/components/messaging/ConversationsList';
import { ChatInterface } from '@/components/messaging/ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function AdminMessaging() {
  const { user } = useAuth();
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
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messaging</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              All Clients
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-[calc(100vh-240px)]">
              {/* Conversations List - Left Column (hidden in mobile when chat is shown) */}
              {(!isMobileView || (isMobileView && !showMobileChat)) && (
                <div className="md:col-span-1 h-full border-r">
                  <div className="p-4 border-b">
                    <h2 className="font-medium">Conversations</h2>
                  </div>
                  <div className="h-[calc(100%-49px)] overflow-auto">
                    <ConversationsList 
                      onSelectConversation={setSelectedConversation}
                      selectedConversationId={selectedConversation?.id}
                    />
                  </div>
                </div>
              )}
              
              {/* Chat Interface - Right Column (full width in mobile) */}
              {(!isMobileView || (isMobileView && showMobileChat)) && (
                <div className={`${isMobileView ? 'col-span-1' : 'md:col-span-2'} h-full flex flex-col`}>
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
                    <div className="flex flex-col items-center justify-center h-full bg-muted/10 rounded-lg">
                      <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                      <h3 className="text-lg font-medium">Select a conversation</h3>
                      <p className="text-muted-foreground text-center max-w-xs mt-1">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}