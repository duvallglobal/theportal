import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, DollarSign, MapPin, ShieldCheck, Users } from "lucide-react";

// Define Rent.Men concierge schema
const rentMenSchema = z.object({
  geographicAvailability: z.string().min(1, { message: "Please enter your geographic availability" }),
  minimumRate: z.string().min(1, { message: "Please enter your minimum rate" }),
  clientScreeningPreferences: z.string().min(1, { message: "Please describe your screening preferences" }),
  servicesOffered: z.array(z.string()).min(1, { message: "Select at least one service" }),
  approvalProcess: z.enum(["auto", "manual"], { required_error: "Please select an approval process" }),
  bookingSummaryPreferences: z.array(z.string()).min(1, { message: "Select at least one booking summary preference" }),
  availabilityTimes: z.array(z.object({
    day: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    available: z.boolean().default(false),
  })),
  receiveBookingAlerts: z.boolean().default(true),
  showOnlyVerifiedClients: z.boolean().default(true),
});

type RentMenValues = z.infer<typeof rentMenSchema>;

// Booking type
interface Booking {
  id: string;
  clientName: string;
  date: Date;
  time: string;
  duration: number;
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  rate: string;
  notes?: string;
}

export default function RentMen() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Define form with default values
  const form = useForm<RentMenValues>({
    resolver: zodResolver(rentMenSchema),
    defaultValues: {
      geographicAvailability: "",
      minimumRate: "",
      clientScreeningPreferences: "",
      servicesOffered: [],
      approvalProcess: "manual",
      bookingSummaryPreferences: [],
      availabilityTimes: [
        { day: "Monday", available: false },
        { day: "Tuesday", available: false },
        { day: "Wednesday", available: false },
        { day: "Thursday", available: false },
        { day: "Friday", available: false },
        { day: "Saturday", available: false },
        { day: "Sunday", available: false },
      ],
      receiveBookingAlerts: true,
      showOnlyVerifiedClients: true,
    },
  });

  // Services offered options
  const servicesOptions = [
    { id: "massage", label: "Massage" },
    { id: "companionship", label: "Companionship" },
    { id: "dinner-date", label: "Dinner Date" },
    { id: "travel-companion", label: "Travel Companion" },
    { id: "coaching", label: "Coaching/Training" },
    { id: "custom", label: "Custom Experience" },
  ];

  // Booking summary preferences options
  const bookingSummaryOptions = [
    { id: "photos", label: "Client photos" },
    { id: "requests", label: "Detailed service requests" },
    { id: "addresses", label: "Full addresses" },
    { id: "contact", label: "Client contact info" },
    { id: "history", label: "Booking history" },
  ];

  // Fetch Rent.Men profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/rent-men/profile"],
    enabled: false, // Disabled for now, would be enabled in a real app
  });

  // Update Rent.Men profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: RentMenValues) => {
      return apiRequest("PUT", "/api/rent-men/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your Rent.Men profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rent-men/profile"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: RentMenValues) => {
    setIsUpdating(true);
    updateProfile.mutate(data, {
      onSettled: () => setIsUpdating(false),
    });
  };

  // Mock upcoming bookings
  const upcomingBookings: Booking[] = [
    {
      id: "1",
      clientName: "John D.",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      time: "7:00 PM",
      duration: 2,
      location: "Downtown Hotel, Chicago",
      status: 'confirmed',
      rate: "$300",
      notes: "Client requested a relaxing massage experience.",
    },
    {
      id: "2",
      clientName: "Michael R.",
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      time: "8:30 PM",
      duration: 1.5,
      location: "Private Residence, North Side",
      status: 'pending',
      rate: "$250",
      notes: "First-time client, prefers conversation before session.",
    },
    {
      id: "3",
      clientName: "Robert T.",
      date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      time: "6:00 PM",
      duration: 3,
      location: "Luxury Hotel, Michigan Ave",
      status: 'pending',
      rate: "$450",
      notes: "Dinner date followed by massage session.",
    }
  ];

  // Mock booking history
  const bookingHistory: Booking[] = [
    {
      id: "h1",
      clientName: "James L.",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      time: "8:00 PM",
      duration: 2,
      location: "Downtown Hotel, Chicago",
      status: 'confirmed',
      rate: "$300",
    },
    {
      id: "h2",
      clientName: "William B.",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      time: "7:30 PM",
      duration: 1.5,
      location: "Private Residence, West Loop",
      status: 'confirmed',
      rate: "$250",
    },
    {
      id: "h3",
      clientName: "Alex M.",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      time: "9:00 PM",
      duration: 1,
      location: "Boutique Hotel, Lincoln Park",
      status: 'cancelled',
      rate: "$200",
    }
  ];

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Rent.Men Concierge</h1>
        <p className="text-gray-400 mt-1">Manage your Rent.Men profile, bookings, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-background-card border-background-lighter">
            <CardHeader>
              <CardTitle>Rent.Men Profile</CardTitle>
              <CardDescription>Manage your availability, services, and booking preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="rent-men-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Geographic Availability */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium text-white">Geographic Availability</h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="geographicAvailability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Areas</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Downtown Chicago, North Side, West Loop"
                              className="bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the neighborhoods or areas where you provide services
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-background-lighter" />

                  {/* Services & Rates */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium text-white">Services & Rates</h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="minimumRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Rate</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="e.g., 200"
                                className="pl-10 bg-background-lighter"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Your minimum rate per hour (USD)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicesOffered"
                      render={() => (
                        <FormItem>
                          <FormLabel>Services Offered</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {servicesOptions.map((option) => (
                              <FormField
                                key={option.id}
                                control={form.control}
                                name="servicesOffered"
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

                  {/* Availability */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium text-white">Availability Schedule</h3>
                    </div>
                    <div className="space-y-3">
                      {form.getValues().availabilityTimes.map((_, index) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name={`availabilityTimes.${index}.available`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-4 space-y-0 bg-background-lighter p-4 rounded-md">
                              <FormLabel className="w-24 text-white">
                                {form.getValues().availabilityTimes[index].day}
                              </FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              {field.value && (
                                <div className="flex items-center space-x-2">
                                  <FormField
                                    control={form.control}
                                    name={`availabilityTimes.${index}.startTime`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col space-y-1">
                                        <FormLabel className="text-xs text-gray-400">From</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="time"
                                            className="w-24 bg-background"
                                            {...field}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`availabilityTimes.${index}.endTime`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col space-y-1">
                                        <FormLabel className="text-xs text-gray-400">To</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="time"
                                            className="w-24 bg-background"
                                            {...field}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-background-lighter" />

                  {/* Client Screening */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium text-white">Client Screening</h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="clientScreeningPreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Screening Preferences</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your screening requirements..."
                              className="min-h-24 bg-background-lighter"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Specify what information you require from potential clients
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showOnlyVerifiedClients"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 bg-background-lighter rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-white">Verified Clients Only</FormLabel>
                            <FormDescription>
                              Only show booking requests from verified clients
                            </FormDescription>
                          </div>
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

                  <Separator className="bg-background-lighter" />

                  {/* Booking Approval */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CalendarCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium text-white">Booking Approval Process</h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="approvalProcess"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>How would you like to handle booking requests?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0 bg-background-lighter p-4 rounded-md">
                                <FormControl>
                                  <RadioGroupItem value="auto" />
                                </FormControl>
                                <FormLabel className="font-normal text-white">
                                  Auto-confirm bookings that meet my criteria
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0 bg-background-lighter p-4 rounded-md">
                                <FormControl>
                                  <RadioGroupItem value="manual" />
                                </FormControl>
                                <FormLabel className="font-normal text-white">
                                  I'll manually review each booking request
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bookingSummaryPreferences"
                      render={() => (
                        <FormItem>
                          <FormLabel>Booking Summary Preferences</FormLabel>
                          <FormDescription>
                            Select what information should be included in booking summaries sent to you
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {bookingSummaryOptions.map((option) => (
                              <FormField
                                key={option.id}
                                control={form.control}
                                name="bookingSummaryPreferences"
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
                      name="receiveBookingAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 bg-background-lighter rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-white">Booking Alerts</FormLabel>
                            <FormDescription>
                              Receive notifications for new booking requests
                            </FormDescription>
                          </div>
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
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t border-background-lighter pt-6 flex justify-end">
              <Button
                type="submit"
                form="rent-men-form"
                disabled={isUpdating || !form.formState.isDirty}
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Upcoming Bookings */}
            <Card className="bg-background-card border-background-lighter">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Upcoming Bookings</CardTitle>
                </div>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-3 text-gray-500" />
                      <p>No upcoming bookings</p>
                    </div>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <div key={booking.id} className="bg-background-lighter rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-white font-medium">{booking.clientName}</h3>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                                booking.status === 'confirmed' 
                                  ? 'bg-green-500 bg-opacity-20 text-green-400' 
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                                  : 'bg-red-500 bg-opacity-20 text-red-400'
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-primary font-medium mt-1">{booking.rate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{formatDate(booking.date)}</p>
                            <p className="text-gray-400 text-sm">
                              {booking.time} ({booking.duration} {booking.duration === 1 ? 'hour' : 'hours'})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{booking.location}</span>
                        </div>
                        {booking.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-sm text-gray-400">{booking.notes}</p>
                          </div>
                        )}
                        {booking.status === 'pending' && (
                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" className="w-full">Accept</Button>
                            <Button size="sm" variant="destructive" className="w-full">Decline</Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Booking History */}
            <Card className="bg-background-card border-background-lighter">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Booking History</CardTitle>
                </div>
                <CardDescription>Your past appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-gray-500" />
                      <p>No booking history</p>
                    </div>
                  ) : (
                    bookingHistory.map((booking) => (
                      <div key={booking.id} className="bg-background-lighter rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-white font-medium">{booking.clientName}</h3>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                                booking.status === 'confirmed' 
                                  ? 'bg-green-500 bg-opacity-20 text-green-400' 
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                                  : 'bg-red-500 bg-opacity-20 text-red-400'
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-primary font-medium mt-1">{booking.rate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{formatDate(booking.date)}</p>
                            <p className="text-gray-400 text-sm">
                              {booking.time} ({booking.duration} {booking.duration === 1 ? 'hour' : 'hours'})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{booking.location}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-background-lighter pt-4 flex justify-center">
                <Button variant="link" className="text-primary">
                  View All History
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-background-card border-background-lighter">
            <CardHeader>
              <CardTitle>Privacy & Security Settings</CardTitle>
              <CardDescription>Manage your privacy preferences for Rent.Men</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Profile Visibility</h3>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Profile Active Status</p>
                    <p className="text-sm text-gray-400">Make your profile visible to potential clients</p>
                  </div>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Show Profile Photo</p>
                    <p className="text-sm text-gray-400">Display your profile photo in search results</p>
                  </div>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Hide Location Details</p>
                    <p className="text-sm text-gray-400">Show only city/area without specific details</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </div>
              
              <Separator className="bg-background-lighter" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Contact Preferences</h3>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive booking alerts via email</p>
                  </div>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-400">Receive booking alerts via SMS</p>
                  </div>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Marketing Communications</p>
                    <p className="text-sm text-gray-400">Receive updates about platform features</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </div>
              
              <Separator className="bg-background-lighter" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Security</h3>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Enhanced Privacy Mode</p>
                    <p className="text-sm text-gray-400">Hide your profile from search engines</p>
                  </div>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background-lighter rounded-md">
                  <div>
                    <p className="text-white font-medium">Geo-blocking</p>
                    <p className="text-sm text-gray-400">Restrict profile visibility by location</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-background-lighter pt-6 flex justify-between">
              <Button variant="outline" className="text-red-500 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-20">
                Deactivate Profile
              </Button>
              <Button>
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
