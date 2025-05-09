import { useAuth } from "@/hooks/use-auth";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import AnalyticsDisplay from "@/components/client/AnalyticsDisplay";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect unauthenticated users to auth page
    if (!isLoading && !user) {
      setLocation("/auth");
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
    }
  }, [user, isLoading, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>

        {user.role === "admin" ? (
          // Admin view - shows analytics dashboard
          <AnalyticsDashboard />
        ) : (
          // Client view - shows analytics display
          <AnalyticsDisplay className="w-full" />
        )}
      </div>
    </div>
  );
}