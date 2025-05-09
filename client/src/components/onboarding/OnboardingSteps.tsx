import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './StepIndicator';
import { DocumentUploader } from './DocumentUploader';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';

// Define the steps
const ONBOARDING_STEPS = [
  { id: 1, title: 'Identity', status: 'completed' },
  { id: 2, title: 'Account Access', status: 'completed' },
  { id: 3, title: 'Brand Strategy', status: 'completed' },
  { id: 4, title: 'Communication', status: 'completed' },
  { id: 5, title: 'Content Strategy', status: 'completed' },
  { id: 6, title: 'Verification', status: 'current' },
  { id: 7, title: 'Concierge', status: 'pending' },
  { id: 8, title: 'Legal & Consent', status: 'pending' },
];

// Form schemas for different steps
const identitySchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  dateOfBirth: z.string().min(1, { message: 'Date of birth is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
});

const accountAccessSchema = z.object({
  onlyFansUsername: z.string().optional(),
  onlyFansPassword: z.string().optional(),
  needsOnlyFansCreation: z.boolean().optional(),
  instagramUsername: z.string().optional(),
  tiktokUsername: z.string().optional(),
  twitterUsername: z.string().optional(),
  preferredHandles: z.string().optional(),
});

const brandStrategySchema = z.object({
  growthGoals: z.array(z.string()).min(1, { message: 'Select at least one growth goal' }),
  contentTypes: z.array(z.string()).min(1, { message: 'Select at least one content type' }),
  brandDescription: z.string().min(3, { message: 'Describe your brand in at least 3 words' }),
  voiceTone: z.string().min(1, { message: 'Select a voice tone' }),
  doNotSayTerms: z.string().optional(),
});

const communicationSchema = z.object({
  notificationPreferences: z.array(z.string()).min(1, { message: 'Select at least one notification method' }),
  bestContactMethod: z.string().min(1, { message: 'Select your preferred contact method' }),
  preferredCheckInTime: z.string().min(1, { message: 'Select your preferred check-in time' }),
  timezone: z.string().min(1, { message: 'Select your timezone' }),
});

const contentStrategySchema = z.object({
  uploadFrequency: z.string().min(1, { message: 'Select your preferred upload frequency' }),
  existingContent: z.string().optional(),
});

const verificationSchema = z.object({
  idFront: z.any().optional(),
  idBack: z.any().optional(),
  selfieWithId: z.any().optional(),
});

const conciergeSchema = z.object({
  geographicAvailability: z.string().optional(),
  minimumRate: z.string().optional(),
  clientScreeningPreferences: z.string().optional(),
  servicesOffered: z.array(z.string()).optional(),
  approvalProcess: z.string().optional(),
  bookingSummaryPreferences: z.array(z.string()).optional(),
});

const legalSchema = z.object({
  authorizeManagement: z.boolean(),
  backupResponsibility: z.boolean(),
  agreeToTerms: z.boolean(),
});

export function OnboardingSteps() {
  const [currentStep, setCurrentStep] = useState(6); // Starting from verification step
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Get the appropriate schema for the current step
  const getSchemaForStep = (step: number) => {
    switch (step) {
      case 1: return identitySchema;
      case 2: return accountAccessSchema;
      case 3: return brandStrategySchema;
      case 4: return communicationSchema;
      case 5: return contentStrategySchema;
      case 6: return verificationSchema;
      case 7: return conciergeSchema;
      case 8: return legalSchema;
      default: return verificationSchema; // Default to verification schema
    }
  };

  // Create form based on current step
  const form = useForm<any>({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    defaultValues: {},
  });

  const onSubmit = async (data: any) => {
    try {
      // Add files to form data if on verification step
      if (currentStep === 6) {
        data.idFront = idFrontFile;
        data.idBack = idBackFile;
        data.selfieWithId = selfieFile;
      }

      // Send data to API
      await apiRequest('POST', `/api/onboarding/step/${currentStep}`, data);
      
      toast({
        title: "Step saved",
        description: "Your information has been saved successfully.",
      });

      // Move to next step if not at the end
      if (currentStep < ONBOARDING_STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving your information.",
        variant: "destructive",
      });
    }
  };

  // Handle file uploads for verification step
  const handleFileUpload = (type: 'idFront' | 'idBack' | 'selfie', file: File) => {
    if (type === 'idFront') {
      setIdFrontFile(file);
    } else if (type === 'idBack') {
      setIdBackFile(file);
    } else if (type === 'selfie') {
      setSelfieFile(file);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render verification step content
  const renderVerificationStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 6: Identity Verification</h2>
        <p className="text-gray-400 mb-6">We need to verify your identity for security purposes. Please upload the following documents:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DocumentUploader 
            title="Front of Photo ID" 
            description="Upload a clear photo of the front of your government-issued ID" 
            icon="id"
            onFileSelect={(file) => handleFileUpload('idFront', file)}
            file={idFrontFile}
          />
          
          <DocumentUploader 
            title="Back of Photo ID" 
            description="Upload a clear photo of the back of your government-issued ID" 
            icon="id"
            onFileSelect={(file) => handleFileUpload('idBack', file)}
            file={idBackFile}
          />
          
          <DocumentUploader 
            title="Selfie with ID" 
            description="Upload a selfie of yourself holding your ID next to your face" 
            icon="camera"
            onFileSelect={(file) => handleFileUpload('selfie', file)}
            file={selfieFile}
          />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
          >
            <span className="mr-2">←</span> Previous
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={!idFrontFile || !idBackFile || !selfieFile}
          >
            Next <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Onboarding</h1>
          <p className="text-gray-400 mt-1">Complete the following steps to set up your profile.</p>
        </div>
        <Button>
          Save Progress
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-white font-medium">
            {ONBOARDING_STEPS.filter(step => step.status === 'completed').length} of {ONBOARDING_STEPS.length} completed
          </span>
        </div>
        <div className="w-full h-2 bg-background-lighter rounded-full">
          <div 
            className="h-2 bg-primary rounded-full" 
            style={{ 
              width: `${(ONBOARDING_STEPS.filter(step => step.status === 'completed').length / ONBOARDING_STEPS.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        {ONBOARDING_STEPS.map((step) => (
          <StepIndicator 
            key={step.id}
            step={step.id}
            title={step.title}
            status={step.status as 'completed' | 'current' | 'pending'}
            onClick={() => {
              // Only allow navigation to completed steps or current step
              if (step.status !== 'pending') {
                setCurrentStep(step.id);
              }
            }}
          />
        ))}
      </div>

      {/* Current Step Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {currentStep === 6 && renderVerificationStep()}
        </form>
      </Form>
    </>
  );
}
