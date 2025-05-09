import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, CreditCard, CheckCircle2, AlertTriangle,
  Clock, User, ChevronRight, Download, 
  BarChart4, DollarSign, RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
} from '@/components/ui/dialog';

interface Subscription {
  id: number;
  userId: number;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  nextBillingDate: string;
  stripeSubscriptionId: string | null;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
  };
}

interface Invoice {
  id: number;
  userId: number;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  subscriptionId: number;
  description: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

export default function BillingManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');

  // Fetch all subscriptions
  const {
    data: subscriptions = [],
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
  } = useQuery<Subscription[]>({
    queryKey: ['/api/admin/subscriptions'],
    staleTime: 60000, // 1 minute
  });

  // Fetch all invoices
  const {
    data: invoices = [],
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useQuery<Invoice[]>({
    queryKey: ['/api/admin/invoices'],
    staleTime: 60000, // 1 minute
  });

  // Calculate billing metrics
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const monthlyRecurringRevenue = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.amount, 0);
  const totalPaidInvoices = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Apply filters and search to subscriptions
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === '' ||
      subscription.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.plan.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Apply filters and search to invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === '' ||
      invoice.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge for subscriptions
  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500 hover:bg-red-600">Canceled</Badge>;
      case 'trialing':
        return <Badge variant="outline">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status badge for invoices
  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSubscriptionClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsDetailOpen(true);
  };

  const handleCancelSubscription = (subscriptionId: number) => {
    toast({
      title: 'Subscription canceled',
      description: 'The subscription has been canceled successfully.',
    });
    setIsDetailOpen(false);
  };

  const handleReactivateSubscription = (subscriptionId: number) => {
    toast({
      title: 'Subscription reactivated',
      description: 'The subscription has been reactivated successfully.',
    });
    setIsDetailOpen(false);
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground">
            Manage subscriptions, view invoices, and track revenue
          </p>
        </div>

        {/* Billing metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{activeSubscriptions}</span>
                </div>
                <Button variant="outline" size="icon">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Recurring Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart4 className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{formatCurrency(monthlyRecurringRevenue)}</span>
                </div>
                <Button variant="outline" size="icon">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{formatCurrency(totalPaidInvoices)}</span>
                </div>
                <Button variant="outline" size="icon">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Subscriptions and Invoices */}
        <Tabs defaultValue="subscriptions" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            {/* Search and filters */}
            <div className="flex gap-2">
              <div className="relative w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {activeTab === 'subscriptions' ? (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="trialing">Trial</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="subscriptions">
            <Card>
              <CardContent className="p-0">
                {isLoadingSubscriptions ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredSubscriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <CreditCard className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No subscriptions found</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-1">
                      Try adjusting your filters or search terms to find what you're looking for.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((subscription) => (
                        <TableRow
                          key={subscription.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSubscriptionClick(subscription)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {subscription.user.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{subscription.user.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {subscription.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{subscription.plan}</TableCell>
                          <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                          <TableCell>{getSubscriptionStatusBadge(subscription.status)}</TableCell>
                          <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
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
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardContent className="p-0">
                {isLoadingInvoices ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <CreditCard className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No invoices found</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-1">
                      Try adjusting your filters or search terms to find what you're looking for.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {invoice.user.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{invoice.user.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {invoice.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.description}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Subscription detail dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedSubscription && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
              <DialogDescription>
                View and manage subscription details
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedSubscription.user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedSubscription.user.fullName}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedSubscription.user.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Plan Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Plan:</dt>
                      <dd className="font-medium">{selectedSubscription.plan}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Amount:</dt>
                      <dd className="font-medium">
                        {formatCurrency(selectedSubscription.amount)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="font-medium">
                        {getSubscriptionStatusBadge(selectedSubscription.status)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created:</dt>
                      <dd className="font-medium">
                        {formatDate(selectedSubscription.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Billing Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Billing Period:</dt>
                      <dd className="font-medium">
                        {formatDate(selectedSubscription.currentPeriodStart)} to{' '}
                        {formatDate(selectedSubscription.currentPeriodEnd)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Next Billing:</dt>
                      <dd className="font-medium">
                        {formatDate(selectedSubscription.nextBillingDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Subscription ID:</dt>
                      <dd className="font-medium">
                        {selectedSubscription.stripeSubscriptionId || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted p-6 rounded-lg">
                  <h4 className="font-medium mb-4">Subscription Actions</h4>
                  <div className="space-y-3">
                    {selectedSubscription.status === 'active' ? (
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelSubscription(selectedSubscription.id)}
                        className="w-full"
                      >
                        Cancel Subscription
                      </Button>
                    ) : selectedSubscription.status === 'canceled' ? (
                      <Button
                        onClick={() => handleReactivateSubscription(selectedSubscription.id)}
                        className="w-full"
                      >
                        Reactivate Subscription
                      </Button>
                    ) : null}

                    <Button variant="outline" className="w-full">
                      Update Payment Method
                    </Button>

                    <Button variant="outline" className="w-full">
                      Change Plan
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-6 rounded-lg">
                  <h4 className="font-medium mb-4">Recent Invoices</h4>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      No invoices found for this subscription.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}