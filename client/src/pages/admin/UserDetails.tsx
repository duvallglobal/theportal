import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserCog, FileBadge, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Profile, PlatformAccount } from "@shared/schema";

export default function UserDetails() {
  const [, params] = useRoute("/admin/clients/:id");
  const userId = params?.id ? parseInt(params.id) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user data
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery<User>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user profile
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery<Profile>({
    queryKey: [`/api/profiles/user/${userId}`],
    enabled: !!userId,
  });

  // Fetch platform accounts
  const {
    data: platformAccounts,
    isLoading: accountsLoading,
  } = useQuery<PlatformAccount[]>({
    queryKey: [`/api/platform-accounts/user/${userId}`],
    enabled: !!userId,
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "User updated",
        description: "User details have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form state for verification
  const [verificationStatus, setVerificationStatus] = useState<string>("");

  // Update verification status when user data loads
  useEffect(() => {
    if (user) {
      setVerificationStatus(user.verificationStatus || "pending");
    }
  }, [user]);

  // Handle verification status update
  const handleVerificationUpdate = async () => {
    if (!user) return;
    
    try {
      await updateUserMutation.mutateAsync({
        verificationStatus,
      });
    } catch (error) {
      console.error("Failed to update verification status:", error);
    }
  };

  if (userLoading || profileLoading || accountsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>
        <div className="text-center text-red-500 py-6 border rounded-lg">
          Error loading user data. User might not exist.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        <Badge 
          variant={
            user.role === "admin" 
              ? "default" 
              : "secondary"
          }
          className="text-sm px-3 py-1"
        >
          {user.role}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              User Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-semibold">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <div className="font-medium">{user.fullName}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="font-medium">{user.email}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Username</Label>
                <div className="font-medium">{user.username}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <div className="font-medium">{user.phone || "Not provided"}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Member Since</Label>
                <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                Manage verification status and subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Onboarding Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={user.onboardingStatus === "complete" ? "default" : "secondary"}
                    >
                      {user.onboardingStatus || "incomplete"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Step {user.onboardingStep || 1}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Verification Status</Label>
                  <div className="flex flex-col gap-2">
                    <Select 
                      value={verificationStatus} 
                      onValueChange={setVerificationStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleVerificationUpdate}
                      disabled={verificationStatus === user.verificationStatus}
                      size="sm"
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.plan || "None"}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Stripe Customer ID</Label>
                  <div className="text-sm text-muted-foreground">
                    {user.stripeCustomerId || "Not linked"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile Details</TabsTrigger>
              <TabsTrigger value="platform-accounts" className="flex-1">Platform Accounts</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    User profile preferences and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!profile ? (
                    <div className="text-center text-muted-foreground py-4">
                      No profile information available
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Preferred Contact Method</Label>
                        <div className="font-medium">{profile.preferredContactMethod || "Not set"}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Check-in Time</Label>
                        <div className="font-medium">{profile.preferredCheckInTime || "Not set"}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <div className="font-medium">{profile.timezone || "Not set"}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Upload Frequency</Label>
                        <div className="font-medium">{profile.uploadFrequency || "Not set"}</div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Brand Description</Label>
                        <div className="bg-muted p-3 rounded-md">
                          {profile.brandDescription || "No brand description provided"}
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Voice Tone</Label>
                        <div className="font-medium">{profile.voiceTone || "Not specified"}</div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Do Not Say Terms</Label>
                        <div className="bg-muted p-3 rounded-md">
                          {profile.doNotSayTerms || "None specified"}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platform-accounts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Accounts</CardTitle>
                  <CardDescription>
                    Connected social media and platform accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!platformAccounts || platformAccounts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No platform accounts connected
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {platformAccounts.map((account) => (
                        <div key={account.id} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{account.platformType}</h3>
                            <Badge variant={account.needsCreation ? "secondary" : "outline"}>
                              {account.needsCreation ? "Needs Creation" : "Connected"}
                            </Badge>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Username</Label>
                              <div className="font-medium">{account.username || "Not provided"}</div>
                            </div>
                            <div className="space-y-2">
                              <Label>Added on</Label>
                              <div className="font-medium">{new Date(account.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Documents</CardTitle>
                  <CardDescription>
                    Identity documents uploaded by the user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-4">
                    No verification documents available
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}