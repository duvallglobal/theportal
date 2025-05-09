import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Calendar,
  Clock,
  User,
  XCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { CommunicationHistory, User as UserType } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

// Type for communication history with user data
interface CommunicationHistoryWithUsers extends CommunicationHistory {
  recipient?: Pick<UserType, 'id' | 'username' | 'fullName' | 'email'>;
  sender?: Pick<UserType, 'id' | 'username' | 'fullName' | 'email'>;
}

export default function CommunicationHistoryPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CommunicationHistoryWithUsers | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch users for reference
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch communication history
  const { data: historyRecords = [], isLoading } = useQuery<CommunicationHistory[]>({
    queryKey: ["/api/communication-history", { type: selectedTab !== "all" ? selectedTab : undefined }],
    queryFn: async () => {
      const queryParams = selectedTab !== "all" ? `?type=${selectedTab}` : "";
      const res = await apiRequest("GET", `/api/communication-history${queryParams}`);
      return res.json();
    },
    onError: (error) => {
      console.error("Error loading communication history:", error);
      toast({
        title: "Error",
        description: "Failed to load communication history",
        variant: "destructive"
      });
    }
  });

  // Attach user data to history records
  const enrichedHistoryRecords: CommunicationHistoryWithUsers[] = historyRecords.map(record => {
    const sender = users.find(user => user.id === record.senderId);
    const recipient = users.find(user => user.id === record.recipientId);
    
    return {
      ...record,
      sender: sender ? {
        id: sender.id,
        username: sender.username,
        fullName: sender.fullName,
        email: sender.email
      } : undefined,
      recipient: recipient ? {
        id: recipient.id,
        username: recipient.username,
        fullName: recipient.fullName,
        email: recipient.email
      } : undefined
    };
  });

  // UI handlers
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const handleViewDetails = (record: CommunicationHistoryWithUsers) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  // Filter records based on selected tab and search term
  const filteredRecords = enrichedHistoryRecords.filter(record => {
    const matchesTab = selectedTab === "all" || record.type === selectedTab;
    const matchesSearch = 
      searchTerm === "" || 
      (record.content && record.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.subject && record.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.recipient?.fullName && record.recipient.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.recipient?.email && record.recipient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.sender?.fullName && record.sender.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  // Helper for icon rendering
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "notification":
        return <Bell className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: string) => {
    let variant = "default";
    let icon = null;

    switch (status) {
      case "sent":
        variant = "secondary";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "delivered":
        variant = "success";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "failed":
        variant = "destructive";
        icon = <XCircle className="h-3 w-3 mr-1" />;
        break;
      default:
        variant = "outline";
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
    }

    return (
      <Badge variant={variant as any} className="flex items-center">
        {icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Communication History</h1>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between">
          <Tabs defaultValue="all" className="w-full" value={selectedTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Communications</TabsTrigger>
              <TabsTrigger value="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="notification" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notification
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-1/3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Communication Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">
                  {searchTerm
                    ? "No communication records match your search."
                    : "No communication records found."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead className="w-[80px] text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(record.sentAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {renderTypeIcon(record.type)}
                            <span className="capitalize">{record.type}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(record.status)}
                        </TableCell>
                        <TableCell>
                          {record.recipient ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{record.recipient.fullName}</span>
                              <span className="text-xs text-muted-foreground">{record.recipient.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">User ID: {record.recipientId}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs overflow-hidden">
                            {record.type === "email" && record.subject && (
                              <p className="font-medium text-xs">{record.subject}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {record.content}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(record)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Communication Details</DialogTitle>
            <DialogDescription>
              Full details of the selected communication record.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="flex items-center gap-1">
                    {renderTypeIcon(selectedRecord.type)}
                    <span className="capitalize">{selectedRecord.type}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div>{renderStatusBadge(selectedRecord.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent By</p>
                  <p>
                    {selectedRecord.sender ? (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selectedRecord.sender.fullName}
                      </span>
                    ) : (
                      `User ID: ${selectedRecord.senderId}`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent To</p>
                  <p>
                    {selectedRecord.recipient ? (
                      <span>
                        {selectedRecord.recipient.fullName}
                        <span className="block text-xs text-muted-foreground">
                          {selectedRecord.recipient.email}
                        </span>
                      </span>
                    ) : (
                      `User ID: ${selectedRecord.recipientId}`
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedRecord.sentAt), 'MMMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3" />
                    {format(new Date(selectedRecord.sentAt), 'h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Template ID</p>
                  <p>{selectedRecord.templateId || "None (Custom Message)"}</p>
                </div>
              </div>

              {selectedRecord.subject && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedRecord.subject}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Content</p>
                <div className="mt-1 p-3 border rounded-md bg-muted/30">
                  <ScrollArea className="h-[150px]">
                    <p className="whitespace-pre-wrap">{selectedRecord.content}</p>
                  </ScrollArea>
                </div>
              </div>

              {selectedRecord.status === "failed" && selectedRecord.statusMessage && (
                <div>
                  <p className="text-sm font-medium text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Error Details
                  </p>
                  <p className="text-sm text-muted-foreground bg-destructive/10 p-2 rounded mt-1">
                    {selectedRecord.statusMessage}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}