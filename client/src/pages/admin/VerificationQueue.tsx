import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Filter, Check, X, CheckCircle, AlertCircle,
  Clock, User, ChevronRight, CheckSquare, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Client {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  onboardingStatus: string | null;
  onboardingStep: number | null;
  verificationStatus: string | null;
}

export default function VerificationQueue() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);

  // Fetch all clients
  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ['/api/admin/users'],
    staleTime: 30000, // 30 seconds
  });

  // Apply filters and search
  const filteredClients = clients.filter((client) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === '' ||
      client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.username.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = client.onboardingStatus === 'completed' && (client.verificationStatus === 'pending' || !client.verificationStatus);
    } else if (statusFilter === 'verified') {
      matchesStatus = client.verificationStatus === 'verified';
    } else if (statusFilter === 'rejected') {
      matchesStatus = client.verificationStatus === 'rejected';
    } else if (statusFilter === 'onboarded') {
      matchesStatus = client.onboardingStatus === 'completed';
    }

    return matchesSearch && matchesStatus && client.role === 'client';
  });

  // Get verification status badge
  const getStatusBadge = (status: string | null, onboardingStatus: string | null) => {
    if (status === 'verified') {
      return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
    } else if (onboardingStatus === 'completed') {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    } else {
      return <Badge variant="outline">Not Started</Badge>;
    }
  };

  // Get verification status icon
  const getStatusIcon = (status: string | null, onboardingStatus: string | null) => {
    if (status === 'verified') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'rejected') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (onboardingStatus === 'completed') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  const handleVerifyClient = (clientId: number) => {
    // In a real implementation this would be an API call
    toast({
      title: 'Verification status updated',
      description: 'Client has been marked as verified.',
    });
    setIsClientDetailOpen(false);
  };

  const handleRejectClient = (clientId: number) => {
    // In a real implementation this would be an API call
    toast({
      title: 'Verification status updated',
      description: 'Client has been marked as rejected.',
    });
    setIsClientDetailOpen(false);
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Verification Queue</h1>
          <p className="text-muted-foreground">
            Review and manage client onboarded accounts
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email or username..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Clients table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <User className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No clients found</h3>
                <p className="text-muted-foreground text-center max-w-md mt-1">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(client)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{client.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.fullName}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>@{client.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(client.verificationStatus, client.onboardingStatus)}
                          {getStatusBadge(client.verificationStatus, client.onboardingStatus)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(client.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client detail dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        {selectedClient && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
              <DialogDescription>
                Review client information and update verification status
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="profile" className="mt-4">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="verification">Verification Status</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {selectedClient.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="text-xl font-semibold">{selectedClient.fullName}</h3>
                        <p className="text-muted-foreground">@{selectedClient.username}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Contact Information</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Email:</dt>
                          <dd className="font-medium">{selectedUser.email}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Phone:</dt>
                          <dd className="font-medium">{selectedUser.phone || 'Not provided'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Account Information</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Registered:</dt>
                          <dd className="font-medium">{formatDate(selectedUser.createdAt)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Onboarding:</dt>
                          <dd className="font-medium">
                            {selectedUser.onboardingStatus === 'completed' ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500">
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Step {selectedUser.onboardingStep || 0} of 5
                              </Badge>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Verification:</dt>
                          <dd className="font-medium">
                            {getStatusBadge(
                              selectedUser.verificationStatus,
                              selectedUser.onboardingStatus
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Onboarding Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {selectedUser.onboardingStatus === 'completed'
                              ? 'Completed'
                              : `Step ${selectedUser.onboardingStep || 0} of 5`}
                          </span>
                          <span className="text-sm font-medium">
                            {selectedUser.onboardingStatus === 'completed' ? '100%' : `${((selectedUser.onboardingStep || 0) / 5) * 100}%`}
                          </span>
                        </div>
                        <div className="w-full bg-muted-foreground/20 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: selectedUser.onboardingStatus === 'completed'
                                ? '100%'
                                : `${((selectedUser.onboardingStep || 0) / 5) * 100}%`,
                            }}
                          ></div>
                        </div>

                        <div className="pt-4 space-y-2">
                          <div className="flex items-center">
                            <CheckSquare className={`h-4 w-4 mr-2 ${selectedUser.onboardingStep && selectedUser.onboardingStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={selectedUser.onboardingStep && selectedUser.onboardingStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}>
                              Account Setup
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CheckSquare className={`h-4 w-4 mr-2 ${selectedUser.onboardingStep && selectedUser.onboardingStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={selectedUser.onboardingStep && selectedUser.onboardingStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}>
                              Personal Information
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CheckSquare className={`h-4 w-4 mr-2 ${selectedUser.onboardingStep && selectedUser.onboardingStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={selectedUser.onboardingStep && selectedUser.onboardingStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}>
                              Platform Connections
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CheckSquare className={`h-4 w-4 mr-2 ${selectedUser.onboardingStep && selectedUser.onboardingStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={selectedUser.onboardingStep && selectedUser.onboardingStep >= 4 ? 'text-foreground' : 'text-muted-foreground'}>
                              Content Strategy
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CheckSquare className={`h-4 w-4 mr-2 ${selectedUser.onboardingStep && selectedUser.onboardingStep >= 5 ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={selectedUser.onboardingStep && selectedUser.onboardingStep >= 5 ? 'text-foreground' : 'text-muted-foreground'}>
                              Billing Setup
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="py-4">
                <div className="flex items-center justify-center bg-muted p-8 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
                    <p className="text-muted-foreground mb-4">
                      No ID verification documents have been uploaded yet.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="verification" className="py-4">
                <div className="flex flex-col space-y-6">
                  <div className="bg-muted p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Verification Status</h3>
                    <div className="flex items-center mb-4">
                      {getStatusIcon(selectedUser.verificationStatus, selectedUser.onboardingStatus)}
                      <span className="ml-2">
                        {selectedUser.verificationStatus === 'verified'
                          ? 'This account is verified'
                          : selectedUser.verificationStatus === 'rejected'
                          ? 'This account has been rejected'
                          : selectedUser.onboardingStatus === 'completed'
                          ? 'Awaiting verification'
                          : 'Onboarding in progress'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {selectedUser.onboardingStatus === 'completed' && (
                        <>
                          <p className="text-muted-foreground">
                            {selectedUser.verificationStatus === 'verified'
                              ? 'This account has been verified and can fully use the platform.'
                              : selectedUser.verificationStatus === 'rejected'
                              ? 'This account has been rejected and may need to submit additional documentation.'
                              : 'This account has completed onboarding but has not been verified yet.'}
                          </p>

                          {!selectedUser.verificationStatus && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                onClick={() => handleVerifyUser(selectedUser.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Verify Account
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRejectUser(selectedUser.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {selectedUser.verificationStatus === 'verified' && (
                            <Button
                              variant="outline"
                              onClick={() => handleRejectUser(selectedUser.id)}
                              className="w-fit"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Revoke Verification
                            </Button>
                          )}

                          {selectedUser.verificationStatus === 'rejected' && (
                            <Button
                              onClick={() => handleVerifyUser(selectedUser.id)}
                              className="bg-green-600 hover:bg-green-700 w-fit"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve Account
                            </Button>
                          )}
                        </>
                      )}

                      {selectedUser.onboardingStatus !== 'completed' && (
                        <p className="text-muted-foreground">
                          This account has not completed onboarding. Verification can only be
                          performed on accounts that have completed onboarding.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Admin Notes</h3>
                    <div className="flex flex-col gap-4">
                      <textarea
                        className="min-h-[100px] p-2 rounded-md border border-input bg-background text-foreground"
                        placeholder="Add notes about this client (only visible to admins)"
                      />
                      <Button variant="outline" className="w-fit">
                        Save Notes
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsUserDetailOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}