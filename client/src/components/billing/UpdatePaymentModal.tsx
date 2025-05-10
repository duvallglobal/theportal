import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Create the payment method
    const { error: submitError } = await elements.submit();
    
    if (submitError) {
      setErrorMessage(submitError.message || "An unexpected error occurred");
      setIsProcessing(false);
      return;
    }

    try {
      // Create the payment method on the server
      const response = await apiRequest("POST", "/api/update-payment-method", {});
      const { clientSecret } = await response.json();

      // Confirm the setup with Stripe
      const { error } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + "/billing",
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to update payment method");
      } else {
        toast({
          title: "Payment method updated",
          description: "Your payment method has been successfully updated.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      setErrorMessage("Failed to update payment method. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-4 bg-background-card border-background-lighter">
        <CardContent className="pt-6">
          <PaymentElement />
          {errorMessage && (
            <div className="mt-4 p-2 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-sm">
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          disabled={isProcessing}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? "Processing..." : "Update Payment Method"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdatePaymentModal({ open, onOpenChange }: UpdatePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Fetch a setup intent from the server
      apiRequest("POST", "/api/create-setup-intent")
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.error("Error creating setup intent:", error);
          toast({
            title: "Error",
            description: "Failed to initialize payment form. Please try again.",
            variant: "destructive",
          });
          onOpenChange(false);
        });
    } else {
      setClientSecret(null);
    }
  }, [open, onOpenChange, toast]);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Update Payment Method</DialogTitle>
        </DialogHeader>

        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#0ea5e9",
                  colorBackground: "#1e293b",
                  colorText: "#f8fafc",
                  colorDanger: "#ef4444",
                  fontFamily: "Inter, sans-serif",
                },
              },
            }}
          >
            <PaymentForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </Elements>
        ) : (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}