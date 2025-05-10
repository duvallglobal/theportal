import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Clock, MapPin, DollarSign, MessageSquare, Users, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the form schema
const appointmentFormSchema = z.object({
  clientId: z.string({
    required_error: "Please select a client",
  }),
  appointmentDate: z.date({
    required_error: "Please select a date",
  }),
  appointmentTime: z.string({
    required_error: "Please select a time",
  }),
  duration: z.string().transform(val => parseInt(val, 10)),
  location: z.string().min(1, "Please enter a location"),
  details: z.string().optional(),
  amount: z.string().min(1, "Please enter an amount"),
  photoUrl: z.string().optional(),
  notificationMethod: z.enum(["email", "sms", "in-app", "all"], {
    required_error: "Please select a notification method",
  }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentWidget({ isOpen, onClose }: AppointmentWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      details: "",
      photoUrl: "",
      notificationMethod: "all",
    },
  });

  // Get all clients
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/users/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/clients");
      return res.json();
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => { // Using any to bypass the TS error
      const res = await apiRequest("POST", "/api/appointments/propose", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment proposed",
        description: "The appointment proposal has been sent to the client.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/admin"] });
      onClose();
      form.reset();
      setSelectedImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to propose appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          form.setValue("photoUrl", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission
  const onSubmit = (data: AppointmentFormValues) => {
    // Combine date and time 
    const [hours, minutes] = data.appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(data.appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    // Create appointment payload
    const appointmentData = {
      ...data,
      appointmentDate: appointmentDateTime.toISOString()
    };
    
    createAppointmentMutation.mutate(appointmentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">New Appointment Proposal</DialogTitle>
          <DialogDescription>
            Create a new appointment proposal to send to a client.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client selection */}
              <div>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Users className="h-4 w-4 inline mr-2" />
                        Select Client
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingClients ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            clients?.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.fullName} ({client.username})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the client to propose this appointment to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date picker */}
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col mt-4">
                      <FormLabel>
                        <CalendarIcon className="h-4 w-4 inline mr-2" />
                        Appointment Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date when the appointment will take place.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Time picker */}
                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Clock className="h-4 w-4 inline mr-2" />
                        Appointment Time
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, hour) => {
                            return (
                              <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                {hour === 0 ? '12:00 AM' : 
                                 hour < 12 ? `${hour}:00 AM` : 
                                 hour === 12 ? '12:00 PM' : 
                                 `${hour - 12}:00 PM`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The time when the appointment will begin.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Clock className="h-4 w-4 inline mr-2" />
                        Duration (minutes)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        How long the appointment will last in minutes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Where the appointment will take place.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <DollarSign className="h-4 w-4 inline mr-2" />
                        Amount
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Financial compensation for the client.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notification method */}
                <FormField
                  control={form.control}
                  name="notificationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Notification Method
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select notification method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="in-app">In-App</SelectItem>
                          <SelectItem value="all">All Methods</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to notify the client about this appointment proposal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                {/* Photo upload */}
                <FormItem>
                  <FormLabel>
                    <Camera className="h-4 w-4 inline mr-2" />
                    Client Photo
                  </FormLabel>
                  <Card className="border-dashed border-2">
                    <CardContent className="pt-4 flex flex-col items-center justify-center">
                      {selectedImage ? (
                        <div className="relative">
                          <img
                            src={selectedImage}
                            alt="Selected client photo"
                            className="max-h-48 object-contain rounded-md mb-2"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={() => {
                              setSelectedImage(null);
                              form.setValue("photoUrl", "");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="h-48 w-full flex flex-col items-center justify-center">
                          <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Drag and drop an image, or click to browse
                          </p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        className={selectedImage ? "hidden" : ""}
                        onChange={handleImageUpload}
                      />
                    </CardContent>
                  </Card>
                  <FormDescription>
                    Attach a photo of the client for the appointment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                {/* Details */}
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Appointment Details
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter details about the encounter, expectations, or other relevant context."
                          className="h-40 resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information about the encounter.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createAppointmentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAppointmentMutation.isPending}
              >
                {createAppointmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Proposal...
                  </>
                ) : (
                  "Send Appointment Proposal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}