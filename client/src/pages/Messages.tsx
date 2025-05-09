import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Bell,
  Mail,
  MessageSquare,
} from "lucide-react";

// Define message schema
const messageSchema = z.object({
  content: z.string().min(1, { message: "Message cannot be empty" }),
});

type MessageValues = z.infer<typeof messageSchema>;

// Message type
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: string[];
}

// Conversation type
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isAdmin?: boolean;
  }[];
}

export default function Messages() {
  const [activeTab, setActiveTab] = useState<string>("chats");
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation]);

  // Message form
  const form = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  // Get conversations query
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      // Mocked data for demo
      const mockConversations: Conversation[] = [
        {
          id: "conv1",
          title: "Admin Support",
          lastMessage: "Your content has been approved and scheduled",
          lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          unreadCount: 2,
          participants: [
            {
              id: "admin1",
              name: "MJ Duvall",
              avatar: "",
              isAdmin: true,
            },
            {
              id: "user1",
              name: user?.fullName || "You",
              avatar: "",
            },
          ],
        },
        {
          id: "conv2",
          title: "Photography Team",
          lastMessage: "We've scheduled your photo shoot for next Friday",
          lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          unreadCount: 0,
          participants: [
            {
              id: "photo1",
              name: "Studio Team",
              avatar: "",
            },
            {
              id: "user1",
              name: user?.fullName || "You",
              avatar: "",
            },
          ],
        },
        {
          id: "conv3",
          title: "Technical Support",
          lastMessage: "Let me know if you're still having issues with uploads",
          lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          unreadCount: 0,
          participants: [
            {
              id: "tech1",
              name: "Tech Support",
              avatar: "",
            },
            {
              id: "user1",
              name: user?.fullName || "You",
              avatar: "",
            },
          ],
        },
      ];

      return mockConversations;
    },
  });

  // Get messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", activeConversation?.id],
    enabled: !!activeConversation,
    queryFn: async () => {
      if (!activeConversation) return [];

      // Mocked data for demo
      const mockMessages: Message[] = [
        {
          id: "msg1",
          conversationId: activeConversation.id,
          senderId: activeConversation.participants.find(p => p.isAdmin)?.id || "admin1",
          senderName: activeConversation.participants.find(p => p.isAdmin)?.name || "Admin",
          content: "Hi there! I wanted to let you know that your content has been approved.",
          timestamp: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
          read: true,
        },
        {
          id: "msg2",
          conversationId: activeConversation.id,
          senderId: "user1",
          senderName: user?.fullName || "You",
          content: "That's great news! When will it be published?",
          timestamp: new Date(Date.now() - 33 * 60 * 1000), // 33 minutes ago
          read: true,
        },
        {
          id: "msg3",
          conversationId: activeConversation.id,
          senderId: activeConversation.participants.find(p => p.isAdmin)?.id || "admin1",
          senderName: activeConversation.participants.find(p => p.isAdmin)?.name || "Admin",
          content: "We've scheduled it for tomorrow at 9am EST. Is that time good for you?",
          timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
          read: true,
        },
        {
          id: "msg4",
          conversationId: activeConversation.id,
          senderId: "user1",
          senderName: user?.fullName || "You",
          content: "Yes, that works perfectly. Thank you!",
          timestamp: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
          read: true,
        },
        {
          id: "msg5",
          conversationId: activeConversation.id,
          senderId: activeConversation.participants.find(p => p.isAdmin)?.id || "admin1",
          senderName: activeConversation.participants.find(p => p.isAdmin)?.name || "Admin",
          content: "Your content has been scheduled and will be published tomorrow. We'll send you a notification when it goes live.",
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          read: false,
        },
      ];

      return mockMessages;
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (data: MessageValues) => {
      if (!activeConversation) return;

      // In a real app, we would send the message to the API
      return apiRequest("POST", "/api/messages", {
        conversationId: activeConversation.id,
        content: data.content,
      });
    },
    onSuccess: () => {
      // Clear form
      form.reset();

      // Refetch messages
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation?.id] });
    },
  });

  // Handle form submit
  const onSubmit = (data: MessageValues) => {
    sendMessage.mutate(data);
  };

  // Get notifications query
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: activeTab === "notifications",
    queryFn: async () => {
      // Mocked data for demo
      return [
        {
          id: "notif1",
          title: "Content Approved",
          message: "Your latest photo set has been approved and scheduled for publication.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
          type: "content",
        },
        {
          id: "notif2",
          title: "New Subscription",
          message: "Your subscription has been successfully renewed for the next month.",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          read: true,
          type: "billing",
        },
        {
          id: "notif3",
          title: "Appointment Reminder",
          message: "You have a photo shoot scheduled for tomorrow at 2:00 PM.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          read: true,
          type: "appointment",
        },
      ];
    },
  });

  // Helper function to get avatar letters
  const getAvatarLetters = (name: string) => {
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Messaging</h1>
        <p className="text-gray-400 mt-1">
          Communicate with your management team and service providers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Left Column: Conversations & Notifications */}
        <div className="md:col-span-1">
          <Card className="bg-background-card border-background-lighter h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="px-4 py-3 space-y-2">
              <Tabs defaultValue="chats" onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="chats">Chats</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={activeTab === "chats" ? "Search conversations..." : "Search notifications..."}
                  className="pl-10 bg-background-lighter"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <ScrollArea className="h-full">
                {activeTab === "chats" ? (
                  // Conversations List
                  <div className="space-y-1 p-2">
                    {conversationsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No conversations yet
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-3 rounded-lg cursor-pointer hover:bg-background-lighter transition-colors ${
                            activeConversation?.id === conversation.id
                              ? "bg-background-lighter"
                              : ""
                          }`}
                          onClick={() => setActiveConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-primary text-white">
                                {getAvatarLetters(conversation.title)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-white truncate">
                                  {conversation.title}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {formatDistanceToNow(
                                    conversation.lastMessageTime,
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge
                                variant="default"
                                className="bg-primary text-white ml-2"
                              >
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Notifications List
                  <div className="space-y-1 p-2">
                    {notificationsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg cursor-pointer hover:bg-background-lighter transition-colors ${
                            !notification.read
                              ? "border-l-2 border-primary"
                              : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-full ${
                                notification.type === "content"
                                  ? "bg-blue-500 bg-opacity-20"
                                  : notification.type === "billing"
                                  ? "bg-green-500 bg-opacity-20"
                                  : "bg-yellow-500 bg-opacity-20"
                              }`}
                            >
                              {notification.type === "content" ? (
                                <MessageSquare className="h-4 w-4 text-blue-400" />
                              ) : notification.type === "billing" ? (
                                <Mail className="h-4 w-4 text-green-400" />
                              ) : (
                                <Bell className="h-4 w-4 text-yellow-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`text-sm font-medium ${
                                    !notification.read
                                      ? "text-white"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {formatDistanceToNow(
                                    notification.timestamp,
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Chat Area */}
        <div className="md:col-span-2 lg:col-span-3">
          {activeConversation ? (
            <Card className="bg-background-card border-background-lighter h-[calc(100vh-200px)] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="px-6 py-4 border-b border-background-lighter flex flex-row items-center">
                <div className="flex items-center flex-1">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-white">
                      {getAvatarLetters(activeConversation.title)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{activeConversation.title}</CardTitle>
                    <CardDescription>
                      {activeConversation.participants.length} participants
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.senderId === "user1";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8 mr-2 mt-1">
                              <AvatarImage src={message.senderAvatar || ""} />
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {getAvatarLetters(message.senderName)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[70%] ${
                              isCurrentUser
                                ? "bg-primary text-white"
                                : "bg-background-lighter text-white"
                            } rounded-lg p-3`}
                          >
                            {!isCurrentUser && (
                              <p className="text-xs font-medium mb-1">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isCurrentUser
                                  ? "text-white text-opacity-70"
                                  : "text-gray-400"
                              } text-right`}
                            >
                              {formatDistanceToNow(message.timestamp, {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-background-lighter">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex items-center space-x-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <Paperclip className="h-5 w-5 text-gray-400" />
                    </Button>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Type a message..."
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="rounded-full p-2"
                      disabled={sendMessage.isPending}
                    >
                      {sendMessage.isPending ? (
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </Card>
          ) : (
            <Card className="bg-background-card border-background-lighter h-[calc(100vh-200px)] flex flex-col justify-center items-center">
              <div className="text-center p-6">
                <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-white mb-2">
                  Your Messages
                </h2>
                <p className="text-gray-400 max-w-md">
                  Select a conversation to start messaging with your management team
                  or click the button below to start a new conversation.
                </p>
                <Button className="mt-6">
                  Start New Conversation
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
