import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AppointmentProposalCard } from "@/components/client/AppointmentProposalCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Appointments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch appointments for the client
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/client"],
    staleTime: 60000, // 1 minute
  });

  // Filter and sort appointments
  const filteredAppointments = appointments && Array.isArray(appointments)
    ? appointments.filter((appointment: any) => {
        // Filter by status
        const statusMatch =
          statusFilter === "all" || appointment.status === statusFilter;

        // Filter by search term
        const location = appointment.location?.toLowerCase() || "";
        const details = appointment.details?.toLowerCase() || "";
        const searchLower = searchTerm.toLowerCase();
        const searchMatch =
          searchTerm === "" ||
          location.includes(searchLower) ||
          details.includes(searchLower);

        return statusMatch && searchMatch;
      })
    : [];

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a: any, b: any) => {
    const dateA = new Date(a.appointmentDate);
    const dateB = new Date(b.appointmentDate);

    if (sortOrder === "newest") {
      return dateB.getTime() - dateA.getTime();
    } else if (sortOrder === "oldest") {
      return dateA.getTime() - dateB.getTime();
    } else if (sortOrder === "upcoming") {
      const now = new Date();
      const diffA = Math.abs(dateA.getTime() - now.getTime());
      const diffB = Math.abs(dateB.getTime() - now.getTime());
      // Sort by absolute difference from current time, with future dates first
      if (dateA > now && dateB > now) {
        return diffA - diffB;
      } else if (dateA > now) {
        return -1;
      } else if (dateB > now) {
        return 1;
      }
      return diffA - diffB;
    }
    return 0;
  });

  // Group appointments by status
  const pendingAppointments = sortedAppointments.filter(
    (a: any) => a.status === "pending"
  );
  const approvedAppointments = sortedAppointments.filter(
    (a: any) => a.status === "approved"
  );
  const pastAppointments = sortedAppointments.filter(
    (a: any) =>
      a.status === "completed" ||
      a.status === "declined" ||
      a.status === "cancelled"
  );

  return (
    <>
      <Helmet>
        <title>Appointments | ManageTheFans Portal</title>
        <meta
          name="description"
          content="View and manage your appointment proposals and bookings in the ManageTheFans Portal."
        />
      </Helmet>

      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">
              View and respond to your appointment proposals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-7 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by location or details..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="upcoming">Upcoming First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading appointments...</span>
          </div>
        ) : sortedAppointments.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No appointments found</CardTitle>
              <CardDescription>
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You don't have any appointments yet. When your admin proposes an appointment, it will appear here."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Your appointment proposals will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                <span className="ml-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                  {pendingAppointments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                Approved
                <span className="ml-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                  {approvedAppointments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                Past
                <span className="ml-1 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                  {pastAppointments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                <span className="ml-1 bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                  {sortedAppointments.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No pending appointments</AlertTitle>
                  <AlertDescription>
                    You don't have any appointments waiting for your response.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No approved appointments</AlertTitle>
                  <AlertDescription>
                    You don't have any upcoming approved appointments.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No past appointments</AlertTitle>
                  <AlertDescription>
                    You don't have any past, declined, or cancelled appointments.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="all">
              {sortedAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedAppointments.map((appointment: any) => (
                    <AppointmentProposalCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No appointments found</AlertTitle>
                  <AlertDescription>
                    Try adjusting your search or filter criteria.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}