import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppointmentProposalCardProps {
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
    admin?: {
      id: number;
      fullName: string;
      username: string;
    };
  };
}

export function AppointmentProposalCard({ appointment }: AppointmentProposalCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  // Format appointment date
  const formattedDate = format(new Date(appointment.appointmentDate), "PPPP 'at' h:mm a");

  // Get status badge color and text
  const getStatusBadge = () => {
    let color = "";
    let text = "";
    
    switch (appointment.status) {
      case "pending":
        color = "bg-yellow-500 text-white";
        text = "Pending Response";
        break;
      case "approved":
        color = "bg-green-500 text-white";
        text = "Approved";
        break;
      case "declined":
        color = "bg-red-500 text-white";
        text = "Declined";
        break;
      case "completed":
        color = "bg-blue-500 text-white";
        text = "Completed";
        break;
      case "cancelled":
        color = "bg-gray-500 text-white";
        text = "Cancelled";
        break;
      default:
        color = "bg-gray-300";
        text = appointment.status;
    }
    
    return <Badge className={color}>{text}</Badge>;
  };
  
  // Response mutations
  const approveAppointmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/appointments/${appointment.id}/respond`, {
        status: "approved"
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment approved",
        description: "You have successfully approved this appointment.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/client"] });
      setShowApproveDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to approve appointment: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const declineAppointmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/appointments/${appointment.id}/respond`, {
        status: "declined"
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment declined",
        description: "You have declined this appointment proposal.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/client"] });
      setShowDeclineDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to decline appointment: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Appointment Proposal</CardTitle>
              <CardDescription>
                {appointment.admin?.fullName ? `From ${appointment.admin.fullName}` : "From Admin"}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{appointment.duration} minutes</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{appointment.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold">${appointment.amount}</span>
            </div>
          </div>
          
          {appointment.photoUrl && (
            <div className="mt-4 h-36 w-full overflow-hidden rounded-md">
              <img
                src={appointment.photoUrl}
                alt="Appointment Photo"
                className="object-cover w-full h-full"
              />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowDetails(true)}>
            View Details
          </Button>
          
          {appointment.status === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowDeclineDialog(true)}
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>
              
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowApproveDialog(true)}
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Proposed for {formattedDate}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Duration</h3>
                <p>{appointment.duration} minutes</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Amount</h3>
                <p>${appointment.amount}</p>
              </div>
              
              <div className="col-span-2">
                <h3 className="text-sm font-semibold mb-1">Location</h3>
                <p>{appointment.location}</p>
              </div>
              
              <div className="col-span-2">
                <h3 className="text-sm font-semibold mb-1">Status</h3>
                <p>{getStatusBadge()}</p>
              </div>
            </div>
            
            {appointment.details && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Details</h3>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{appointment.details}</p>
                </div>
              </div>
            )}
            
            {appointment.photoUrl && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Photo</h3>
                <div className="w-full overflow-hidden rounded-md">
                  <img
                    src={appointment.photoUrl}
                    alt="Appointment Photo"
                    className="object-cover w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-end gap-2 mt-4">
            {appointment.status === "pending" && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setShowDetails(false);
                    setShowDeclineDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    setShowDetails(false);
                    setShowApproveDialog(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
            
            {appointment.status !== "pending" && (
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this appointment proposal?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Confirmation</AlertTitle>
              <AlertDescription>
                By approving this appointment, you are committing to the time, date, and location specified.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={approveAppointmentMutation.isPending}
            >
              Cancel
            </Button>
            
            <Button
              variant="default"
              onClick={() => approveAppointmentMutation.mutate()}
              disabled={approveAppointmentMutation.isPending}
            >
              {approveAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this appointment proposal?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Declining this appointment proposal cannot be undone. The admin will be notified of your decision.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline" 
              onClick={() => setShowDeclineDialog(false)}
              disabled={declineAppointmentMutation.isPending}
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => declineAppointmentMutation.mutate()}
              disabled={declineAppointmentMutation.isPending}
            >
              {declineAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}