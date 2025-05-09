import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Form schema for analytics input
const analyticsFormSchema = z.object({
  totalAppointments: z.coerce.number().int().min(0, {
    message: "Appointments must be a non-negative number",
  }),
  engagementRate: z.coerce.number().min(0).max(100, {
    message: "Engagement rate must be between 0 and 100%",
  }),
  earningsTotal: z.coerce.number().min(0, {
    message: "Earnings must be a non-negative number",
  }),
  followersCount: z.coerce.number().int().min(0, {
    message: "Followers count must be a non-negative number",
  }),
  postsCount: z.coerce.number().int().min(0, {
    message: "Posts count must be a non-negative number",
  }),
  averageLikes: z.coerce.number().min(0, {
    message: "Average likes must be a non-negative number",
  }),
  notes: z.string().optional(),
  customMetrics: z.string().optional(),
});

type AnalyticsFormValues = z.infer<typeof analyticsFormSchema>;

interface AnalyticsInputFormProps {
  userId: number;
  userName: string;
  onSuccess?: () => void;
  existingData?: any;
}

export default function AnalyticsInputForm({
  userId,
  userName,
  onSuccess,
  existingData,
}: AnalyticsInputFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up form with default values
  const form = useForm<AnalyticsFormValues>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: existingData ? {
      totalAppointments: existingData.totalAppointments || 0,
      engagementRate: existingData.engagementRate || 0,
      earningsTotal: existingData.earningsTotal || 0,
      followersCount: existingData.followersCount || 0,
      postsCount: existingData.postsCount || 0,
      averageLikes: existingData.averageLikes || 0,
      notes: existingData.notes || "",
      customMetrics: existingData.customMetrics || "",
    } : {
      totalAppointments: 0,
      engagementRate: 0,
      earningsTotal: 0,
      followersCount: 0,
      postsCount: 0,
      averageLikes: 0,
      notes: "",
      customMetrics: "",
    },
  });

  // Set up mutation for creating or updating analytics
  const mutation = useMutation({
    mutationFn: async (data: AnalyticsFormValues) => {
      if (existingData) {
        // Update existing analytics
        const res = await apiRequest("PUT", `/api/analytics/${existingData.id}`, data);
        return res.json();
      } else {
        // Create new analytics
        const res = await apiRequest("POST", `/api/analytics/${userId}`, data);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Analytics ${existingData ? "updated" : "created"} for ${userName}`,
      });
      
      // Invalidate analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/${userId}`] });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${existingData ? "update" : "create"} analytics: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: AnalyticsFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{existingData ? "Update" : "Create"} Analytics for {userName}</CardTitle>
        <CardDescription>
          Enter the latest analytics data for this client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAppointments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Appointments</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="engagementRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engagement Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="earningsTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Earnings Total ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="followersCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Followers Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="postsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posts Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="averageLikes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Likes</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customMetrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Metrics</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : existingData ? "Update Analytics" : "Create Analytics"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}