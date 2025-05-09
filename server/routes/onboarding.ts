import { Request, Response } from "express";
import { storage } from "../storage";

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