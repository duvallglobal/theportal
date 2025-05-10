import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  User,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  UserCog,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

interface UserType {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  plan: string | null;
  verificationStatus: string | null;
  onboardingStatus: string | null;
  onboardingStep: number | null;
  createdAt: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  
  // Fetch users data
  const { data: users = [], isLoading, error } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
  });

  // Handle client actions
  const handleSendWelcomeEmail = async (userId: number, email: string, name: string) => {
    try {
      const response = await fetch('/api/admin/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });
      
      if (response.ok) {
        toast({
          title: 'Welcome email sent',
          description: `Email sent successfully to ${name}`,
        });
      } else {
        toast({
          title: 'Failed to send email',
          description: 'The email service failed to send the welcome email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while sending the welcome email',
        variant: 'destructive',
      });
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by role
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Filter by status
    const matchesStatus = 
      statusFilter === 'all' || 
      user.verificationStatus === statusFilter ||
      (statusFilter === 'incomplete' && user.onboardingStatus === 'incomplete');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'client':
        return <User className="h-4 w-4 text-primary-light" />;
      default:
        return <UserCog className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string | null, onboardingStatus: string | null) => {
    if (status === 'verified') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'rejected') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (onboardingStatus === 'incomplete') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string | null, onboardingStatus: string | null) => {
    if (status === 'verified') {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          Verified
        </Badge>
      );
    } else if (status === 'rejected') {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          Rejected
        </Badge>
      );
    } else if (status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Pending
        </Badge>
      );
    } else if (onboardingStatus === 'incomplete') {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          Onboarding
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage all system users, including admins and clients. Filter by role, status, or search by name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <span className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>Role</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Status</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="incomplete">Incomplete Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-6">
              Error loading users. Please try again.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <User className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground text-center max-w-md mt-1">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Info</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.verificationStatus, user.onboardingStatus)}
                          {getStatusBadge(user.verificationStatus, user.onboardingStatus)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                          {user.role === 'client' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendWelcomeEmail(user.id, user.email, user.fullName)}
                            >
                              Email
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}