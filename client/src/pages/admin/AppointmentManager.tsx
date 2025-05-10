import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentWidget } from "@/components/admin/AppointmentWidget";
import { AppointmentCard } from "@/components/admin/AppointmentCard";
import { Calendar, Plus, SearchIcon, Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function AppointmentManager() {
  const [isAppointmentWidgetOpen, setIsAppointmentWidgetOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/admin"],
    staleTime: 30000, // 30 seconds
  });

  // Filter appointments based on filter and search term
  const filteredAppointments = appointments && Array.isArray(appointments) 
    ? appointments.filter((appointment: any) => {
        // Filter by status
        const matchesStatus =
          filterStatus === "all" || appointment.status === filterStatus;

        // Filter by search term (client name, email, etc.)
        const clientName = appointment.client?.fullName?.toLowerCase() || "";
        const clientEmail = appointment.client?.email?.toLowerCase() || "";
        const clientUsername = appointment.client?.username?.toLowerCase() || "";
        const location = appointment.location?.toLowerCase() || "";
        
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          search === "" ||
          clientName.includes(search) ||
          clientEmail.includes(search) ||
          clientUsername.includes(search) ||
          location.includes(search);

        return matchesStatus && matchesSearch;
      })
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Group appointments by status
  const groupedAppointments = {
    pending: filteredAppointments.filter((a: any) => a.status === "pending"),
    approved: filteredAppointments.filter((a: any) => a.status === "approved"),
    completed: filteredAppointments.filter((a: any) => a.status === "completed"),
    declined: filteredAppointments.filter((a: any) => a.status === "declined"),
    cancelled: filteredAppointments.filter((a: any) => a.status === "cancelled"),
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Appointment Manager</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage appointment proposals for clients
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsAppointmentWidgetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="w-full md:w-2/3 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search by client name, email, location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
        <div className="w-full md:w-1/3">
          <Select
            value={filterStatus}
            onValueChange={(value) => {
              setFilterStatus(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All
            <span className="ml-1 bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              {filteredAppointments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending
            <span className="ml-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
              {groupedAppointments.pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved
            <span className="ml-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
              {groupedAppointments.approved.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            Completed
            <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              {groupedAppointments.completed.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="declined" className="flex items-center gap-2">
            Declined
            <span className="ml-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
              {groupedAppointments.declined.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            Cancelled
            <span className="ml-1 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
              {groupedAppointments.cancelled.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderAppointmentList(
            paginatedAppointments,
            isLoading,
            filteredAppointments.length
          )}
        </TabsContent>
        <TabsContent value="pending">
          {renderAppointmentList(
            groupedAppointments.pending,
            isLoading,
            groupedAppointments.pending.length
          )}
        </TabsContent>
        <TabsContent value="approved">
          {renderAppointmentList(
            groupedAppointments.approved,
            isLoading,
            groupedAppointments.approved.length
          )}
        </TabsContent>
        <TabsContent value="completed">
          {renderAppointmentList(
            groupedAppointments.completed,
            isLoading,
            groupedAppointments.completed.length
          )}
        </TabsContent>
        <TabsContent value="declined">
          {renderAppointmentList(
            groupedAppointments.declined,
            isLoading,
            groupedAppointments.declined.length
          )}
        </TabsContent>
        <TabsContent value="cancelled">
          {renderAppointmentList(
            groupedAppointments.cancelled,
            isLoading,
            groupedAppointments.cancelled.length
          )}
        </TabsContent>
      </Tabs>

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis for gaps
              if (page === 2 && currentPage > 3) {
                return (
                  <PaginationItem key={`ellipsis-start`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              if (page === totalPages - 1 && currentPage < totalPages - 2) {
                return (
                  <PaginationItem key={`ellipsis-end`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              return null;
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AppointmentWidget
        isOpen={isAppointmentWidgetOpen}
        onClose={() => setIsAppointmentWidgetOpen(false)}
      />
    </div>
  );

  function renderAppointmentList(
    appointments: any[],
    isLoading: boolean,
    totalCount: number
  ) {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading appointments...</span>
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No appointments found</CardTitle>
            <CardDescription>
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first appointment by clicking the 'New Appointment' button"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Button onClick={() => setIsAppointmentWidgetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((appointment: any) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            isAdmin={true}
          />
        ))}
      </div>
    );
  }
}