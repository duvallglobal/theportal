import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, FileCheck, Calendar, MessageSquare, CreditCard, TrendingUp, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStat {
  label: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
}

export default function DashboardStatistics() {
  const [timeRange, setTimeRange] = useState<string>("last7Days");
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/statistics', timeRange],
    queryFn: async ({ signal }) => {
      try {
        const response = await apiRequest('GET', `/api/admin/statistics?timeRange=${timeRange}`, undefined, { signal });
        return await response.json();
      } catch (error) {
        console.error('Error fetching statistics:', error);
        throw error;
      }
    },
  });
  
  const getTimeRangeText = (range: string): string => {
    switch (range) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7Days': return 'Last 7 Days';
      case 'last30Days': return 'Last 30 Days';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      default: return 'Last 7 Days';
    }
  };
  
  const dashboardStats: DashboardStat[] = stats ? [
    {
      label: "Active Clients",
      value: stats.activeClients,
      change: stats.activeClientsChange,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Verified Clients",
      value: stats.verifiedClients,
      change: stats.verifiedClientsChange,
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Appointments",
      value: stats.appointments,
      change: stats.appointmentsChange,
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Unread Messages",
      value: stats.unreadMessages,
      change: stats.unreadMessagesChange,
      icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      change: stats.revenueChange,
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Media Content",
      value: stats.mediaContent,
      change: stats.mediaContentChange,
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
    },
  ] : [];
  
  // Fallback data for initial render or when the API fails
  const fallbackStats: DashboardStat[] = [
    {
      label: "Active Clients",
      value: "—",
      change: 0,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Verified Clients",
      value: "—",
      change: 0,
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Appointments",
      value: "—",
      change: 0,
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Unread Messages",
      value: "—",
      change: 0,
      icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Revenue",
      value: "—",
      change: 0,
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Media Content",
      value: "—",
      change: 0,
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
    },
  ];
  
  const displayStats = isLoading || !stats ? fallbackStats : dashboardStats;
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Statistics</h1>
          <p className="text-muted-foreground">
            Overview of platform performance statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={getTimeRangeText(timeRange)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7Days">Last 7 Days</SelectItem>
              <SelectItem value="last30Days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {displayStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-7 w-20 my-1" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {stat.value}
                    </div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-16 mt-1" />
                  ) : (
                    <p className={`text-xs ${stat.change > 0 ? "text-green-500" : stat.change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {stat.change > 0 ? "+" : ""}{stat.change}% from previous period
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent platform activity and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="mx-auto h-8 w-8 opacity-50 mb-2" />
                      <h3 className="text-sm font-medium">Recent Activity Data</h3>
                      <p className="text-xs">
                        This will display recent user activity, logins, and content uploads
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Platform health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="mx-auto h-8 w-8 opacity-50 mb-2" />
                      <h3 className="text-sm font-medium">System Status Data</h3>
                      <p className="text-xs">
                        This will display system health metrics, uptime, and performance
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-4">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium mb-2">Client Analytics Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Detailed client acquisition, retention, and engagement analytics will be available in this tab.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium mb-2">Content Analytics Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Detailed content performance, engagement, and approval metrics will be available in this tab.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="finances" className="space-y-4">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium mb-2">Financial Analytics Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Detailed revenue, subscription, and billing metrics will be available in this tab.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}