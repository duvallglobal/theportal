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

    // Get form data for current step to prefill the form
    let formData: any = {};
    
    // Fetch data based on the current step
    try {
      // Get user profile data
      const profile = await storage.getProfileByUserId(req.user.id);
      
      // Step 1: Identity data
      if (currentStep >= 1) {
        formData = {
          ...formData,
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: profile?.birthDate || '',
        };
      }
      
      // Step 2: Account Access data
      if (currentStep >= 2) {
        // Get platform accounts
        const platformAccounts = await storage.getPlatformAccountsByUserId(req.user.id);
        
        // Extract OnlyFans account
        const onlyFansAccount = platformAccounts.find(acc => acc.platformType === 'OnlyFans');
        formData.onlyFansUsername = onlyFansAccount?.username || '';
        formData.onlyFansPassword = ''; // Don't send back password for security
        formData.needsOnlyFansCreation = !!onlyFansAccount?.needsCreation;
        
        // Extract Instagram account
        const instagramAccount = platformAccounts.find(acc => acc.platformType === 'Instagram');
        formData.instagramUsername = instagramAccount?.username || '';
        formData.needsInstagramCreation = !!instagramAccount?.needsCreation;
        
        // Extract TikTok account
        const tiktokAccount = platformAccounts.find(acc => acc.platformType === 'TikTok');
        formData.tiktokUsername = tiktokAccount?.username || '';
        formData.needsTiktokCreation = !!tiktokAccount?.needsCreation;
        
        // Extract Twitter account
        const twitterAccount = platformAccounts.find(acc => acc.platformType === 'Twitter');
        formData.twitterUsername = twitterAccount?.username || '';
        formData.needsTwitterCreation = !!twitterAccount?.needsCreation;
        
        // Extract Snapchat account
        const snapchatAccount = platformAccounts.find(acc => acc.platformType === 'Snapchat');
        formData.snapchatUsername = snapchatAccount?.username || '';
        formData.needsSnapchatCreation = !!snapchatAccount?.needsCreation;
        
        // Extract Reddit account
        const redditAccount = platformAccounts.find(acc => acc.platformType === 'Reddit');
        formData.redditUsername = redditAccount?.username || '';
        formData.needsRedditCreation = !!redditAccount?.needsCreation;
        
        // Add preferred handles
        formData.preferredHandles = profile?.preferredHandles || '';
      }
      
      // Step 3: Brand Strategy data
      if (currentStep >= 3) {
        formData.brandDescription = profile?.brandDescription || '';
        formData.voiceTone = profile?.voiceTone || '';
        formData.doNotSayTerms = profile?.doNotSayTerms || '';
        
        // Get content strategy data
        const contentStrategy = await storage.getContentStrategyByUserId(req.user.id);
        if (contentStrategy) {
          try {
            // Parse JSON arrays if they exist
            formData.growthGoals = contentStrategy.growthGoals 
              ? JSON.parse(contentStrategy.growthGoals.toString())
              : [];
            formData.contentTypes = contentStrategy.contentTypes
              ? JSON.parse(contentStrategy.contentTypes.toString())
              : [];
          } catch (err) {
            console.error("Error parsing JSON from content strategy:", err);
            formData.growthGoals = [];
            formData.contentTypes = [];
          }
        }
      }
      
      // Step 4: Communication data
      if (currentStep >= 4) {
        formData.bestContactMethod = profile?.preferredContactMethod || '';
        formData.preferredCheckInTime = profile?.preferredCheckInTime || '';
        formData.timezone = profile?.timezone || '';
        // Note: notificationPreferences would come from a different table
        formData.notificationPreferences = [];
      }
      
      // Step 5: Content Strategy data 
      if (currentStep >= 5) {
        formData.uploadFrequency = profile?.uploadFrequency || '';
        
        // Get content strategy for existing content
        const contentStrategy = await storage.getContentStrategyByUserId(req.user.id);
        if (contentStrategy) {
          formData.existingContent = contentStrategy.existingContent || '';
        }
      }
      
    } catch (err) {
      console.error("Error fetching form data:", err);
      // Continue without form data if there's an error
    }

    res.json({
      currentStep,
      status: user.onboardingStatus,
      steps,
      formData
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