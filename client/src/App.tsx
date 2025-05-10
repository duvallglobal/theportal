import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useEffect } from "react";
import { SidebarLayout } from "./components/layouts/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import BrandStrategy from "./pages/BrandStrategy";
import ContentUpload from "./pages/ContentUpload";
import Billing from "./pages/Billing";
import Appointments from "./pages/Appointments";
import Messages from "./pages/Messages";
import RentMen from "./pages/RentMen";
import Analytics from "./pages/Analytics";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDetails from "./pages/admin/UserDetails";
import AppointmentManager from "./pages/admin/AppointmentManager";
import ContentViewer from "./pages/admin/ContentViewer";
import VerificationQueue from "./pages/admin/VerificationQueue";
import BillingManagement from "./pages/admin/BillingManagement";
import AdminMessaging from "./pages/admin/Messaging";
import ClientsManagement from "./pages/admin/ClientsManagement";
import TemplateManagement from "./pages/admin/TemplateManagement";
import CommunicationHistory from "./pages/admin/CommunicationHistory";
import SendCommunication from "./pages/admin/SendCommunication";
import { ThemeProvider } from "next-themes";
import { AdminRoute } from "./lib/admin-route";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { OnboardingTooltipContainer } from "./components/ui/onboarding-tooltip";
import { HelpButton } from "./components/ui/help-button";
import { MessagingProvider } from "./lib/context/MessagingProvider";
// Import the new loading components
import { LoadingSpinner, FullPageLoading } from "@/components/ui/loading";

// Component to handle root path redirects
function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/auth');
      }
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner size="lg" variant="primary" withText text="Loading..." />
    </div>
  );
}

// Auth wrapper to protect routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" withText text="Authenticating..." />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" withText text="Redirecting..." />
      </div>
    );
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/sign-in">
        <SignIn />
      </Route>
      <Route path="/sign-up">
        <SignUp />
      </Route>
      
      {/* Protected Client Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <SidebarLayout>
            <Dashboard />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute>
          <SidebarLayout>
            <Onboarding />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <SidebarLayout>
            <Profile />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/brand-strategy">
        <ProtectedRoute>
          <SidebarLayout>
            <BrandStrategy />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/content-upload">
        <ProtectedRoute>
          <SidebarLayout>
            <ContentUpload />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute>
          <SidebarLayout>
            <Billing />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute>
          <SidebarLayout>
            <Appointments />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <SidebarLayout>
            <Messages />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/rent-men">
        <ProtectedRoute>
          <SidebarLayout>
            <RentMen />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute>
          <SidebarLayout>
            <Analytics />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <AdminRoute path="/admin/dashboard" component={() => (
        <SidebarLayout>
          <AdminDashboard />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin" component={() => (
        <SidebarLayout>
          <AdminDashboard />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/users/:id" component={() => (
        <SidebarLayout>
          <UserDetails />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/appointments" component={() => (
        <SidebarLayout>
          <AppointmentManager />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/content-viewer" component={() => (
        <SidebarLayout>
          <ContentViewer />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/verification-queue" component={() => (
        <SidebarLayout>
          <VerificationQueue />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/billing-management" component={() => (
        <SidebarLayout>
          <BillingManagement />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/messaging" component={() => (
        <SidebarLayout>
          <AdminMessaging />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/clients" component={() => (
        <SidebarLayout>
          <ClientsManagement />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/clients/:id" component={() => (
        <SidebarLayout>
          <UserDetails />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/templates" component={() => (
        <SidebarLayout>
          <TemplateManagement />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/communication-history" component={() => (
        <SidebarLayout>
          <CommunicationHistory />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/send-communication" component={() => (
        <SidebarLayout>
          <SendCommunication />
        </SidebarLayout>
      )} />

      {/* Redirect from root to auth or dashboard */}
      <Route path="/">
        <RootRedirect />
      </Route>

      {/* 404 Fallback */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MessagingProvider>
            <OnboardingProvider>
              <TooltipProvider>
                <Router />
                <OnboardingTooltipContainer />
                <HelpButton />
                <Toaster />
              </TooltipProvider>
            </OnboardingProvider>
          </MessagingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
