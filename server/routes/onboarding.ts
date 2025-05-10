import { Request, Response } from "express";
import { storage } from "../storage";

// Define the onboarding steps for reference
export const ONBOARDING_STEPS = [
  { id: 1, title: 'Identity', status: 'pending' },
  { id: 2, title: 'Account Access', status: 'pending' },
  { id: 3, title: 'Brand Strategy', status: 'pending' },
  { id: 4, title: 'Communication', status: 'pending' },
  { id: 5, title: 'Content Strategy', status: 'pending' },
  { id: 6, title: 'Verification', status: 'pending' },
  { id: 7, title: 'Concierge', status: 'pending' },
  { id: 8, title: 'Legal', status: 'pending' },
];

export const handleUpdateOnboardingStep = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { step } = req.params;
    const stepNumber = parseInt(step, 10);

    if (isNaN(stepNumber)) {
      return res.status(400).json({ message: "Invalid step number" });
    }

    // Only allow moving forward, not backward
    if (req.user.onboardingStep && req.user.onboardingStep > stepNumber) {
      return res.json({ success: true });
    }

    const updatedUser = await storage.updateUser(req.user.id, {
      onboardingStep: stepNumber,
      // Update the status based on the step
      onboardingStatus: getOnboardingStatusFromStep(stepNumber)
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating onboarding step:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get onboarding progress with detailed step information
export const getOnboardingProgress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.user.id);
    const currentStep = user.onboardingStep || 1;
    
    // Map the steps with their statuses based on current progress
    const steps = ONBOARDING_STEPS.map(step => {
      if (step.id < currentStep) {
        return { ...step, status: 'completed' };
      } else if (step.id === currentStep) {
        return { ...step, status: 'current' };
      } else {
        return { ...step, status: 'pending' };
      }
    });

    res.json({
      currentStep,
      status: user.onboardingStatus,
      steps
    });
  } catch (error) {
    console.error("Get onboarding progress error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function getOnboardingStatusFromStep(step: number): string {
  if (step <= 2) {
    return "initial";
  } else if (step <= 4) {
    return "profile";
  } else if (step <= 6) {
    return "content";
  } else if (step <= 8) {
    return "complete";
  } else {
    return "advanced";
  }
}