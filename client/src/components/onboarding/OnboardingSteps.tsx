import { useState, useEffect } from 'react';
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
import { apiRequest, queryClient } from '@/lib/queryClient';
import { BrandStrategyStep } from './BrandStrategyStep';
import { Loader2 } from 'lucide-react';

// Define the default steps setup
const DEFAULT_STEPS = [
  { id: 1, title: 'Identity', status: 'pending' },
  { id: 2, title: 'Account Access', status: 'pending' },
  { id: 3, title: 'Brand Strategy', status: 'pending' },
  { id: 4, title: 'Communication', status: 'pending' },
  { id: 5, title: 'Content Strategy', status: 'pending' },
  { id: 6, title: 'Verification', status: 'pending' },
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
  const [currentStep, setCurrentStep] = useState(1); // Starting from first step
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
    defaultValues: {
      // Initialize arrays for checkbox groups
      growthGoals: [],
      contentTypes: [],
      notificationPreferences: [],
      servicesOffered: [],
      bookingSummaryPreferences: []
    },
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

  // Render identity step content
  const renderIdentityStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 1: Identity</h2>
        <p className="text-gray-400 mb-6">Let's start with some basic information about you.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end mt-8">
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>
            Next <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    );
  };

  // Render account access step content
  const renderAccountAccessStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 2: Account Access</h2>
        <p className="text-gray-400 mb-6">Provide your social media and platform credentials so we can help manage your content.</p>
        
        <div className="space-y-6">
          <div className="border-b border-background-lighter pb-6">
            <h3 className="text-lg font-medium text-white mb-4">OnlyFans Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="onlyFansUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OnlyFans Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your OnlyFans username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="onlyFansPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OnlyFans Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Your OnlyFans password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="needsOnlyFansCreation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I don't have an OnlyFans account and need help creating one</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium text-white mb-4">Other Social Media Platforms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="instagramUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Instagram username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tiktokUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your TikTok username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="twitterUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Twitter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preferredHandles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Social Media Handles</FormLabel>
                    <FormControl>
                      <Input placeholder="Handles you'd like to use" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
          >
            <span className="mr-2">←</span> Previous
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>
            Next <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    );
  };

  // Render brand strategy step content
  const renderBrandStrategyStep = () => {
    return (
      <BrandStrategyStep
        form={form}
        onSubmit={onSubmit}
        goToPreviousStep={goToPreviousStep}
      />
    );
  };

  // Render communication step content
  const renderCommunicationStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 4: Communication</h2>
        <p className="text-gray-400 mb-6">Let us know your communication preferences for managing your accounts.</p>
        
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="notificationPreferences"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Notification Preferences</FormLabel>
                  <p className="text-gray-400 text-sm">How would you like to receive notifications?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Email', 'SMS/Text', 'In-app notifications', 'Phone call'].map((method) => (
                    <FormField
                      key={method}
                      control={form.control}
                      name="notificationPreferences"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(method)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), method])
                                    : field.onChange(field.value?.filter((value) => value !== method) || []);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {method}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bestContactMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Best Contact Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preferred contact method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS/Text</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="app">In-App Messaging</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="preferredCheckInTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Check-In Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preferred time for check-ins" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8AM - 11AM)</SelectItem>
                    <SelectItem value="midday">Midday (11AM - 2PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (2PM - 5PM)</SelectItem>
                    <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                    <SelectItem value="night">Night (8PM - 11PM)</SelectItem>
                    <SelectItem value="weekly">Weekly Only</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Timezone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ET">Eastern Time (ET)</SelectItem>
                    <SelectItem value="CT">Central Time (CT)</SelectItem>
                    <SelectItem value="MT">Mountain Time (MT)</SelectItem>
                    <SelectItem value="PT">Pacific Time (PT)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="CET">Central European Time (CET)</SelectItem>
                    <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                    <SelectItem value="JST">Japan Standard Time (JST)</SelectItem>
                    <SelectItem value="AEST">Australian Eastern Standard Time (AEST)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
          >
            <span className="mr-2">←</span> Previous
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>
            Next <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    );
  };

  // Render content strategy step content
  const renderContentStrategyStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 5: Content Strategy</h2>
        <p className="text-gray-400 mb-6">Let's plan your content creation and publishing schedule.</p>
        
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="uploadFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="How often would you like to post new content?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="2-3x-week">2-3 Times per Week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="existingContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Existing Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe any existing content you already have or ideas you want to implement" 
                    className="min-h-[150px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
          >
            <span className="mr-2">←</span> Previous
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>
            Next <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    );
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
  
  // Render concierge step content
  const renderConciergeStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 7: Concierge Services</h2>
        <p className="text-gray-400 mb-6">Configure your preferences for in-person appointments and client interactions.</p>
        
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="geographicAvailability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geographic Availability</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe where you are available for in-person appointments (cities, regions, etc.)"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="minimumRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Appointment Rate</FormLabel>
                <FormControl>
                  <Input placeholder="Minimum rate for in-person appointments" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="clientScreeningPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Screening Preferences</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your client screening preferences and requirements"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="servicesOffered"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Services Offered</FormLabel>
                  <p className="text-gray-400 text-sm">Select all services you're willing to provide</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Private meetings', 'Travel companionship', 'Event attendance', 'Extended bookings', 'Photoshoots', 'Video creation'].map((service) => (
                    <FormField
                      key={service}
                      control={form.control}
                      name="servicesOffered"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), service])
                                    : field.onChange(field.value?.filter((value) => value !== service) || []);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {service}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="approvalProcess"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Approval Process</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preferred approval process" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">Manual Approval (Review each request)</SelectItem>
                    <SelectItem value="auto-verified">Auto-approve Verified Clients</SelectItem>
                    <SelectItem value="auto-all">Auto-approve All Requests</SelectItem>
                    <SelectItem value="manager">Manager Pre-approval</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bookingSummaryPreferences"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Booking Summary Preferences</FormLabel>
                  <p className="text-gray-400 text-sm">What information would you like to see in your booking summaries?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Client name', 'Client contact info', 'Location details', 'Duration', 'Payment details', 'Client requests', 'Meeting notes'].map((preference) => (
                    <FormField
                      key={preference}
                      control={form.control}
                      name="bookingSummaryPreferences"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(preference)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), preference])
                                    : field.onChange(field.value?.filter((value) => value !== preference) || []);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {preference}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
          >
            <span className="mr-2">←</span> Previous
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>
            Next <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    );
  };
  
  // Render legal step content
  const renderLegalStep = () => {
    return (
      <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Step 8: Legal & Consent</h2>
        <p className="text-gray-400 mb-6">Please review and agree to the following legal terms and conditions.</p>
        
        <div className="space-y-6">
          <div className="bg-background-lighter p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-400 mb-4">
              By using our services, you agree to the following terms and conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
              <li>You authorize ManageTheFans to create, manage, and post content on your behalf on the indicated platforms.</li>
              <li>You are responsible for ensuring all content complies with the terms of service of each platform.</li>
              <li>You are responsible for keeping backup copies of your credentials and content.</li>
              <li>ManageTheFans is not responsible for platform-specific issues, account suspensions, or content removals.</li>
              <li>You agree to provide accurate information and to keep your contact details up to date.</li>
              <li>ManageTheFans will use your information only as described in our Privacy Policy.</li>
            </ul>
          </div>
          
          <FormField
            control={form.control}
            name="authorizeManagement"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I authorize ManageTheFans to manage my accounts and post content on my behalf</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="backupResponsibility"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I understand that I am responsible for maintaining backups of my content</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I have read and agree to the Terms of Service and Privacy Policy</FormLabel>
                </div>
              </FormItem>
            )}
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
            disabled={!form.watch('authorizeManagement') || !form.watch('backupResponsibility') || !form.watch('agreeToTerms')}
          >
            Complete Onboarding
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
          {currentStep === 1 && renderIdentityStep()}
          {currentStep === 2 && renderAccountAccessStep()}
          {currentStep === 3 && renderBrandStrategyStep()}
          {currentStep === 4 && renderCommunicationStep()}
          {currentStep === 5 && renderContentStrategyStep()}
          {currentStep === 6 && renderVerificationStep()}
          {currentStep === 7 && renderConciergeStep()}
          {currentStep === 8 && renderLegalStep()}
        </form>
      </Form>
    </>
  );
}
