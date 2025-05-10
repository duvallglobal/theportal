import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { MapPin, Clock, DollarSign, Clipboard, Check, AlertCircle, Calendar, Phone, Mail, MessageSquare, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppointmentCardProps {
  appointment: {
    id: number;
    adminId: number;
    clientId: number;
    appointmentDate: string;
    duration: number;
    location: string;
    details?: string;
    amount: string;
    photoUrl?: string;
    status: "pending" | "approved" | "declined" | "completed" | "cancelled";
    notificationMethod: "email" | "sms" | "in-app" | "all";
    notificationSent: boolean;
    createdAt: string;
    client?: {
      id: number;
      fullName: string;
      username: string;
      email: string;
      phone?: string;
    };
  };
  isAdmin?: boolean;
}

export function AppointmentCard({ appointment, isAdmin = true }: AppointmentCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  
  // Format appointment date
  const formattedDate = format(new Date(appointment.appointmentDate), "PPPP 'at' h:mm a");
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "declined": return "bg-red-500";
      case "completed": return "bg-blue-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-300";
    }
  };
  
  // Format notification method
  const formatNotificationMethod = (method: string) => {
    switch (method) {
      case "email": return "Email";
      case "sms": return "SMS";
      case "in-app": return "In-App";
      case "all": return "All Methods";
      default: return method;
    }
  };
  
  // Cancel appointment
  const cancelAppointmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/appointments/${appointment.id}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/admin"] });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to cancel appointment: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Resend notification
  const resendNotificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/appointments/${appointment.id}/resend-notification`, {
        notificationMethod: appointment.notificationMethod
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification sent",
        description: "The appointment notification has been resent.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/admin"] });
      setShowResendDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to resend notification: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{appointment.client?.fullName || `Client #${appointment.clientId}`}</CardTitle>
              <CardDescription>{appointment.client?.username}</CardDescription>
            </div>
            <Badge 
              className={`${getStatusColor(appointment.status)} text-white`}
            >
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.duration} minutes</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${appointment.amount}</span>
            </div>
            
            {appointment.notificationSent && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>Notified via {formatNotificationMethod(appointment.notificationMethod)}</span>
              </div>
            )}
          </div>
          
          {appointment.client && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium flex items-center mb-2">
                <Users className="h-4 w-4 mr-2" />
                Contact Info
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.client.email}</span>
                </div>
                
                {appointment.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0">
          <Button variant="outline" onClick={() => setShowDetails(true)}>
            View Details
          </Button>
          
          <div className="flex gap-2">
            {isAdmin && appointment.status === "pending" && (
              <Button 
                variant="outline" 
                onClick={() => setShowResendDialog(true)}
              >
                Resend
              </Button>
            )}
            
            {isAdmin && ["pending", "approved"].includes(appointment.status) && (
              <Button 
                variant="destructive" 
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this appointment
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Appointment Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {appointment.duration} minutes</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Location: {appointment.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Amount: ${appointment.amount}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Status: {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Notification: {formatNotificationMethod(appointment.notificationMethod)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {format(new Date(appointment.createdAt), "PPP")}</span>
                </div>
              </div>
              
              {appointment.details && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap">{appointment.details}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              {appointment.photoUrl && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Photo</h3>
                  <div className="rounded-md overflow-hidden">
                    <img 
                      src={appointment.photoUrl} 
                      alt="Appointment photo" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
              
              {appointment.client && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Client Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Name: {appointment.client.fullName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Username: {appointment.client.username}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>Email: {appointment.client.email}</span>
                    </div>
                    
                    {appointment.client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>Phone: {appointment.client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-end gap-2 mt-4">
            {isAdmin && ["pending", "approved"].includes(appointment.status) && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowDetails(false);
                  setShowCancelDialog(true);
                }}
              >
                Cancel Appointment
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Cancelling will notify the client and update the appointment status.
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="flex justify-end gap-2 mt-8">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelAppointmentMutation.isPending}
            >
              No, Keep It
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={() => cancelAppointmentMutation.mutate()}
              disabled={cancelAppointmentMutation.isPending}
            >
              {cancelAppointmentMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel It"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Resend Notification Dialog */}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Notification</DialogTitle>
            <DialogDescription>
              This will resend the appointment notification to the client using their preferred method.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <p>Current notification method: {formatNotificationMethod(appointment.notificationMethod)}</p>
          </div>
          
          <DialogFooter className="flex justify-end gap-2 mt-8">
            <Button 
              variant="outline" 
              onClick={() => setShowResendDialog(false)}
              disabled={resendNotificationMutation.isPending}
            >
              Cancel
            </Button>
            
            <Button 
              variant="default" 
              onClick={() => resendNotificationMutation.mutate()}
              disabled={resendNotificationMutation.isPending}
            >
              {resendNotificationMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                "Resend Notification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}