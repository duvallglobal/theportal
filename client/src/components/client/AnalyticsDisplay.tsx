import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Bar, Line } from "recharts";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
} from "recharts";

interface AnalyticsDisplayProps {
  className?: string;
}

export default function AnalyticsDisplay({ className }: AnalyticsDisplayProps) {
  const { user } = useAuth();
  const [activeMetric, setActiveMetric] = useState("engagement");

  // Fetch user's analytics
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Loading your performance data...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analyticsData || analyticsData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Track your performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center text-center">
          <div>
            <p className="text-muted-foreground">
              No analytics data available yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your admin will update your metrics soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process the analytics data for charts
  const processedData = analyticsData.map((entry: any) => ({
    ...entry,
    date: new Date(entry.reportDate).toLocaleDateString(),
  })).sort((a: any, b: any) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

  // Get the most recent analytics entry
  const latestAnalytics = processedData[processedData.length - 1];
  
  // Format the date for display
  const lastUpdated = formatDistanceToNow(new Date(latestAnalytics.reportDate), { addSuffix: true });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your Performance Analytics</CardTitle>
        <CardDescription>
          Track your metrics and performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">
                {latestAnalytics.engagementRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {(processedData.reduce((acc: number, curr: any) => acc + curr.engagementRate, 0) / processedData.length).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">
                ${latestAnalytics.earningsTotal.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${processedData[0].earningsTotal.toLocaleString()} → ${latestAnalytics.earningsTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Followers</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">
                {latestAnalytics.followersCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Growth: {(latestAnalytics.followersCount - processedData[0].followersCount).toLocaleString()} followers
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="engagement" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="engagement" onClick={() => setActiveMetric("engagement")}>
              Engagement
            </TabsTrigger>
            <TabsTrigger value="earnings" onClick={() => setActiveMetric("earnings")}>
              Earnings
            </TabsTrigger>
            <TabsTrigger value="followers" onClick={() => setActiveMetric("followers")}>
              Followers
            </TabsTrigger>
            <TabsTrigger value="posts" onClick={() => setActiveMetric("posts")}>
              Content
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="engagement" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Engagement Rate']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="engagementRate"
                  name="Engagement Rate (%)"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="earnings" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value}`, 'Earnings']} />
                <Legend />
                <Bar
                  dataKey="earningsTotal"
                  name="Earnings ($)"
                  fill="#8884d8"
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="followers" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()}`, 'Followers']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="followersCount"
                  name="Followers"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="posts" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="postsCount"
                  name="Posts Count"
                  fill="#8884d8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageLikes"
                  name="Avg. Likes"
                  stroke="#ff7300"
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
        
        {latestAnalytics.notes && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-1">Notes from Admin:</h4>
            <p className="text-sm">{latestAnalytics.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Last updated {lastUpdated}
      </CardFooter>
    </Card>
  );
}