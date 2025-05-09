import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentProposalCard } from "@/components/client/AppointmentProposalCard";
import { CalendarCheck, CalendarX } from "lucide-react";

export default function Appointments() {
  const { toast } = useToast();

  // Fetch client appointments
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ["/api/appointments/client"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/appointments/client");
        return res.json();
      } catch (error) {
        throw new Error("Failed to fetch appointments");
      }
    },
  });

  // Display error if fetching appointments fails
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load appointments. Please try again later.",
      variant: "destructive",
    });
  }

  // Filter appointments by status
  const pendingAppointments = appointments?.filter((appointment: any) => appointment.status === "pending") || [];
  const approvedAppointments = appointments?.filter((appointment: any) => appointment.status === "approved") || [];
  const otherAppointments = appointments?.filter((appointment: any) => 
    appointment.status !== "pending" && appointment.status !== "approved"
  ) || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          View and manage your appointment proposals.
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingAppointments.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                {pendingAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="archive">Archive</TabsTrigger>
        </TabsList>

        {/* Pending Appointments */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Appointment Proposals</CardTitle>
              <CardDescription>
                These appointments require your response. Please review and either approve or decline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                <div className="space-y-6">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))}
                </div>
              ) : pendingAppointments.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No pending appointments</h3>
                  <p className="text-muted-foreground max-w-md mt-1">
                    You don't have any appointment proposals that need your response at this time.
                  </p>
                </div>
              ) : (
                // Appointment cards
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Appointments */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Appointments</CardTitle>
              <CardDescription>
                These are the appointments you have approved. Make sure to mark your calendar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                <div className="space-y-6">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))}
                </div>
              ) : approvedAppointments.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No approved appointments</h3>
                  <p className="text-muted-foreground max-w-md mt-1">
                    You don't have any approved appointments at this time.
                  </p>
                </div>
              ) : (
                // Appointment cards
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {approvedAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Archived Appointments */}
        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <CardTitle>Archived Appointments</CardTitle>
              <CardDescription>
                View past declined or canceled appointments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                <div className="space-y-6">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))}
                </div>
              ) : otherAppointments.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No archived appointments</h3>
                  <p className="text-muted-foreground max-w-md mt-1">
                    There are no declined or canceled appointments in your archive.
                  </p>
                </div>
              ) : (
                // Appointment cards
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}