import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus, Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react';
import { AddClientForm } from '@/components/admin/AddClientForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { sendWelcomeEmail } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Define user data type based on shared schema
interface User {
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

export default function ClientsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  
  // Fetch clients data
  const { data: clients, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      return data.filter((user: User) => user.role === 'client');
    }
  });

  // Handle client actions
  const handleSendWelcomeEmail = async (clientId: number, email: string, name: string) => {
    try {
      const success = await sendWelcomeEmail(email, name);
      if (success) {
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

  // Filter clients based on search and filters
  const filteredClients = clients?.filter(client => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && client.verificationStatus === 'pending') ||
      (statusFilter === 'verified' && client.verificationStatus === 'verified') ||
      (statusFilter === 'incomplete' && client.onboardingStatus === 'incomplete');
    
    // Platform filter would be implemented if we had platform data in the User
    // For now, return true for all platform filters
    const matchesPlatform = true;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };
  
  // Get verification status badge
  const getVerificationBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'verified':
        return <Badge variant="success">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get onboarding status badge
  const getOnboardingBadge = (status: string | null, step: number | null) => {
    if (!status) return <Badge variant="outline">Not Started</Badge>;
    
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary">Step {step || 0}/8</Badge>;
      case 'complete':
        return <Badge variant="success">Complete</Badge>;
      case 'incomplete':
        return <Badge variant="warning">Incomplete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get subscription plan badge
  const getPlanBadge = (plan: string | null) => {
    if (!plan) return <Badge variant="outline">No Plan</Badge>;
    
    switch (plan) {
      case 'basic':
        return <Badge>Basic</Badge>;
      case 'pro':
        return <Badge variant="secondary">Pro</Badge>;
      case 'premium':
        return <Badge variant="success">Premium</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <AddClientForm onSuccess={refetch} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            Manage and view all client accounts. Filter by verification status or search by name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
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
                  <SelectItem value="pending">Pending Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="incomplete">Incomplete Onboarding</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={platformFilter}
                onValueChange={setPlatformFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Platform</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="onlyfans">OnlyFans</SelectItem>
                  <SelectItem value="rentmen">Rent.Men</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error loading clients. Please try again.
            </div>
          ) : filteredClients?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your criteria.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.fullName}</TableCell>
                      <TableCell>{client.username}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{getPlanBadge(client.plan)}</TableCell>
                      <TableCell>{getVerificationBadge(client.verificationStatus)}</TableCell>
                      <TableCell>{getOnboardingBadge(client.onboardingStatus, client.onboardingStep)}</TableCell>
                      <TableCell>{formatDate(client.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/admin/clients/${client.id}`}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendWelcomeEmail(client.id, client.email, client.fullName)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Send Welcome Email
                            </DropdownMenuItem>
                            {client.phone && (
                              <DropdownMenuItem>
                                <Phone className="mr-2 h-4 w-4" />
                                Send SMS
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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