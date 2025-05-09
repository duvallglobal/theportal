import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarIcon, Clock, DollarSign, Loader2, MapPin, MessageSquare, User } from "lucide-react";

interface AppointmentProposalCardProps {
  appointment: {
    id: number;
    adminId: number;
    clientId: number;
    appointmentDate: string;
    duration: number;
    location: string;
    details: string | null;
    amount: string | null;
    photoUrl: string | null;
    status: string;
    createdAt: string;
  };
}

export function AppointmentProposalCard({ appointment }: AppointmentProposalCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Format appointment date
  const formattedDate = format(new Date(appointment.appointmentDate), "PPP");
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "success";
      case "declined":
        return "destructive";
      case "canceled":
        return "outline";
      default:
        return "default";
    }
  };

  // Respond to appointment proposal
  const respondMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/appointments/${id}/respond`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response sent",
        description: "Your response to the appointment proposal has been sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/client"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    respondMutation.mutate({ id: appointment.id, status: "approved" });
    setIsDetailsOpen(false);
  };

  const handleDecline = () => {
    respondMutation.mutate({ id: appointment.id, status: "declined" });
    setIsDetailsOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Appointment Proposal</CardTitle>
              <CardDescription>
                {format(new Date(appointment.createdAt), "PP")}
              </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(appointment.status)}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">{appointment.duration} minutes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{appointment.location}</p>
            </div>
          </div>
          
          {appointment.amount && (
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm text-muted-foreground">${appointment.amount}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 pt-4 flex justify-between">
          <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>
            View Details
          </Button>
          
          {appointment.status === "pending" && (
            <div className="space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDecline}
                disabled={respondMutation.isPending}
              >
                Decline
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApprove}
                disabled={respondMutation.isPending}
              >
                {respondMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Approve"
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Appointment Details</DialogTitle>
            <DialogDescription>
              Review all details about this appointment proposal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Photo (if available) */}
            {appointment.photoUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={appointment.photoUrl}
                  alt="Appointment Photo"
                  className="rounded-md max-h-64 object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Date
                  </h3>
                  <p className="text-lg">{formattedDate}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Duration
                  </h3>
                  <p className="text-lg">{appointment.duration} minutes</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </h3>
                  <p className="text-lg">{appointment.location}</p>
                </div>

                {appointment.amount && (
                  <div>
                    <h3 className="text-sm font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Amount
                    </h3>
                    <p className="text-lg">${appointment.amount}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Details about the Encounter
                </h3>
                <div className="mt-2 p-4 bg-muted/30 rounded-md h-[200px] overflow-y-auto">
                  {appointment.details ? (
                    <p className="whitespace-pre-line">{appointment.details}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No additional details provided.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-2" />
                Status
              </h3>
              <div className="mt-2">
                <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-base px-3 py-1">
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            
            {appointment.status === "pending" && (
              <div className="space-x-2">
                <Button
                  variant="destructive"
                  onClick={handleDecline}
                  disabled={respondMutation.isPending}
                >
                  Decline
                </Button>
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={respondMutation.isPending}
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Approve"
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}