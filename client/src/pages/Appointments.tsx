import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, addHours } from 'date-fns';
import {
  CalendarIcon,
  MapPin,
  User,
  Clock,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// Sample appointment data
const appointments = [
  {
    id: '1',
    title: 'Client Meeting',
    clientName: 'John Smith',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 2, // hours
    location: 'Downtown Hotel, Room 315',
    notes: 'Client requested discretion, first-time meeting',
    status: 'confirmed',
  },
  {
    id: '2',
    title: 'Photo Session',
    clientName: 'Studio X Photography',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // In 4 days
    duration: 3, // hours
    location: 'Studio One, 123 Main St',
    notes: 'Bring 3 outfit changes, makeup will be provided',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Video Shoot',
    clientName: 'Creative Productions',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
    duration: 5, // hours
    location: 'Beach Location - details to be confirmed',
    notes: 'Outdoor shoot, weather dependent',
    status: 'pending',
  }
];

const statusColors = {
  confirmed: 'text-green-400 bg-green-400 bg-opacity-10',
  pending: 'text-yellow-400 bg-yellow-400 bg-opacity-10',
  cancelled: 'text-red-400 bg-red-400 bg-opacity-10',
};

const statusIcons = {
  confirmed: <CheckCircle className="h-5 w-5 text-green-400" />,
  pending: <AlertCircle className="h-5 w-5 text-yellow-400" />,
  cancelled: <XCircle className="h-5 w-5 text-red-400" />,
};

export default function Appointments() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [viewingAppointment, setViewingAppointment] = useState<any | null>(null);
  
  // Filter appointments for the selected date
  const filteredAppointments = date 
    ? appointments.filter(apt => 
        apt.date.getDate() === date.getDate() && 
        apt.date.getMonth() === date.getMonth() &&
        apt.date.getFullYear() === date.getFullYear()
      )
    : [];

  const handleConfirmAppointment = (appointmentId: string) => {
    toast({
      title: "Appointment confirmed",
      description: "The appointment has been confirmed successfully.",
    });
  };

  const handleCancelAppointment = (appointmentId: string) => {
    toast({
      title: "Appointment cancelled",
      description: "The appointment has been cancelled.",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Appointments</h1>
        <p className="text-gray-400 mt-1">View and manage your appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="bg-background-card border-background-lighter lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Calendar</CardTitle>
            <CardDescription>Select a date to view appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="bg-background-lighter rounded-md p-4"
            />
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="bg-background-card border-background-lighter lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">
              {date ? format(date, 'MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              {filteredAppointments.length === 0 
                ? 'No appointments scheduled for this day' 
                : `${filteredAppointments.length} appointment(s) scheduled`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400">No appointments for this day</p>
                  <Button variant="outline" className="mt-4">
                    Request an Appointment
                  </Button>
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="p-4 bg-background-lighter rounded-lg cursor-pointer hover:bg-background-card transition-colors"
                    onClick={() => setViewingAppointment(apt)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-medium">{apt.title}</h3>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <User className="h-4 w-4 mr-2" />
                          <span>{apt.clientName}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full flex items-center ${statusColors[apt.status as keyof typeof statusColors]}`}>
                        {statusIcons[apt.status as keyof typeof statusIcons]}
                        <span className="ml-1 text-xs font-medium">
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {format(apt.date, 'h:mm a')} - {format(addHours(apt.date, apt.duration), 'h:mm a')}
                        <span className="ml-1 text-gray-500">{apt.duration}hr</span>
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm mt-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{apt.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Upcoming Appointments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt) => (
            <Card key={apt.id} className="bg-background-card border-background-lighter">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{apt.title}</CardTitle>
                  <div className={`px-3 py-1 rounded-full flex items-center ${statusColors[apt.status as keyof typeof statusColors]}`}>
                    {statusIcons[apt.status as keyof typeof statusIcons]}
                    <span className="ml-1 text-xs font-medium">
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {format(apt.date, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {format(apt.date, 'h:mm a')} - {format(addHours(apt.date, apt.duration), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <User className="h-4 w-4 mr-2" />
                    <span>{apt.clientName}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{apt.location}</span>
                  </div>
                  <div className="flex items-start text-gray-300">
                    <Info className="h-4 w-4 mr-2 mt-1" />
                    <span className="text-sm">{apt.notes}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingAppointment(apt)}
                >
                  View Details
                </Button>
                {apt.status === 'pending' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConfirmAppointment(apt.id)}
                  >
                    Confirm
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={!!viewingAppointment} onOpenChange={(open) => !open && setViewingAppointment(null)}>
        {viewingAppointment && (
          <DialogContent className="bg-background-card text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">{viewingAppointment.title}</DialogTitle>
              <DialogDescription>
                Appointment details and options
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Status</div>
                <div className={`px-3 py-1 rounded-full flex items-center ${statusColors[viewingAppointment.status]}`}>
                  {statusIcons[viewingAppointment.status]}
                  <span className="ml-1 text-sm font-medium">
                    {viewingAppointment.status.charAt(0).toUpperCase() + viewingAppointment.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Date & Time</div>
                <div className="text-white">
                  {format(viewingAppointment.date, 'EEEE, MMMM d, yyyy')} · {format(viewingAppointment.date, 'h:mm a')}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Duration</div>
                <div className="text-white">{viewingAppointment.duration} hours</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Client</div>
                <div className="text-white">{viewingAppointment.clientName}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Location</div>
                <div className="text-white">{viewingAppointment.location}</div>
              </div>
              <div className="pt-2">
                <div className="text-gray-400 mb-2">Notes</div>
                <div className="bg-background-lighter p-3 rounded-lg text-white text-sm">
                  {viewingAppointment.notes}
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {viewingAppointment.status !== 'cancelled' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleCancelAppointment(viewingAppointment.id);
                    setViewingAppointment(null);
                  }}
                >
                  Cancel Appointment
                </Button>
              )}
              {viewingAppointment.status === 'pending' && (
                <Button
                  onClick={() => {
                    handleConfirmAppointment(viewingAppointment.id);
                    setViewingAppointment(null);
                  }}
                >
                  Confirm Appointment
                </Button>
              )}
              {viewingAppointment.status === 'confirmed' && (
                <Button onClick={() => setViewingAppointment(null)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
