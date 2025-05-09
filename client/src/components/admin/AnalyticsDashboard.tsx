import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LineChart, BarChart3, Users, RefreshCw } from "lucide-react";
import AnalyticsInputForm from "./AnalyticsInputForm";
import { formatDistanceToNow } from "date-fns";

export default function AnalyticsDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedAnalytics, setSelectedAnalytics] = useState<any>(null);

  // Fetch all analytics data for admin
  const { data: allAnalytics, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/analytics"],
  });

  // Fetch all client users for admin to select from
  const { data: clientUsers, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/users/clients"],
  });

  // Open dialog to add new analytics for a user
  const handleAddAnalytics = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setDialogMode("create");
    setSelectedAnalytics(null);
    setDialogOpen(true);
  };

  // Open dialog to edit existing analytics
  const handleEditAnalytics = (analytics: any, userName: string) => {
    setSelectedUserId(analytics.userId);
    setSelectedUserName(userName);
    setDialogMode("edit");
    setSelectedAnalytics(analytics);
    setDialogOpen(true);
  };

  // Handler for when dialog closes
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
    setSelectedUserName("");
    setSelectedAnalytics(null);
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    refetch();
    handleDialogClose();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-destructive mb-4">Error loading analytics data</div>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clientUsers?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {allAnalytics?.length || 0} with analytics data
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Engagement
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allAnalytics && allAnalytics.length > 0
                    ? (
                        allAnalytics.reduce(
                          (acc: number, curr: any) => acc + curr.engagementRate,
                          0
                        ) / allAnalytics.length
                      ).toFixed(2)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all clients
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {allAnalytics && allAnalytics.length > 0
                    ? allAnalytics
                        .reduce(
                          (acc: number, curr: any) => acc + curr.earningsTotal,
                          0
                        )
                        .toLocaleString()
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined from all clients
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Analytics Updates</CardTitle>
              <CardDescription>
                Most recent analytics entries for each client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAnalytics && allAnalytics.length > 0 ? (
                    allAnalytics.map((analytics: any) => (
                      <TableRow key={analytics.id}>
                        <TableCell className="font-medium">
                          {analytics.userName || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(analytics.reportDate), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>{analytics.engagementRate.toFixed(2)}%</TableCell>
                        <TableCell>${analytics.earningsTotal.toLocaleString()}</TableCell>
                        <TableCell>{analytics.followersCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleEditAnalytics(analytics, analytics.userName)
                            }
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No analytics data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Analytics Management</CardTitle>
              <CardDescription>
                Add or update analytics for your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Has Analytics</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientUsers && clientUsers.length > 0 ? (
                    clientUsers.map((client: any) => {
                      // Find if client has analytics
                      const hasAnalytics = allAnalytics?.some(
                        (a: any) => a.userId === client.id
                      );

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.fullName}
                          </TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>
                            {hasAnalytics ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-amber-600">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleAddAnalytics(client.id, client.fullName)
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {hasAnalytics ? "Update" : "Add Analytics"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {isLoadingClients
                          ? "Loading clients..."
                          : "No clients found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Adding/Editing Analytics */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? "Add Analytics for Client"
                : "Edit Analytics"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Enter analytics data for this client"
                : "Update the analytics data for this client"}
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <AnalyticsInputForm
              userId={selectedUserId}
              userName={selectedUserName}
              onSuccess={handleFormSuccess}
              existingData={selectedAnalytics}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}