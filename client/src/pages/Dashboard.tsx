import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  User, 
  Target, 
  Upload, 
  Calendar,
  MessageSquare,
  CheckCircle,
  CloudUpload,
  CreditCard,
  Users, 
  LineChart,
  TrendingUp,
  Calendar as CalendarIcon,
  MapPin 
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { OnboardingProgressCard } from '@/components/dashboard/OnboardingProgressCard';
import { WorkflowCard } from '@/components/dashboard/WorkflowCard';
import { RecentActivityCard, Activity } from '@/components/dashboard/RecentActivityCard';
import { AppointmentsCard, Appointment } from '@/components/dashboard/AppointmentsCard';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  // Mock data for dashboard stats
  const stats = [
    {
      title: "OnlyFans Subscribers",
      value: "753",
      icon: <Users className="text-red-400" />,
      iconBgColor: "bg-primary bg-opacity-20",
      trend: { direction: 'up', value: '12% from last month' }
    },
    {
      title: "Content Uploads",
      value: "24",
      icon: <Upload className="text-blue-400" />,
      iconBgColor: "bg-blue-500 bg-opacity-20",
      trend: { direction: 'neutral', value: 'Same as last week' }
    },
    {
      title: "Engagement Rate",
      value: "18.2%",
      icon: <LineChart className="text-purple-400" />,
      iconBgColor: "bg-purple-500 bg-opacity-20",
      trend: { direction: 'up', value: '3.1% increase' }
    },
    {
      title: "Next Payment",
      value: "$199",
      icon: <CreditCard className="text-green-400" />,
      iconBgColor: "bg-green-500 bg-opacity-20",
      additionalInfo: 'Due in 7 days'
    }
  ];

  // Recent activities
  const activities: Activity[] = [
    {
      id: '1',
      title: 'Content approved',
      description: 'Your latest photo set was approved',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: <CheckCircle className="h-4 w-4 text-green-400" />,
      iconBgColor: 'bg-green-500 bg-opacity-20'
    },
    {
      id: '2',
      title: 'Content uploaded',
      description: 'You uploaded 5 new photos',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: <CloudUpload className="h-4 w-4 text-blue-400" />,
      iconBgColor: 'bg-blue-500 bg-opacity-20'
    },
    {
      id: '3',
      title: 'Payment processed',
      description: 'Monthly subscription payment processed',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      icon: <CreditCard className="h-4 w-4 text-yellow-400" />,
      iconBgColor: 'bg-yellow-500 bg-opacity-20'
    }
  ];

  // Upcoming appointments
  const appointments: Appointment[] = [
    {
      id: '1',
      title: 'Client Meeting',
      status: 'confirmed',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      location: 'Downtown Hotel, Room 315'
    },
    {
      id: '2',
      title: 'Photo Session',
      status: 'pending',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // In 4 days
      location: 'Studio One, 123 Main St'
    }
  ];

  // Workflow cards
  const workflowCards = [
    {
      title: 'Profile & Account Access',
      description: 'Manage your profile details and platform credentials.',
      icon: <User className="text-yellow-400" />,
      iconBgColor: 'bg-yellow-500 bg-opacity-20',
      linkText: 'Update Profile',
      linkPath: '/profile'
    },
    {
      title: 'Content Upload',
      description: 'Upload and manage your content for review.',
      icon: <Upload className="text-blue-400" />,
      iconBgColor: 'bg-blue-500 bg-opacity-20',
      linkText: 'Upload Content',
      linkPath: '/content-upload'
    },
    {
      title: 'Brand Strategy',
      description: 'Define your brand voice and content strategy.',
      icon: <Target className="text-purple-400" />,
      iconBgColor: 'bg-purple-500 bg-opacity-20',
      linkText: 'Update Strategy',
      linkPath: '/brand-strategy'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your profile.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgColor={stat.iconBgColor}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Onboarding Progress */}
      <OnboardingProgressCard 
        completedSteps={5}
        totalSteps={8}
        className="mb-8"
      />

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {workflowCards.map((card, index) => (
          <WorkflowCard
            key={index}
            title={card.title}
            description={card.description}
            icon={card.icon}
            iconBgColor={card.iconBgColor}
            linkText={card.linkText}
            linkPath={card.linkPath}
          />
        ))}
      </div>

      {/* Recent Activity and Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard activities={activities} />
        <AppointmentsCard appointments={appointments} />
      </div>
    </div>
  );
}
