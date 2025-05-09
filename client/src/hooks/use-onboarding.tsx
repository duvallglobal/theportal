import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the onboarding steps
export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  placement?: "top" | "bottom" | "left" | "right";
  page: string; // e.g., '/dashboard', '/profile', etc.
  order: number; // To ensure the steps are shown in the correct order
  condition?: () => boolean; // Optional function to determine if this step should be shown
  withArrow?: boolean;
  spotlightPadding?: number;
  requiredOnboardingStep?: number; // Minimum onboarding step required in user profile
};

type OnboardingContextType = {
  steps: OnboardingStep[];
  currentStep: number;
  isActive: boolean;
  isTooltipVisible: boolean;
  startOnboarding: () => void;
  endOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  markStepComplete: (stepId: string) => void;
  isStepComplete: (stepId: string) => boolean;
  restartOnboarding: () => void;
  currentTooltip: OnboardingStep | null;
  jumpToStep: (stepId: string) => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// Define all onboarding steps across the application
const onboardingSteps: OnboardingStep[] = [
  // Dashboard onboarding
  {
    id: "welcome",
    title: "Welcome to the ManageTheFans Portal!",
    description: "Let's take a quick tour to help you get started.",
    target: ".dashboard-welcome",
    placement: "bottom",
    page: "/dashboard",
    order: 1,
    withArrow: true,
    requiredOnboardingStep: 1,
  },
  {
    id: "sidebar-navigation",
    title: "Navigation",
    description: "Use the sidebar to navigate between different sections of the portal.",
    target: ".sidebar-navigation",
    placement: "right",
    page: "/dashboard",
    order: 2,
    withArrow: true,
    requiredOnboardingStep: 1,
  },
  
  // Profile onboarding
  {
    id: "profile-basics",
    title: "Complete Your Profile",
    description: "Fill in your basic information to get started.",
    target: ".profile-basics-section",
    placement: "bottom",
    page: "/profile",
    order: 3,
    withArrow: true,
    requiredOnboardingStep: 2,
  },
  
  // Content upload onboarding
  {
    id: "content-upload",
    title: "Upload Content",
    description: "This is where you can upload your content for review and scheduling.",
    target: ".content-upload-area",
    placement: "top",
    page: "/content-upload",
    order: 4,
    withArrow: true,
    requiredOnboardingStep: 3,
  },
  
  // Appointments onboarding
  {
    id: "appointments-overview",
    title: "Manage Appointments",
    description: "View and respond to appointment proposals here.",
    target: ".appointments-tabs",
    placement: "top",
    page: "/appointments",
    order: 5,
    withArrow: true,
    requiredOnboardingStep: 4,
  },
  {
    id: "appointment-actions",
    title: "Appointment Actions",
    description: "Approve or decline appointment proposals with these buttons.",
    target: ".appointment-actions",
    placement: "left",
    page: "/appointments",
    order: 6,
    withArrow: true,
    requiredOnboardingStep: 4,
  },
  
  // Brand strategy onboarding
  {
    id: "brand-strategy",
    title: "Define Your Brand",
    description: "Create your brand strategy to help us market your content effectively.",
    target: ".brand-strategy-form",
    placement: "top",
    page: "/brand-strategy",
    order: 7,
    withArrow: true,
    requiredOnboardingStep: 5,
  },
  
  // Billing onboarding
  {
    id: "billing-overview",
    title: "Billing Information",
    description: "Manage your subscription and payment methods here.",
    target: ".billing-overview",
    placement: "top",
    page: "/billing",
    order: 8,
    withArrow: true,
    requiredOnboardingStep: 6,
  }
];

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useLocalStorage<string[]>("onboarding-completed-steps", []);
  
  // Filter steps based on user's onboarding progress
  const filteredSteps = onboardingSteps.filter(step => {
    if (!step.requiredOnboardingStep) return true;
    return user?.onboardingStep && user.onboardingStep >= step.requiredOnboardingStep;
  });

  // Current tooltip to display
  const currentTooltip = isActive && filteredSteps.length > 0 && currentStep < filteredSteps.length 
    ? filteredSteps[currentStep] 
    : null;

  // Update user's onboarding step on the server
  const updateOnboardingStepMutation = useMutation({
    mutationFn: async (step: number) => {
      if (!user) return null;
      const res = await apiRequest("POST", `/api/onboarding/step/${step}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating onboarding progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if we should start onboarding based on the current URL
  useEffect(() => {
    if (!isActive || !currentTooltip) return;

    const currentPath = window.location.pathname;
    if (currentTooltip.page !== currentPath) {
      setIsTooltipVisible(false);
    } else {
      // Wait for the DOM to be ready before showing the tooltip
      const checkForElement = () => {
        const element = document.querySelector(currentTooltip.target);
        if (element) {
          setIsTooltipVisible(true);
        } else {
          setTimeout(checkForElement, 500);
        }
      };
      
      checkForElement();
    }
  }, [isActive, currentTooltip, currentStep]);

  // Start the onboarding process
  const startOnboarding = () => {
    setCurrentStep(0);
    setIsActive(true);
    setIsTooltipVisible(false);
  };

  // End the onboarding process
  const endOnboarding = () => {
    setIsActive(false);
    setIsTooltipVisible(false);
  };

  // Move to the next step
  const nextStep = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
      setIsTooltipVisible(false);
    } else {
      endOnboarding();
    }
  };

  // Move to the previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
      setIsTooltipVisible(false);
    }
  };

  // Skip the current step
  const skipStep = () => {
    nextStep();
  };

  // Mark a step as complete
  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    // If this step has a required onboarding step, update the user's progress
    const step = filteredSteps.find(s => s.id === stepId);
    if (step?.requiredOnboardingStep && user?.onboardingStep) {
      if (user.onboardingStep <= step.requiredOnboardingStep) {
        updateOnboardingStepMutation.mutate(step.requiredOnboardingStep + 1);
      }
    }
    
    nextStep();
  };

  // Check if a step is complete
  const isStepComplete = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  // Restart the onboarding process
  const restartOnboarding = () => {
    setCompletedSteps([]);
    startOnboarding();
  };

  // Jump to a specific step
  const jumpToStep = (stepId: string) => {
    const stepIndex = filteredSteps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      setIsTooltipVisible(false);
      setIsActive(true);
    }
  };

  const value = {
    steps: filteredSteps,
    currentStep,
    isActive,
    isTooltipVisible,
    startOnboarding,
    endOnboarding,
    nextStep,
    prevStep,
    skipStep,
    markStepComplete,
    isStepComplete,
    restartOnboarding,
    currentTooltip,
    jumpToStep,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};