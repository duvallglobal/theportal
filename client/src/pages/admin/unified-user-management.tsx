import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, UserPlus, Search, Filter, Check, X } from "lucide-react";
import AddClientForm from "@/components/admin/add-client-form";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  onboardingStatus: string | null;
  verificationStatus: string | null;
  plan: string | null;
  createdAt: Date;
}

export default function UnifiedUserManagement() {
  const { toast } = useToast();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<string | null>(null);
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/admin/users", { signal });
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      return response.json();
    },
  });
  
  const filteredUsers = users?.filter((user: User) => {
    // Filter by role if selected
    if (filterRole && user.role !== filterRole) return false;
    
    // Filter by verification status if selected
    if (verificationFilter && user.verificationStatus !== verificationFilter) return false;
    
    // Filter by search term (case-insensitive search in username, email, and full name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.fullName.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
  
  const countByRole = {
    admin: users?.filter((user: User) => user.role === "admin").length || 0,
    client: users?.filter((user: User) => user.role === "client").length || 0,
    total: users?.length || 0,
  };
  
  const pendingVerifications = users?.filter(
    (user: User) => user.verificationStatus === "pending"
  ).length || 0;
  
  const changeVerificationStatus = async (userId: number, status: string) => {
    try {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/verification`, { status });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update verification status");
      }
      
      // Invalidate users query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      
      toast({
        title: "Success",
        description: `User verification status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <h3 className="font-semibold text-lg">Error Loading Data</h3>
              <p className="text-sm">{(error as Error).message}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users in one place - both clients and administrators
          </p>
        </div>
        
        <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <AddClientForm onSuccess={() => {
              setIsAddClientModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
              toast({
                title: "Success",
                description: "New client added successfully",
              });
            }} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{countByRole.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Clients</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{countByRole.client}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{pendingVerifications}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or username"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterRole || ""} onValueChange={(value) => setFilterRole(value || null)}>
                  <SelectTrigger className="w-[150px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Role: {filterRole || "All"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={verificationFilter || ""} onValueChange={(value) => setVerificationFilter(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Verification: {verificationFilter || "All"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-4 bg-muted/50">
                <div className="col-span-4 font-medium">User</div>
                <div className="col-span-2 font-medium">Role</div>
                <div className="col-span-2 font-medium">Verification</div>
                <div className="col-span-2 font-medium">Status</div>
                <div className="col-span-2 font-medium text-right">Actions</div>
              </div>
              <Separator />
              
              {filteredUsers?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No users found matching your filters
                </div>
              ) : (
                filteredUsers?.map((user: User) => (
                  <div key={user.id}>
                    <div className="grid grid-cols-12 gap-2 p-4 items-center">
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email} ({user.username})
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role === "admin" ? "Admin" : "Client"}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge 
                          variant={
                            user.verificationStatus === "verified"
                              ? "success"
                              : user.verificationStatus === "rejected"
                              ? "destructive" 
                              : "outline"
                          }
                        >
                          {user.verificationStatus || "N/A"}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge variant="outline">
                          {user.onboardingStatus === "complete" ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2 flex justify-end gap-2">
                        {user.verificationStatus === "pending" && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => changeVerificationStatus(user.id, "verified")}
                              title="Approve Verification"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => changeVerificationStatus(user.id, "rejected")}
                              title="Reject Verification"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          asChild
                        >
                          <a href={`/admin/users/${user.id}`}>View Details</a>
                        </Button>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}