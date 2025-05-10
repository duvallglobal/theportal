import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  Send,
  MessageSquare,
  PhoneCall,
  Mail,
  CheckCircle,
  XCircle
} from "lucide-react";

interface AppointmentDetailViewProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function AppointmentDetailView({ 
  appointment, 
  isOpen, 
  onClose 
}: AppointmentDetailViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationMethod, setNotificationMethod] = useState<string>(appointment?.notificationMethod || "in-app");
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      return await apiRequest(
        "PATCH",
        `/api/appointments/${appointment.id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/admin"] });
      toast({
        title: "Status updated",
        description: "Appointment status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { 
      appointmentId: number, 
      method: string, 
      message: string 
    }) => {
      return await apiRequest(
        "POST",
        "/api/appointments/notification",
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/admin"] });
      toast({
        title: "Notification sent",
        description: `Notification sent successfully via ${notificationMethod}`,
      });
      setNotificationMessage("");
      setIsSendingNotification(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending notification",
        description: error.message,
        variant: "destructive",
      });
      setIsSendingNotification(false);
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status });
  };

  const handleSendNotification = () => {
    if (!notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a notification message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingNotification(true);
    sendNotificationMutation.mutate({
      appointmentId: appointment.id,
      method: notificationMethod,
      message: notificationMessage,
    });
  };

  if (!appointment) return null;

  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = format(appointmentDate, "MMMM d, yyyy");
  const formattedTime = format(appointmentDate, "h:mm a");
  const clientHasPhone = appointment.client?.phone && appointment.client.phone.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Appointment Details
            <Badge 
              className={`ml-3 ${statusColors[appointment.status] || 'bg-gray-100'}`}
            >
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review and manage appointment information
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Left column: Appointment Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="text-base">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time</p>
                    <p className="text-base">{formattedTime}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-base">{appointment.duration} minutes</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <div className="flex items-start">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-base">{appointment.location}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <div className="flex items-center">
                    <CreditCard className="mr-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-base">${appointment.amount}</p>
                  </div>
                </div>
                
                {appointment.details && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Details</p>
                    <div className="flex items-start">
                      <FileText className="mr-1 h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-base">{appointment.details}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notification Method</p>
                  <div className="flex items-center">
                    <Bell className="mr-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-base capitalize">{appointment.notificationMethod}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notification Status</p>
                  <div className="flex items-center">
                    {appointment.notificationSent ? (
                      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4 text-red-500" />
                    )}
                    <p className="text-base">
                      {appointment.notificationSent 
                        ? "Notification sent" 
                        : "No notification sent"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created On</p>
                  <p className="text-base">
                    {format(new Date(appointment.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Send Notification
                </CardTitle>
                <CardDescription>
                  Send a custom notification to the client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-method">Notification Method</Label>
                  <Select
                    value={notificationMethod}
                    onValueChange={setNotificationMethod}
                  >
                    <SelectTrigger id="notification-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-app">In-App</SelectItem>
                      <SelectItem value="email" disabled={!appointment.client?.email}>
                        Email {!appointment.client?.email && "(No email available)"}
                      </SelectItem>
                      <SelectItem value="sms" disabled={!clientHasPhone}>
                        SMS {!clientHasPhone && "(No phone number available)"}
                      </SelectItem>
                      <SelectItem value="all" disabled={!clientHasPhone || !appointment.client?.email}>
                        All Methods
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notification-message">Message</Label>
                  <Textarea
                    id="notification-message"
                    placeholder="Type your notification message here..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSendNotification} 
                  disabled={isSendingNotification || !notificationMessage.trim()}
                  className="flex items-center"
                >
                  {isSendingNotification ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right column: Client Info and Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base font-medium">{appointment.client?.fullName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-base">@{appointment.client?.username}</p>
                </div>
                
                {appointment.client?.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <div className="flex items-center">
                      <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{appointment.client?.email}</p>
                    </div>
                  </div>
                )}
                
                {appointment.client?.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <div className="flex items-center">
                      <PhoneCall className="mr-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{appointment.client?.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`/admin/client/${appointment.client?.id}`, '_blank')}
                >
                  <User className="mr-2 h-4 w-4" />
                  View Client Profile
                </Button>
                {appointment.client?.email && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`mailto:${appointment.client?.email}`, '_blank')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                )}
                {appointment.client?.phone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${appointment.client?.phone}`, '_blank')}
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Call Client
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-3">
                  <Button
                    variant={appointment.status === "approved" ? "default" : "outline"}
                    className="justify-start"
                    disabled={appointment.status === "approved"}
                    onClick={() => handleStatusChange("approved")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Approve
                  </Button>
                  
                  <Button
                    variant={appointment.status === "completed" ? "default" : "outline"}
                    className="justify-start"
                    disabled={appointment.status === "completed"}
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                    Mark as Completed
                  </Button>
                  
                  <Button
                    variant={appointment.status === "declined" ? "default" : "outline"}
                    className="justify-start"
                    disabled={appointment.status === "declined"}
                    onClick={() => handleStatusChange("declined")}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Decline
                  </Button>
                  
                  <Button
                    variant={appointment.status === "cancelled" ? "default" : "outline"}
                    className="justify-start"
                    disabled={appointment.status === "cancelled"}
                    onClick={() => handleStatusChange("cancelled")}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}