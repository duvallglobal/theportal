import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

// Define schema for brand strategy form
const brandStrategySchema = z.object({
  growthGoals: z.array(z.string()).min(1, { message: "Select at least one growth goal" }),
  contentTypes: z.array(z.string()).min(1, { message: "Select at least one content type" }),
  brandDescription: z.string().min(3, { message: "Describe your brand in at least 3 words" }),
  voiceTone: z.string({ required_error: "Please select a voice tone" }),
  doNotSayTerms: z.string().optional(),
  uploadFrequency: z.string({ required_error: "Please select an upload frequency" }),
  existingContent: z.string().optional(),
});

type BrandStrategyValues = z.infer<typeof brandStrategySchema>;

export default function BrandStrategy() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Setup form with default values
  const form = useForm<BrandStrategyValues>({
    resolver: zodResolver(brandStrategySchema),
    defaultValues: {
      growthGoals: [],
      contentTypes: [],
      brandDescription: "",
      voiceTone: "",
      doNotSayTerms: "",
      uploadFrequency: "",
      existingContent: "",
    },
  });

  // Growth goals options
  const growthGoalsOptions = [
    { id: "subscribers", label: "OnlyFans subscribers growth" },
    { id: "brand-visibility", label: "Brand visibility" },
    { id: "dms-sales", label: "DMs and direct sales" },
    { id: "rentmen-bookings", label: "Rent.Men bookings" },
    { id: "cross-platform", label: "Cross-platform followers" },
  ];

  // Content types options
  const contentTypesOptions = [
    { id: "sexy", label: "Sexy/Erotic" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "humor", label: "Humor" },
    { id: "promotional", label: "Promotional" },
    { id: "bts", label: "Behind-the-scenes" },
    { id: "fetish", label: "Fetish/Niche" },
  ];

  // Voice tone options
  const voiceToneOptions = [
    { id: "playful", label: "Playful" },
    { id: "dominant", label: "Dominant" },
    { id: "flirty", label: "Flirty" },
    { id: "soft", label: "Soft/Sweet" },
    { id: "masculine", label: "Masculine" },
    { id: "feminine", label: "Feminine" },
    { id: "androgynous", label: "Androgynous" },
  ];

  // Upload frequency options
  const uploadFrequencyOptions = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "biweekly", label: "Bi-weekly" },
  ];

  // Fetch brand strategy data
  const { data: brandData, isLoading } = useQuery({
    queryKey: ["/api/brand-strategy"],
    enabled: false, // Disabled for now, would be enabled in a real app
  });

  // Update brand strategy mutation
  const updateBrandStrategy = useMutation({
    mutationFn: async (data: BrandStrategyValues) => {
      return apiRequest("PUT", "/api/brand-strategy", data);
    },
    onSuccess: () => {
      toast({
        title: "Brand strategy updated",
        description: "Your brand strategy has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-strategy"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was a problem updating your brand strategy.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: BrandStrategyValues) => {
    setIsUpdating(true);
    
    // If there's a file, upload it first
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      
      apiRequest("POST", "/api/content/example-upload", formData)
        .then(() => {
          // Then update the brand strategy data
          updateBrandStrategy.mutate(data, {
            onSettled: () => setIsUpdating(false),
          });
        })
        .catch(() => {
          toast({
            title: "Upload failed",
            description: "There was a problem uploading your content example.",
            variant: "destructive",
          });
          setIsUpdating(false);
        });
    } else {
      // Just update the brand strategy data if no file
      updateBrandStrategy.mutate(data, {
        onSettled: () => setIsUpdating(false),
      });
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Brand & Strategy</h1>
        <p className="text-gray-400 mt-1">Define your brand identity and content strategy</p>
      </div>

      <Card className="bg-background-card border-background-lighter mb-8">
        <CardHeader>
          <CardTitle>Brand Strategy</CardTitle>
          <CardDescription>Set your growth goals and define your content approach</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="brand-strategy-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Growth Goals Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Service Objectives & Growth Goals</h3>
                <p className="text-sm text-gray-400">
                  Select your primary objectives for using our services
                </p>
                <FormField
                  control={form.control}
                  name="growthGoals"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {growthGoalsOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="growthGoals"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 bg-background-lighter p-4 rounded-md"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-white">
                                    {option.label}
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

              <Separator className="bg-background-lighter" />

              {/* Content Types Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Content Strategy</h3>
                <p className="text-sm text-gray-400">
                  Select the types of content you want to focus on
                </p>
                <FormField
                  control={form.control}
                  name="contentTypes"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {contentTypesOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="contentTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 bg-background-lighter p-4 rounded-md"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-white">
                                    {option.label}
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
                  name="uploadFrequency"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Upload Frequency</FormLabel>
                      <FormDescription>
                        How often would you like content to be uploaded to your platforms?
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-4 mt-2"
                        >
                          {uploadFrequencyOptions.map((option) => (
                            <FormItem key={option.id}>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={option.id}
                                    id={option.id}
                                    className="border-primary"
                                  />
                                  <FormLabel
                                    htmlFor={option.id}
                                    className="font-normal cursor-pointer"
                                  >
                                    {option.label}
                                  </FormLabel>
                                </div>
                              </FormControl>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-background-lighter" />

              {/* Personal Brand Identity */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Personal Brand Identity</h3>
                <FormField
                  control={form.control}
                  name="brandDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe your brand in 3 words</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Playful, Authentic, Bold"
                          className="bg-background-lighter"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These key words help us understand your brand essence
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voiceTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice & Tone</FormLabel>
                      <FormDescription>
                        Select the tone that best represents your brand personality
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"
                        >
                          {voiceToneOptions.map((option) => (
                            <FormItem
                              key={option.id}
                              className="bg-background-lighter p-3 rounded-md flex items-center space-x-2"
                            >
                              <FormControl>
                                <RadioGroupItem
                                  value={option.id}
                                  id={option.id}
                                  className="border-primary"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor={option.id}
                                className="font-normal cursor-pointer"
                              >
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="doNotSayTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do-Not-Say Terms or Triggers</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter terms or topics you want to avoid in your content..."
                          className="min-h-24 bg-background-lighter"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        List any words, phrases, or topics you prefer not to use in your content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-background-lighter" />

              {/* Existing Content */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Existing Content</h3>
                <FormField
                  control={form.control}
                  name="existingContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Links to Existing Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter links to your existing content or profiles..."
                          className="min-h-24 bg-background-lighter"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Share links to your existing content, platforms, or social media profiles
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Example Content Upload */}
                <div className="mt-6">
                  <h4 className="text-white font-medium mb-2">Upload Sample Content</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Optionally upload examples of content you've created or content that inspires you
                  </p>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <div className="mb-4 text-gray-400">
                      <Upload className="h-8 w-8 mx-auto" />
                    </div>
                    <h3 className="text-white font-medium mb-2">
                      {file ? file.name : 'Drag & Drop Files Here'}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">or</p>
                    <div>
                      <input
                        id="content-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('content-upload')?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                    <p className="text-gray-500 text-xs mt-4">
                      Max file size: 25MB. Supported formats: JPG, PNG, PDF, ZIP
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-background-lighter pt-6">
          <Button
            type="submit"
            form="brand-strategy-form"
            disabled={isUpdating || !form.formState.isDirty}
          >
            {isUpdating ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </div>
            ) : (
              "Save Brand Strategy"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
