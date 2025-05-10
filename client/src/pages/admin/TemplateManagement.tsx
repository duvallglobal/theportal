import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Bell, Plus, Edit, Trash2, FileText, CheckCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommunicationTemplate } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function TemplateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "email",
    category: "appointment",
    subject: "",
    content: "",
    isDefault: false
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<CommunicationTemplate[]>({
    queryKey: ["/api/communication-templates"],
    onSuccess: (data) => {
      console.log("Loaded templates:", data);
    },
    onError: (error) => {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load communication templates",
        variant: "destructive"
      });
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/communication-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-templates"] });
      toast({
        title: "Success",
        description: "Communication template created successfully",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create communication template",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/communication-templates/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-templates"] });
      toast({
        title: "Success",
        description: "Communication template updated successfully",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update communication template",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/communication-templates/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-templates"] });
      toast({
        title: "Success",
        description: "Communication template deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete communication template",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      type: "email",
      category: "appointment",
      subject: "",
      content: "",
      isDefault: false
    });
    setSelectedTemplate(null);
  };

  // UI handlers
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isDefault: e.target.checked }));
  };

  const handleCreateTemplate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject || "",
      content: template.content,
      isDefault: template.isDefault || false
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = (template: CommunicationTemplate) => {
    if (window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate) {
      updateMutation.mutate({ ...formData, id: selectedTemplate.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter templates based on selected tab and search term
  const filteredTemplates = templates.filter(template => {
    const matchesTab = selectedTab === "all" || template.type === selectedTab;
    const matchesSearch = 
      searchTerm === "" || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.subject && template.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Helper for icon rendering
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "notification":
        return <Bell className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Communication Templates</h1>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between">
          <Tabs defaultValue="all" className="w-full" value={selectedTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="notification" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notification
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-1/3">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Communication Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">
                  {searchTerm
                    ? "No templates match your search."
                    : "No templates found. Create your first template to get started."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[150px]">Category</TableHead>
                      <TableHead className="hidden md:table-cell">Subject/Content</TableHead>
                      <TableHead className="w-[100px]">Default</TableHead>
                      <TableHead className="w-[150px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {renderTypeIcon(template.type)}
                            <span className="capitalize">{template.type}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{template.category}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="max-h-24 overflow-hidden text-ellipsis">
                            {template.type === "email" && template.subject && (
                              <p className="font-semibold text-sm">{template.subject}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.content}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.isDefault && (
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Default
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteTemplate(template)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? "Update the details of the existing template."
                : "Create a new communication template for emails, SMS, or in-app notifications."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Welcome Email"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="verification">Verification</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {formData.type === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Your Appointment has been confirmed"
                    value={formData.subject}
                    onChange={handleFormChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">
                  Template Content {formData.type === "sms" && "(160 chars recommended)"}
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder={
                    formData.type === "email"
                      ? "Hi {{name}},\n\nThank you for booking an appointment..."
                      : formData.type === "sms"
                      ? "Your appointment is confirmed for {{date}} at {{time}}. Reply YES to confirm or call {{phone}} to reschedule."
                      : "{{name}} has booked an appointment for {{date}}."
                  }
                  className="min-h-32"
                  required
                  value={formData.content}
                  onChange={handleFormChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variables like {{name}}, {{date}}, {{time}} that will be replaced with actual values.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={handleDefaultChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isDefault" className="text-sm font-normal">
                  Set as default template for this type and category
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>Saving...</>
                ) : (
                  <>{selectedTemplate ? "Update" : "Create"} Template</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}