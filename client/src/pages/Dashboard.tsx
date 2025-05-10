import { useState, useEffect } from 'react';
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
  MapPin,
  LayoutList
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { OnboardingProgressCard } from '@/components/dashboard/OnboardingProgressCard';
import { WorkflowCard } from '@/components/dashboard/WorkflowCard';
import { RecentActivityCard, Activity } from '@/components/dashboard/RecentActivityCard';
import { AppointmentsCard, Appointment } from '@/components/dashboard/AppointmentsCard';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  LoadingSpinner, 
  FullPageLoading, 
  ButtonSpinner,
  SectionLoader,
  SkeletonLoader,
  TableLoader,
  CardLoader,
  DotsLoader,
  ProgressLoader,
  LoadingButton
} from '@/components/ui/loading';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  // User stats from API
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/client/stats'],
    enabled: true, // We'll handle the empty state in the UI
  });
  
  // Default empty stats array
  const stats = statsData?.length ? statsData : [];

  // Fetch recent activities from API
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/client/activities'],
    enabled: true, // We'll handle the empty state in the UI
  });
  
  // Default empty activities array
  const activities: Activity[] = activitiesData?.length ? activitiesData : [];

  // Fetch upcoming appointments from API
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/client/appointments'],
    enabled: true, // We'll handle the empty state in the UI
  });
  
  // Default empty appointments array
  const appointments: Appointment[] = appointmentsData?.length ? appointmentsData : [];

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

  // State for loading showcase progress
  const [progressValue, setProgressValue] = useState(0);
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  
  // Update the progress value
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 5;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

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
      {user && (
        <OnboardingProgressCard 
          completedSteps={user.onboardingStep || 0}
          totalSteps={8}
          className="mb-8"
        />
      )}

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentActivityCard activities={activities} />
        <AppointmentsCard appointments={appointments} />
      </div>
      
      {/* Loading Components Showcase */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Loading Components</CardTitle>
              <CardDescription>Showcase of elegant loading animations available throughout the platform</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowLoadingDemo(!showLoadingDemo)}
            >
              {showLoadingDemo ? 'Hide Demo' : 'Show Demo'}
            </Button>
          </div>
        </CardHeader>
        
        {showLoadingDemo && (
          <CardContent>
            <Tabs defaultValue="spinners" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="spinners">Spinners</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
                <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="fullpage">Full-page</TabsTrigger>
              </TabsList>
              
              <TabsContent value="spinners" className="mt-4 space-y-6">
                <h3 className="text-lg font-medium mb-4">Loading Spinners</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="xs" />
                    </div>
                    <span className="text-sm text-muted-foreground">Extra Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="sm" />
                    </div>
                    <span className="text-sm text-muted-foreground">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="md" />
                    </div>
                    <span className="text-sm text-muted-foreground">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="lg" />
                    </div>
                    <span className="text-sm text-muted-foreground">Large</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="xl" />
                    </div>
                    <span className="text-sm text-muted-foreground">Extra Large</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4 mt-8">Loading Spinner Variants</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="md" variant="default" />
                    </div>
                    <span className="text-sm text-muted-foreground">Default</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="md" variant="primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Primary</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="md" variant="secondary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Secondary</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 border rounded-md">
                      <LoadingSpinner size="md" variant="muted" />
                    </div>
                    <span className="text-sm text-muted-foreground">Muted</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4 mt-8">With Text</h3>
                <div className="flex justify-center">
                  <div className="p-6 border rounded-md">
                    <LoadingSpinner size="md" variant="primary" withText text="Loading data..." />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4 mt-8">Section Loading</h3>
                <SectionLoader height="h-28" text="Loading section content..." />
                
                <h3 className="text-lg font-medium mb-4 mt-8">Typing Indicator</h3>
                <div className="flex justify-center">
                  <div className="p-6 border rounded-md">
                    <DotsLoader />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="buttons" className="mt-4 space-y-6">
                <h3 className="text-lg font-medium mb-4">Loading Buttons</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <LoadingButton isLoading={true}>Submit Form</LoadingButton>
                    <span className="text-sm text-muted-foreground">Default Loading Button</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <LoadingButton isLoading={true} variant="secondary" loadingText="Saving changes...">Save Changes</LoadingButton>
                    <span className="text-sm text-muted-foreground">Secondary with Custom Text</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4 mt-8">Button Spinner Sizes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <Button className="gap-2">
                      <ButtonSpinner size="sm" />
                      Small Spinner
                    </Button>
                    <span className="text-sm text-muted-foreground">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Button className="gap-2">
                      <ButtonSpinner size="md" />
                      Medium Spinner
                    </Button>
                    <span className="text-sm text-muted-foreground">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Button className="gap-2">
                      <ButtonSpinner size="lg" />
                      Large Spinner
                    </Button>
                    <span className="text-sm text-muted-foreground">Large</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="skeletons" className="mt-4 space-y-6">
                <h3 className="text-lg font-medium mb-4">Skeleton Loaders</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <SkeletonLoader variant="text" />
                    <SkeletonLoader variant="text" className="w-2/3" />
                    <SkeletonLoader variant="text" className="w-1/2" />
                    <span className="text-sm text-muted-foreground block mt-2">Text Skeleton</span>
                  </div>
                  
                  <div className="space-y-2">
                    <SkeletonLoader variant="image" />
                    <span className="text-sm text-muted-foreground block mt-2">Image Skeleton</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4">Card Skeleton</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <CardLoader />
                  <CardLoader />
                  <CardLoader />
                </div>
                
                <h3 className="text-lg font-medium mb-4 mt-8">Table Skeleton</h3>
                <TableLoader rowCount={3} columnCount={4} />
              </TabsContent>
              
              <TabsContent value="progress" className="mt-4 space-y-6">
                <h3 className="text-lg font-medium mb-4">Progress Bars</h3>
                
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Default</span>
                      <span>{progressValue}%</span>
                    </div>
                    <ProgressLoader progress={progressValue} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Medium Height</span>
                      <span>{progressValue}%</span>
                    </div>
                    <ProgressLoader progress={progressValue} height="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Large Height</span>
                      <span>{progressValue}%</span>
                    </div>
                    <ProgressLoader progress={progressValue} height="h-4" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fullpage" className="mt-4 space-y-6">
                <h3 className="text-lg font-medium mb-4">Full-page Loading Overlay Demo</h3>
                <p className="text-muted-foreground mb-4">
                  Full-page loading animations are used when the entire page is loading, such as during authentication or 
                  initial page load. Click the button below to see a demonstration.
                </p>
                
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      const overlay = document.createElement('div');
                      overlay.className = 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center';
                      
                      const container = document.createElement('div');
                      container.className = 'flex flex-col items-center gap-3';
                      
                      const spinner = document.createElement('div');
                      spinner.className = 'animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent';
                      
                      const text = document.createElement('p');
                      text.className = 'text-muted-foreground text-sm';
                      text.textContent = 'Loading page content...';
                      
                      container.appendChild(spinner);
                      container.appendChild(text);
                      overlay.appendChild(container);
                      
                      document.body.appendChild(overlay);
                      
                      setTimeout(() => {
                        document.body.removeChild(overlay);
                      }, 3000);
                    }}
                  >
                    Show Full-page Loading (3s)
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
