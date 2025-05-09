import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, ChevronDownIcon, Clock, MapPin, MoreVertical, Plus, User } from "lucide-react";
import { AppointmentWidget } from "@/components/admin/AppointmentWidget";

export default function AppointmentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAppointmentWidgetOpen, setIsAppointmentWidgetOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/admin"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/appointments/admin");
      return res.json();
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await apiRequest("PUT", `/api/appointments/${appointmentId}`, {
        status: "canceled",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment canceled",
        description: "The appointment has been canceled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/admin"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter appointments based on selected tab
  const filteredAppointments = appointments?.filter((appointment: any) => {
    if (selectedTab === "all") return true;
    return appointment.status === selectedTab;
  }) || [];

  // Get appointment status badge variant
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointment Management</h1>
          <p className="text-muted-foreground">
            Create and manage appointment proposals for clients.
          </p>
        </div>
        <Button 
          onClick={() => setIsAppointmentWidgetOpen(true)}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
            <TabsTrigger value="canceled">Canceled</TabsTrigger>
          </TabsList>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort By <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Newest First</DropdownMenuItem>
              <DropdownMenuItem>Oldest First</DropdownMenuItem>
              <DropdownMenuItem>Upcoming Appointments</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTab === "all" 
                  ? "All Appointments" 
                  : `${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Appointments`}
              </CardTitle>
              <CardDescription>
                {selectedTab === "pending" && "Appointments waiting for client approval."}
                {selectedTab === "approved" && "Appointments that have been approved by clients."}
                {selectedTab === "declined" && "Appointments that have been declined by clients."}
                {selectedTab === "canceled" && "Appointments that have been canceled."}
                {selectedTab === "all" && "View and manage all appointment proposals."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                // Empty state
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No appointments found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAppointmentWidgetOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Appointment
                  </Button>
                </div>
              ) : (
                // Appointments table
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment: any) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {appointment.photoUrl ? (
                              <img 
                                src={appointment.photoUrl} 
                                alt="Client" 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">Client #{appointment.clientId}</p>
                              <p className="text-xs text-muted-foreground">
                                Created {format(new Date(appointment.createdAt), "PP")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(appointment.appointmentDate), "PPP")}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {appointment.duration} minutes
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{appointment.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>${appointment.amount}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  // View appointment details (implement later)
                                  toast({
                                    title: "View details",
                                    description: `Viewing details for appointment #${appointment.id}`,
                                  });
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              {appointment.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Cancel appointment
                                    if (confirm("Are you sure you want to cancel this appointment?")) {
                                      cancelAppointmentMutation.mutate(appointment.id);
                                    }
                                  }}
                                >
                                  Cancel Appointment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  // Send reminder (implement later)
                                  toast({
                                    title: "Reminder sent",
                                    description: "A reminder has been sent to the client.",
                                  });
                                }}
                              >
                                Send Reminder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appointment Widget Modal */}
      <AppointmentWidget 
        isOpen={isAppointmentWidgetOpen} 
        onClose={() => setIsAppointmentWidgetOpen(false)} 
      />
    </div>
  );
}