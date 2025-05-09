import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, UsersRound, FileText, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserType } from "@shared/schema";
import { Link } from "wouter";

export default function AdminDashboard() {
  // Fetch users
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Fetch pending verifications
  const {
    data: pendingVerifications = [],
    isLoading: verificationsLoading,
  } = useQuery<any[]>({
    queryKey: ["/api/verifications/pending"],
  });

  // Fetch pending content
  const {
    data: pendingContent = [],
    isLoading: contentLoading,
  } = useQuery<any[]>({
    queryKey: ["/api/content/pending"],
  });

  // Summary metrics
  const totalUsers = users.length;
  const onboardingIncomplete = users.filter(user => user.onboardingStatus === "incomplete").length;
  const pendingVerificationsCount = pendingVerifications.length;
  const pendingContentCount = pendingContent.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <UsersRound className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{totalUsers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incomplete Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <User className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{onboardingIncomplete}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Verifications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{pendingVerificationsCount}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Content
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-2xl font-bold">{pendingContentCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="content">Content Approval</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="p-0 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage all users, view their details, and update their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)]">
                {usersLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : usersError ? (
                  <div className="text-center text-red-500 py-6">
                    Error loading users. Please try again.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Onboarding</th>
                          <th className="text-left p-2">Verification</th>
                          <th className="text-left p-2">Plan</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted">
                            <td className="p-2">{user.id}</td>
                            <td className="p-2">{user.fullName}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">
                              <Badge
                                variant={user.onboardingStatus === "complete" ? "outline" : "secondary"}
                              >
                                {user.onboardingStatus}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  user.verificationStatus === "verified" 
                                    ? "default" 
                                    : user.verificationStatus === "rejected" 
                                      ? "destructive" 
                                      : "outline"
                                }
                              >
                                {user.verificationStatus}
                              </Badge>
                            </td>
                            <td className="p-2">{user.plan || "None"}</td>
                            <td className="p-2">
                              <Link href={`/admin/users/${user.id}`}>
                                <Button variant="outline" size="sm">
                                  Manage
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="verifications" className="p-0 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>
                Review and approve ID verification documents from users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)]">
                {verificationsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : pendingVerifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No pending verifications
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingVerifications.map((verification) => (
                      <Card key={verification.id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {verification.userId} - {verification.documentType}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                            Document Preview
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              Reject
                            </Button>
                            <Button size="sm" className="flex-1">
                              Approve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="p-0 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Approval</CardTitle>
              <CardDescription>
                Review and approve content uploaded by creators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)]">
                {contentLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : pendingContent.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No pending content for approval
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingContent.map((content) => (
                      <Card key={content.id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {content.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                            Content Preview
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              Reject
                            </Button>
                            <Button size="sm" className="flex-1">
                              Approve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}