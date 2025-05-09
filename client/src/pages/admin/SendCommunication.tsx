import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserInfo } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CommunicationTemplate } from "@shared/schema";
import AdminLayout from "@/components/layouts/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

interface FormValues {
  templateId: string;
  recipientId: string;
  customParams: Record<string, string>;
}

export default function SendCommunication() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all users and templates
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["/api/communication-templates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // State to store the selected template
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  
  // Form setup
  const form = useForm<FormValues>({
    defaultValues: {
      templateId: '',
      recipientId: '',
      customParams: {}
    }
  });

  // Extract template parameters when template changes
  const extractTemplateParams = useCallback((content: string): string[] => {
    const regex = /{{([^{}]+)}}/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Skip default parameters that are automatically replaced
      if (!['recipientName', 'recipientEmail', 'date', 'time'].includes(match[1])) {
        matches.push(match[1]);
      }
    }
    
    // Return unique parameters
    return [...new Set(matches)];
  }, []);
  
  // Set template details when a template is selected
  useEffect(() => {
    const watchedTemplateId = form.watch('templateId');
    if (watchedTemplateId && templates) {
      const template = templates.find(t => t.id.toString() === watchedTemplateId);
      if (template) {
        setSelectedTemplate(template);
        
        // Initialize custom parameters
        const params = extractTemplateParams(template.content);
        const customParams: Record<string, string> = {};
        params.forEach(param => {
          customParams[param] = '';
        });
        
        form.setValue('customParams', customParams);
      }
    }
  }, [form.watch('templateId'), templates, extractTemplateParams, form]);
  
  // Mutation for sending communication
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/send-communication",
        values
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Communication sent",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communication-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send communication",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  // Loading state
  if (usersLoading || templatesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (usersError || templatesError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground">
            {usersError instanceof Error 
              ? usersError.message 
              : templatesError instanceof Error 
                ? templatesError.message 
                : "An unknown error occurred"}
          </p>
        </div>
      </AdminLayout>
    );
  }
  
  // Check if there are templates or users
  if (!templates || templates.length === 0 || !users || users.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">No Data Available</h2>
          <p className="text-muted-foreground mb-4">
            {!templates || templates.length === 0 
              ? "No communication templates found. Please create templates first." 
              : "No users found in the system."}
          </p>
          <Button asChild>
            <a href="/admin/template-management">Manage Templates</a>
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Communication</CardTitle>
            <CardDescription>
              Choose a template and recipient to send a communication via email, SMS, or in-app notification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Template Selection */}
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Communication Template</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name} ({template.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a template for the message content.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Recipient Selection */}
                  <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a recipient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: UserInfo) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the user who will receive this communication.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Show template details if one is selected */}
                {selectedTemplate && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Template Details</h3>
                    <div className="bg-secondary/30 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Type:</span>
                          <p className="capitalize">{selectedTemplate.type}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Category:</span>
                          <p className="capitalize">{selectedTemplate.category}</p>
                        </div>
                        {selectedTemplate.subject && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                            <p>{selectedTemplate.subject}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-sm font-medium text-muted-foreground block mb-1">Content:</span>
                        <div className="bg-background p-3 rounded border">
                          <p className="whitespace-pre-wrap">{selectedTemplate.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom Parameters */}
                {selectedTemplate && form.watch('customParams') && Object.keys(form.watch('customParams')).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Custom Parameters</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Fill in these values to replace the placeholders in the template.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(form.watch('customParams')).map((param) => (
                        <FormField
                          key={param}
                          control={form.control}
                          name={`customParams.${param}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{param}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={`Enter value for ${param}`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="min-w-[120px]"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>Send</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}