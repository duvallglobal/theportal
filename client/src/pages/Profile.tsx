import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Lock, Shield, User as UserIcon, AtSign, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Personal Information Schema
const personalInfoSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  timezone: z.string().optional(),
  preferredCheckInTime: z.string().optional(),
  preferredContactMethod: z.string().optional(),
});

// Account Credentials Schema
const accountCredentialsSchema = z.object({
  platforms: z.array(
    z.object({
      id: z.string(),
      platform: z.string(),
      username: z.string().optional(),
      password: z.string().optional(),
      needsCreation: z.boolean().optional(),
    })
  ),
});

// Security Settings Schema
const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  receiveAlerts: z.boolean().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
type AccountCredentialsValues = z.infer<typeof accountCredentialsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Personal Info Form
  const personalInfoForm = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      birthDate: "",
      timezone: user?.timezone || "",
      preferredCheckInTime: user?.preferredCheckInTime || "",
      preferredContactMethod: user?.preferredContactMethod || "",
    },
  });

  // Platform Credentials Form
  const accountCredentialsForm = useForm<AccountCredentialsValues>({
    resolver: zodResolver(accountCredentialsSchema),
    defaultValues: {
      platforms: [
        { id: "onlyfans", platform: "OnlyFans", username: "", password: "", needsCreation: false },
        { id: "instagram", platform: "Instagram", username: "", password: "", needsCreation: false },
        { id: "twitter", platform: "Twitter/X", username: "", password: "", needsCreation: false },
        { id: "tiktok", platform: "TikTok", username: "", password: "", needsCreation: false },
        { id: "reddit", platform: "Reddit", username: "", password: "", needsCreation: false },
        { id: "rentmen", platform: "Rent.Men", username: "", password: "", needsCreation: false },
      ],
    },
  });

  // Security Settings Form
  const securitySettingsForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      twoFactorEnabled: false,
      receiveAlerts: true,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: false, // Disabled for now, would be enabled in a real app
  });

  // Update personal info mutation
  const updatePersonalInfo = useMutation({
    mutationFn: async (data: PersonalInfoValues) => {
      return apiRequest("PUT", "/api/profile/personal-info", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your personal information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    },
  });

  // Update account credentials mutation
  const updateAccountCredentials = useMutation({
    mutationFn: async (data: AccountCredentialsValues) => {
      return apiRequest("PUT", "/api/profile/account-credentials", data);
    },
    onSuccess: () => {
      toast({
        title: "Credentials updated",
        description: "Your account credentials have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was a problem updating your account credentials.",
        variant: "destructive",
      });
    },
  });

  // Update security settings mutation
  const updateSecuritySettings = useMutation({
    mutationFn: async (data: SecuritySettingsValues) => {
      return apiRequest("PUT", "/api/profile/security-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Security settings updated",
        description: "Your security settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      securitySettingsForm.reset({
        ...securitySettingsForm.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was a problem updating your security settings.",
        variant: "destructive",
      });
    },
  });

  // Handle personal info form submission
  const onPersonalInfoSubmit = (data: PersonalInfoValues) => {
    setIsUpdating(true);
    updatePersonalInfo.mutate(data, {
      onSettled: () => setIsUpdating(false),
    });
  };

  // Handle account credentials form submission
  const onAccountCredentialsSubmit = (data: AccountCredentialsValues) => {
    setIsUpdating(true);
    updateAccountCredentials.mutate(data, {
      onSettled: () => setIsUpdating(false),
    });
  };

  // Handle security settings form submission
  const onSecuritySettingsSubmit = (data: SecuritySettingsValues) => {
    setIsUpdating(true);
    updateSecuritySettings.mutate(data, {
      onSettled: () => setIsUpdating(false),
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (platformId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  // Helper for contact method options
  const contactMethodOptions = [
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "telegram", label: "Telegram" },
  ];

  // Helper for timezone options
  const timezoneOptions = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Profile & Account Access</h1>
        <p className="text-gray-400 mt-1">Manage your personal information and platform credentials</p>
      </div>

      <Tabs defaultValue="personal-info" className="mb-8">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="personal-info">Personal Information</TabsTrigger>
          <TabsTrigger value="account-credentials">Platform Credentials</TabsTrigger>
          <TabsTrigger value="security-settings">Security Settings</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal-info">
          <Card className="bg-background-card border-background-lighter">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <UserIcon className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>Update your personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...personalInfoForm}>
                <form
                  id="personal-info-form"
                  onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={personalInfoForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Your email address"
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Your phone number"
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-background-lighter" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Communication Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={personalInfoForm.control}
                        name="preferredContactMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Contact Method</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-10 px-3 py-2 bg-background-lighter text-white rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                                {...field}
                              >
                                <option value="" disabled>Select a contact method</option>
                                {contactMethodOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-10 px-3 py-2 bg-background-lighter text-white rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                                {...field}
                              >
                                <option value="" disabled>Select your timezone</option>
                                {timezoneOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={personalInfoForm.control}
                      name="preferredCheckInTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Check-in Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            When should we check in with you for approvals and updates?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t border-background-lighter pt-6 flex justify-end">
              <Button
                type="submit"
                form="personal-info-form"
                disabled={isUpdating || !personalInfoForm.formState.isDirty}
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Platform Credentials Tab */}
        <TabsContent value="account-credentials">
          <Card className="bg-background-card border-background-lighter">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <AtSign className="h-5 w-5 text-primary" />
                <CardTitle>Platform Credentials</CardTitle>
              </div>
              <CardDescription>
                Manage your social media and content platform credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountCredentialsForm}>
                <form
                  id="account-credentials-form"
                  onSubmit={accountCredentialsForm.handleSubmit(onAccountCredentialsSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    {accountCredentialsForm.getValues().platforms.map((platform, index) => (
                      <div key={platform.id} className="p-4 bg-background-lighter rounded-lg">
                        <h3 className="text-lg font-medium text-white mb-4">{platform.platform}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={accountCredentialsForm.control}
                            name={`platforms.${index}.username`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={`Your ${platform.platform} username`}
                                    className="bg-background"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={accountCredentialsForm.control}
                            name={`platforms.${index}.password`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPasswords[platform.id] ? "text" : "password"}
                                      placeholder={`Your ${platform.platform} password`}
                                      className="bg-background pr-10"
                                      {...field}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-1 top-1 h-8 w-8 p-0"
                                      onClick={() => togglePasswordVisibility(platform.id)}
                                    >
                                      {showPasswords[platform.id] ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="mt-4 flex items-center space-x-2">
                          <FormField
                            control={accountCredentialsForm.control}
                            name={`platforms.${index}.needsCreation`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm text-gray-400">
                                  I need a new {platform.platform} account created for me
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preferred Username Handles Section */}
                  <div className="p-4 bg-background-lighter rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-4">Preferred Username Handles</h3>
                    <p className="text-gray-400 mb-4">
                      If you need new accounts created, please provide your top 3 preferred username handles in order of preference.
                    </p>
                    <div className="space-y-4">
                      <Input
                        placeholder="First choice (most preferred)"
                        className="bg-background"
                      />
                      <Input
                        placeholder="Second choice"
                        className="bg-background"
                      />
                      <Input
                        placeholder="Third choice"
                        className="bg-background"
                      />
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t border-background-lighter pt-6 flex justify-end">
              <Button
                type="submit"
                form="account-credentials-form"
                disabled={isUpdating || !accountCredentialsForm.formState.isDirty}
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  "Save Credentials"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security-settings">
          <Card className="bg-background-card border-background-lighter">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>
                Manage your account security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securitySettingsForm}>
                <form
                  id="security-settings-form"
                  onSubmit={securitySettingsForm.handleSubmit(onSecuritySettingsSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-background-lighter rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                        <p className="text-gray-400 text-sm">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <FormField
                        control={securitySettingsForm.control}
                        name="twoFactorEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background-lighter rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Security Alerts</h3>
                        <p className="text-gray-400 text-sm">
                          Receive alerts for suspicious activity
                        </p>
                      </div>
                      <FormField
                        control={securitySettingsForm.control}
                        name="receiveAlerts"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator className="bg-background-lighter" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Change Password</h3>
                    <FormField
                      control={securitySettingsForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                type="password"
                                className="pl-10 bg-background-lighter"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securitySettingsForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                type="password"
                                className="pl-10 bg-background-lighter"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securitySettingsForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                type="password"
                                className="pl-10 bg-background-lighter"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t border-background-lighter pt-6 flex justify-between">
              <Button variant="outline" type="button">
                Download My Data
              </Button>
              <Button
                type="submit"
                form="security-settings-form"
                disabled={isUpdating || !securitySettingsForm.formState.isDirty}
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  "Save Security Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
