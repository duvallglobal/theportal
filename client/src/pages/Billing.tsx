import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Check,
  Shield,
  Clock,
  Download,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Check for Stripe key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing Stripe Public Key");
}

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Sample invoice data
const invoices = [
  {
    id: "INV-001",
    date: "2023-09-01",
    amount: "$199.00",
    status: "Paid",
  },
  {
    id: "INV-002",
    date: "2023-08-01",
    amount: "$199.00",
    status: "Paid",
  },
  {
    id: "INV-003",
    date: "2023-07-01",
    amount: "$199.00",
    status: "Paid",
  },
];

// Subscription plans
const plans = [
  {
    id: "basic",
    name: "OnlyFans Basic",
    price: "$99/month",
    description: "Essential management for OnlyFans creators",
    features: [
      "Content strategy guidance",
      "Basic subscriber growth",
      "Weekly content review",
      "Standard response time",
    ],
    recommended: false,
  },
  {
    id: "pro",
    name: "OnlyFans Pro",
    price: "$199/month",
    description: "Comprehensive service for serious creators",
    features: [
      "Advanced content strategy",
      "Active subscriber growth campaigns",
      "48-hour content turnaround",
      "Priority support",
      "Cross-platform promotion",
    ],
    recommended: true,
  },
  {
    id: "premium",
    name: "Complete Package",
    price: "$299/month",
    description: "Full-service management across platforms",
    features: [
      "Everything in Pro plan",
      "Rent.Men profile management",
      "24-hour content turnaround",
      "VIP support & concierge",
      "Custom growth strategies",
    ],
    recommended: false,
  },
];

export default function Billing() {
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const { toast } = useToast();

  // Fetch subscription data
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription"],
    // Return mock data for now
    queryFn: async () => ({
      id: "sub_123456",
      plan: "OnlyFans Pro",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      defaultPaymentMethod: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2024,
      },
    }),
  });

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Invoice downloaded",
      description: `Invoice ${invoiceId} has been downloaded.`,
    });
  };

  const handleUpdatePaymentMethod = () => {
    setUpdatingPayment(true);
    // In a real app, this would show a Stripe Elements form
    setTimeout(() => {
      setUpdatingPayment(false);
      toast({
        title: "Payment method updated",
        description: "Your payment method has been successfully updated.",
      });
    }, 1500);
  };

  const handleChangePlan = (planId: string) => {
    toast({
      title: "Change plan",
      description: `You selected the ${planId} plan. This would open a payment flow in a real app.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Billing</h1>
        <p className="text-gray-400 mt-1">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Subscription */}
      <Card className="mb-8 bg-background-card border-background-lighter">
        <CardHeader>
          <CardTitle className="text-white">Current Subscription</CardTitle>
          <CardDescription>
            Your subscription renews automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {subscription?.plan}
              </h3>
              <p className="text-sm text-gray-400">
                Renews on{" "}
                {subscription?.currentPeriodEnd.toLocaleDateString()}
              </p>
              <div className="flex items-center mt-2">
                <div className="bg-green-500 bg-opacity-20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Button>Manage Subscription</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-8 bg-background-card border-background-lighter">
        <CardHeader>
          <CardTitle className="text-white">Payment Method</CardTitle>
          <CardDescription>
            Update your billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex items-center">
              <div className="p-3 bg-background-lighter rounded-lg mr-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-white">
                  {subscription?.defaultPaymentMethod.brand.toUpperCase()}{" "}
                  ending in {subscription?.defaultPaymentMethod.last4}
                </p>
                <p className="text-sm text-gray-400">
                  Expires{" "}
                  {`${subscription?.defaultPaymentMethod.expMonth}/${subscription?.defaultPaymentMethod.expYear}`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleUpdatePaymentMethod}
              disabled={updatingPayment}
              className="mt-4 md:mt-0"
            >
              {updatingPayment ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Payment Method"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="mb-8 bg-background-card border-background-lighter">
        <CardHeader>
          <CardTitle className="text-white">Billing History</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-lighter">
                  <th className="text-left py-3 text-gray-400 font-medium">
                    Invoice
                  </th>
                  <th className="text-left py-3 text-gray-400 font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 text-gray-400 font-medium">
                    Amount
                  </th>
                  <th className="text-left py-3 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-right py-3 text-gray-400 font-medium">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-background-lighter"
                  >
                    <td className="py-4 text-white">{invoice.id}</td>
                    <td className="py-4 text-gray-300">{invoice.date}</td>
                    <td className="py-4 text-gray-300">{invoice.amount}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-400">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownloadInvoice(invoice.id)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-background-card border-background-lighter ${
                plan.recommended
                  ? "ring-2 ring-primary relative"
                  : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 bg-primary text-white text-xs font-bold py-1 px-3 rounded-full">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-white mt-2">
                  {plan.price}
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-gray-300"
                    >
                      <Check className="text-primary h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={plan.recommended ? "bg-primary w-full" : "w-full"}
                  variant={plan.recommended ? "default" : "outline"}
                  onClick={() => handleChangePlan(plan.id)}
                >
                  {subscription?.plan === plan.name
                    ? "Current Plan"
                    : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Security Information */}
      <Card className="bg-background-card border-background-lighter">
        <CardContent className="pt-6">
          <div className="flex items-center text-gray-400 text-sm mb-2">
            <Shield className="h-4 w-4 mr-2 text-primary" />
            <p>
              All transactions are secure and encrypted. Your payment
              information is never stored on our servers.
            </p>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <p>
              You can cancel your subscription at any time. No long-term
              contracts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
