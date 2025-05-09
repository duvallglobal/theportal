import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';

export interface Appointment {
  id: string;
  title: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  date: Date;
  location: string;
}

interface AppointmentsCardProps {
  appointments: Appointment[];
  className?: string;
}

const statusColors = {
  confirmed: 'bg-green-500 bg-opacity-20 text-green-400',
  pending: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
  cancelled: 'bg-red-500 bg-opacity-20 text-red-400',
};

export function AppointmentsCard({ appointments, className }: AppointmentsCardProps) {
  return (
    <div className={cn("bg-background-card rounded-xl shadow-md p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Upcoming Appointments</h3>
        <a href="#" className="text-sm text-primary hover:text-primary-light">View All</a>
      </div>
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No upcoming appointments</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="bg-background-lighter rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{appointment.title}</h4>
                <span className={cn("text-xs font-medium py-1 px-2 rounded-full", statusColors[appointment.status])}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center text-gray-400 text-sm mb-3">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{format(appointment.date, 'PPP, p')}</span>
              </div>
              <div className="flex items-center text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{appointment.location}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
