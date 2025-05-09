import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingTooltip {
  id: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  targetSelector?: string;
  targetElementId?: string;
  requiredStep?: number;
  order: number;
}

interface OnboardingContextType {
  activeTooltip: OnboardingTooltip | null;
  dismissTooltip: () => void;
  completedTooltips: string[];
  completeTooltip: (tooltipId: string, stepNumber?: number) => void;
  isTooltipCompleted: (tooltipId: string) => boolean;
  showTooltip: (tooltipId: string) => void;
  tooltips: OnboardingTooltip[];
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const tooltips: OnboardingTooltip[] = [
  {
    id: "dashboard_welcome",
    title: "Welcome to ManageTheFans",
    content: "This is your dashboard where you can manage your content, appointments, and profile information.",
    placement: "bottom",
    targetSelector: ".dashboard-header",
    order: 1
  },
  {
    id: "profile_setup",
    title: "Complete Your Profile",
    content: "Make sure to complete your profile to help us better assist you with your content strategy.",
    placement: "right",
    targetSelector: ".profile-link",
    order: 2
  },
  {
    id: "appointments_tooltip",
    title: "Appointment Management",
    content: "Check this section to view and respond to appointment requests from your manager.",
    placement: "right",
    targetSelector: ".appointments-link",
    order: 3
  },
  {
    id: "content_upload",
    title: "Upload Content",
    content: "Click here to upload new content for your platforms.",
    placement: "right",
    targetSelector: ".content-link",
    order: 4
  },
  {
    id: "messages_tooltip",
    title: "Check Your Messages",
    content: "Stay in touch with your management team through our secure messaging system.",
    placement: "right",
    targetSelector: ".messages-link",
    order: 5
  },
  {
    id: "billing_tooltip",
    title: "Billing Information",
    content: "View and manage your subscription and billing information here.",
    placement: "right",
    targetSelector: ".billing-link",
    order: 6
  }
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [completedTooltips, setCompletedTooltips] = useLocalStorage<string[]>("mtf_completed_tooltips", []);
  const [activeTooltip, setActiveTooltip] = useState<OnboardingTooltip | null>(null);
  const { toast } = useToast();

  const dismissTooltip = () => {
    setActiveTooltip(null);
  };

  const completeTooltip = async (tooltipId: string, stepNumber?: number) => {
    if (!completedTooltips.includes(tooltipId)) {
      const updatedCompletedTooltips = [...completedTooltips, tooltipId];
      setCompletedTooltips(updatedCompletedTooltips);
      dismissTooltip();

      // If a step number is provided, update the onboarding step on the server
      if (stepNumber && user) {
        try {
          await apiRequest("POST", `/api/onboarding/tooltip/${stepNumber}`);
        } catch (error) {
          console.error("Failed to update onboarding step:", error);
          toast({
            title: "Error",
            description: "Failed to update your onboarding progress. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const isTooltipCompleted = (tooltipId: string) => {
    return completedTooltips.includes(tooltipId);
  };

  const showTooltip = (tooltipId: string) => {
    const tooltip = tooltips.find(t => t.id === tooltipId);
    
    if (tooltip && !isTooltipCompleted(tooltipId)) {
      setActiveTooltip(tooltip);
    }
  };

  // Show tooltips in order if applicable
  useEffect(() => {
    if (user && user.onboardingStatus !== "complete") {
      const sortedTooltips = [...tooltips].sort((a, b) => a.order - b.order);
      
      // Find the first tooltip that hasn't been completed
      const nextTooltip = sortedTooltips.find(tooltip => {
        // If the tooltip has a required step, check if the user has reached that step
        if (tooltip.requiredStep && user.onboardingStep) {
          return !isTooltipCompleted(tooltip.id) && user.onboardingStep >= tooltip.requiredStep;
        }
        
        return !isTooltipCompleted(tooltip.id);
      });
      
      if (nextTooltip && !activeTooltip) {
        // Check if the target element exists before showing the tooltip
        const targetExists = nextTooltip.targetSelector ? 
          document.querySelector(nextTooltip.targetSelector) : 
          (nextTooltip.targetElementId ? document.getElementById(nextTooltip.targetElementId) : null);
        
        if (targetExists) {
          setActiveTooltip(nextTooltip);
        }
      }
    }
  }, [user, completedTooltips, activeTooltip]);

  return (
    <OnboardingContext.Provider
      value={{
        activeTooltip,
        dismissTooltip,
        completedTooltips,
        completeTooltip,
        isTooltipCompleted,
        showTooltip,
        tooltips
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}